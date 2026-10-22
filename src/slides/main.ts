// The slide frame: Carolina Baptista's Nagarro Master Slides engine (window.NagarroSlides,
// vendored and pinned) renders decks here, isolated from the hub's styles. The host sends
// { type: 'render', deck, slides, mode, index }; the frame answers with its height or an error.
import '../styles/fonts.css'
import './frame.css'

type Spec = Record<string, unknown> & { template: string }
interface RenderMsg { v: 1; type: 'render'; frame: string; deck: Record<string, unknown>; slides: Spec[]; mode: 'list' | 'present' | 'single'; index?: number }
declare global {
  interface Window { NagarroSlides?: { config(o: { assetBase: string }): void; renderDeck(s: Spec[], d: Record<string, unknown>): string[] } }
}

const root = document.getElementById('deck')!
const frameId = new URLSearchParams(location.search).get('frame') ?? 'slides'
const post = (msg: Record<string, unknown>) => window.parent?.postMessage({ v: 1, frame: frameId, ...msg }, location.origin)
let last: RenderMsg | null = null
let index = 0

const view = (h: string, w: number) => {
  const s = w / 1920
  return `<div class="ns-viewport" style="width:${w}px;height:${Math.round(1080 * s)}px"><div class="ns-scaler" style="transform:scale(${s})">${h}</div></div>`
}

function draw() {
  if (!last) return
  const NS = window.NagarroSlides
  if (!NS) return post({ type: 'error', message: 'The Nagarro Master Slides engine did not load (public/vendor/nagarro-master-slides/bundle.js).' })
  try {
    NS.config({ assetBase: '/vendor/nagarro-master-slides/media/' })
    const html = NS.renderDeck(last.slides, last.deck)
    const w = Math.max(320, document.documentElement.clientWidth - (last.mode === 'list' ? 16 : 0))
    if (last.mode === 'list') root.innerHTML = html.map((h, i) => `<figure class="sf-slide" data-n="${i + 1}"><figcaption>${i + 1}</figcaption>${view(h, w - 32)}</figure>`).join('')
    else {
      const fit = last.mode === 'present' ? Math.min(window.innerWidth, (window.innerHeight * 16) / 9) : w
      root.innerHTML = `<div class="sf-present">${view(html[Math.min(index, html.length - 1)] ?? '', Math.floor(fit))}</div>`
    }
    document.body.classList.toggle('is-present', last.mode === 'present')
    post({ type: 'rendered', count: html.length })
    post({ type: 'height', h: document.documentElement.scrollHeight })
  } catch (e) {
    post({ type: 'error', message: e instanceof Error ? e.message : String(e) })
  }
}

window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return
  const m = e.data as RenderMsg
  if (!m || m.v !== 1 || m.type !== 'render' || m.frame !== frameId) return
  last = m
  index = m.index ?? 0
  draw()
})
window.addEventListener('resize', draw)
document.addEventListener('keydown', (e) => {
  if (!last || last.mode !== 'present') return
  if (e.key === 'ArrowRight' || e.key === ' ') index = Math.min(last.slides.length - 1, index + 1)
  else if (e.key === 'ArrowLeft') index = Math.max(0, index - 1)
  else if (e.key === 'Escape') return post({ type: 'exit' })
  else if (e.key.toLowerCase() === 'f') return void document.documentElement.requestFullscreen?.().catch(() => undefined)
  else return
  post({ type: 'index', index })
  draw()
})
post({ type: 'ready' })
