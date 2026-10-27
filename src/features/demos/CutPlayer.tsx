// Plays a social cut (src/fixtures/social-cuts.ts) on the real client demo: a 4:5 phone frame
// holding the demo in an iframe at phone width, zoomed onto each shot's focus, with the caption
// burned in. Same origin, so the player drives the page directly: the guide bar's own buttons,
// in-app navigation, typing. Nothing is simulated beyond what the client demo itself simulates.
//
// `/nagarro/demos/cut/:id` shows it with its script and notes; `/cut/:id?record=1` is the bare
// frame that `npm run clips` films (it starts by itself and sets data-cut-state="done" at the end).

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Copy, Play, RotateCcw } from 'lucide-react'
import { client, practice } from '@/app/routes'
import { useStore } from '@/state/store'
import { PageHead } from '@/shell/PageHead'
import { Chip, Panel } from '@/shell/ui'
import { socialCut, type Shot, type SocialCut } from '@/fixtures/social-cuts'

/** The page inside the frame renders at phone width; the frame scales it to fit. */
const INNER = { w: 540, h: 675 }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Hides the workspace chrome inside the frame: the cut shows the product, not the tool around it. */
const CUT_CSS = `.shell__top,.shell__side,.demobar,.demo-notice,.m-wipe{display:none!important}
.shell__main{padding:16px 14px 40px!important}.shell{grid-template-columns:1fr!important}
html{scroll-behavior:auto!important}`

function pathFor(open: string, slug: string) {
  return open.startsWith('/nagarro') ? open : `${client(slug).home}${open}`
}

function firstUrl(cut: SocialCut, slug: string) {
  const chapters = cut.shots.map((s) => s.chapter).filter(Boolean) as string[]
  if (chapters.length) return `${client(slug).home}?guide=custom&chapters=${[...new Set(chapters)].join(',')}`
  const open = cut.shots.find((s) => s.open)?.open
  const path = open ? pathFor(open, slug) : client(slug).home
  return path.startsWith('/client') ? `${path}?guide=off` : path
}

export function CutFrame({ cut, slug = 'demo-brand', autoplay, onState }: { cut: SocialCut; slug?: string; autoplay?: boolean; onState?: (s: 'idle' | 'playing' | 'done') => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(-1)
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'done'>('idle')
  const [zoom, setZoom] = useState({ s: 1, x: 0, y: 0 })
  const [fit, setFit] = useState(1)
  const run = useRef(0)

  useEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(() => setFit(el.clientWidth / INNER.w))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const doc = () => frame.current?.contentDocument ?? null
  const win = () => frame.current?.contentWindow ?? null

  const waitFor = async (sel: string, ms = 4000) => {
    for (let t = 0; t < ms; t += 100) {
      const el = doc()?.querySelector<HTMLElement>(sel)
      if (el) return el
      await sleep(100)
    }
    return null
  }

  const navigate = async (path: string) => {
    const w = win()
    if (!w) return
    w.history.pushState({}, '', path)
    w.dispatchEvent(new PopStateEvent('popstate'))
    await sleep(500)
  }

  const zoomTo = async (focus?: string) => {
    if (!focus) return setZoom({ s: 1, x: 0, y: 0 })
    const el = await waitFor(`[data-demo-focus="${focus}"]`)
    if (!el) return setZoom({ s: 1, x: 0, y: 0 })
    el.scrollIntoView({ block: 'center' })
    await sleep(150)
    const r = el.getBoundingClientRect()
    const s = Math.min(1.6, Math.max(1, (INNER.w * 0.92) / r.width))
    const clamp = (v: number, min: number) => Math.min(0, Math.max(min, v))
    setZoom({ s, x: clamp(INNER.w / 2 - s * (r.left + r.width / 2), INNER.w - s * INNER.w), y: clamp(INNER.h / 2 - s * (r.top + r.height / 2), INNER.h - s * INNER.h) })
  }

  const act = async (shot: Shot) => {
    const a = shot.action
    if (!a) return
    const d = doc()
    if (!d) return
    if (a === 'show-me') {
      ;(await waitFor('[data-testid="demo-show-me"]'))?.click()
      return
    }
    if ('click' in a) {
      const btn = [...d.querySelectorAll<HTMLElement>('button, a')].find((b) => b.textContent?.trim() === a.click)
      btn?.click()
      return
    }
    if ('type' in a) {
      const input = await waitFor(`[data-testid="${a.into}"]`)
      if (input instanceof (win() as unknown as typeof globalThis).HTMLInputElement) {
        const set = Object.getOwnPropertyDescriptor((win() as unknown as typeof globalThis).HTMLInputElement.prototype, 'value')!.set!
        for (let k = 1; k <= a.type.length; k += 2) {
          set.call(input, a.type.slice(0, k))
          input.dispatchEvent(new Event('input', { bubbles: true }))
          await sleep(28)
        }
        set.call(input, a.type)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
      return
    }
    if ('press' in a) {
      const input = await waitFor(`[data-testid="${a.in}"]`)
      ;(input?.closest('form') as HTMLFormElement | null)?.requestSubmit()
    }
  }

  const goToChapter = async (id: string) => {
    if (doc()?.querySelector(`[data-testid="demo-chapter-${id}"]`) == null) (await waitFor('[data-testid="demo-chapters"]'))?.click()
    ;(await waitFor(`[data-testid="demo-chapter-${id}"]`))?.click()
    await sleep(500)
  }

  const play = useCallback(async () => {
    const me = ++run.current
    setState('loading')
    onState?.('playing')
    setZoom({ s: 1, x: 0, y: 0 })
    setI(-1)
    const f = frame.current!
    // A guide left running would take the frame to its chapter before the page opens: close it here,
    // in the store the frame reads when it loads. Cuts with chapters start their own guide by URL.
    if (!cut.shots.some((s) => s.chapter)) {
      useStore.setState((s) => {
        const p = Object.values(s.projects).find((x) => x.slug === slug)
        if (p?.session && (p.session.guide.status === 'running' || p.session.guide.status === 'paused')) p.session.guide.status = 'idle'
      })
    }
    await new Promise<void>((res) => {
      f.onload = () => res()
      f.src = firstUrl(cut, slug)
    })
    const style = doc()!.createElement('style')
    style.textContent = CUT_CSS
    doc()!.head.appendChild(style)
    await sleep(900)
    setState('playing')
    let first = true
    for (let k = 0; k < cut.shots.length; k++) {
      if (run.current !== me) return
      const shot = cut.shots[k]
      setI(k)
      if (shot.open && !first) await navigate(pathFor(shot.open, slug))
      if (shot.chapter && !first) await goToChapter(shot.chapter)
      first = false
      await zoomTo(shot.focus)
      await act(shot)
      if (shot.action) await zoomTo(shot.focus)
      await sleep(shot.seconds * 1000)
    }
    if (run.current !== me) return
    setState('done')
    onState?.('done')
  }, [cut, slug, onState])

  useEffect(() => {
    if (autoplay) void play()
    return () => {
      run.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cut.id, autoplay])

  const shot = i >= 0 ? cut.shots[i] : undefined
  const outro = shot && i === cut.shots.length - 1 && !shot.focus && !shot.action && !shot.open && !shot.chapter

  return (
    <div className="cut" data-cut-state={state === 'done' ? 'done' : state === 'idle' ? 'idle' : 'playing'}>
      <div className="cut__stage" ref={stage}>
        <div className="cut__inner" style={{ width: INNER.w, height: INNER.h, transform: `scale(${fit})` }}>
          <div className="cut__zoom" style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})` }}>
            <iframe ref={frame} title={`${cut.title}: the client demo`} width={INNER.w} height={INNER.h} tabIndex={-1} />
          </div>
        </div>
        <div className="cut__brand" aria-hidden="true">
          <img src="/brand/nagarro-logo.svg" alt="" /> <span>Design</span>
        </div>
        {shot?.action === 'show-me' && <span className="cut__sped">Sped up</span>}
        {state === 'idle' && (
          <button type="button" className="cut__play" onClick={() => void play()} aria-label={`Play ${cut.title}`} data-testid="cut-play">
            <Play />
          </button>
        )}
        {state === 'loading' && <div className="cut__cover">Loading the demo…</div>}
        {shot && !outro && (
          <p className="cut__caption" key={i} aria-live="polite">
            {shot.caption}
          </p>
        )}
        {outro && (
          <div className="cut__outro" aria-live="polite">
            <p>{shot.caption}</p>
            <span>design.nagarro.com</span>
          </div>
        )}
        <div className="cut__progress" aria-hidden="true">
          {cut.shots.map((s, k) => (
            <span key={k} className={k < i ? 'is-done' : k === i ? 'is-current' : ''} style={{ flex: s.seconds }} />
          ))}
        </div>
      </div>
      {state === 'done' && !autoplay && (
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => void play()} data-testid="cut-replay">
          <RotateCcw /> Play again
        </button>
      )}
    </div>
  )
}

/** /nagarro/demos/cut/:id — the cut, its script, its notes and how to film it. */
export function CutPage() {
  const { id = '' } = useParams()
  const cut = socialCut(id)
  const [copied, setCopied] = useState(false)
  if (!cut) return <PageHead title="No such social cut" crumbs={[{ label: 'Demos', to: practice.demos }, { label: id }]} />
  const cmd = `npm run clips -- ${cut.id}`
  return (
    <div className="page">
      <PageHead
        noTabs
        eyebrow={<Chip tone="outline">Social cut · 4:5</Chip>}
        title={cut.title}
        lead={cut.hook}
        crumbs={[{ label: 'Demos', to: practice.demos }, { label: 'Social cuts' }, { label: cut.title }]}
      />
      <div className="cut-layout">
        <CutFrame cut={cut} />
        <div className="stack">
          <Panel title="The script" tight>
            <ol className="cut-script">
              {cut.shots.map((s, k) => (
                <li key={k}>
                  <strong>{s.caption}</strong>
                  <span className="xs muted">
                    {s.seconds}s{s.chapter ? ` · chapter ${s.chapter}` : ''}
                    {s.open ? ` · ${s.open}` : ''}
                    {s.focus ? ` · zoom on ${s.focus}` : ''}
                    {s.action === 'show-me' ? ' · Show me' : s.action && 'click' in s.action ? ` · press ${s.action.click}` : s.action && 'type' in s.action ? ' · types' : ''}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Where the facts come from" tight>
            <p className="small">{cut.notes}</p>
          </Panel>
          <Panel title="Film it" tight>
            <p className="small muted">With the workspace running, this records the cut in Edge as a 1080 × 1350 video in media/clips/. The first time, run npx playwright install ffmpeg (Playwright’s video encoder).</p>
            <div className="row" style={{ gap: 8 }}>
              <code className="code-inline">{cmd}</code>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => {
                  void navigator.clipboard?.writeText(cmd)
                  setCopied(true)
                }}
              >
                <Copy /> {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </Panel>
          <Link className="small" to={practice.demos}>
            ← All demos
          </Link>
        </div>
      </div>
    </div>
  )
}

/** /cut/:id?record=1 — the bare frame for filming. */
export function CutRecord() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const cut = socialCut(id)
  if (!cut) return <p>No such social cut.</p>
  return (
    <main className="cut-record">
      <CutFrame cut={cut} slug={params.get('project') ?? 'demo-brand'} autoplay={params.get('record') === '1'} />
    </main>
  )
}
