// Deck exports, all in Carolina's language: deck.json is the engine's own renderDeck input,
// brief.md is the nagarro-slides plugin's 12-point brief plus the slide plan, notes.md the
// speaker notes, deck.html a standalone deck with present mode (the deck-starter equivalent).
import type { Deck } from './types'
import { ENGINE, templateInfo } from './catalog'

const slug = (s: string) => s.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'deck'

export function deckInput(deck: Deck, studio = 'Product Studio') {
  return {
    title: deck.brief.deckName,
    studio,
    footer: { col1: deck.brief.deckName, col2: `Prepared for ${deck.brief.client.name}`, col3: '', copyright: `© ${new Date().getFullYear()} Nagarro` },
  }
}

export function exportDeckJson(deck: Deck) {
  return { filename: `${slug(deck.title)}.deck.json`, mime: 'application/json', content: JSON.stringify({ engine: { name: ENGINE.name, artifactVersion: ENGINE.artifactVersion, upstream: ENGINE.upstream }, deck: deckInput(deck), slides: deck.slides.map((s) => s.spec) }, null, 2) }
}

export function exportBriefMd(deck: Deck) {
  const b = deck.brief
  const lines = [
    `# Brief for a Nagarro deck: ${b.deckName}`,
    '',
    `Built with the Nagarro Master Slides engine ${ENGINE.artifactVersion}. Paste this into Presentation Studio's prompt box to edit the deck and export .pptx or PDF, or into Claude with the nagarro-slides plugin ("make a Nagarro deck").`,
    '',
    `1. **Deck name:** ${b.deckName}`,
    `2. **Topic and key messages:** ${b.keyMessages.map((m) => `\n   - ${m}`).join('')}`,
    `3. **Audience and purpose:** ${b.audiencePurpose}`,
    `4. **Rough slide count:** ${b.slideCount} (about ${deck.durationMin} minutes)`,
    `5. **Client or host name and logo:** ${b.client.name}. ${b.client.logo}`,
    `6. **Anything verbatim:** ${b.verbatim.length ? b.verbatim.map((v) => `\n   - "${v}"`).join('') : 'none'}`,
    `7. **Opening:** ${b.hook}`,
    `8. **Tone and angle:** ${b.tone}`,
    `9. **Must-have slides:** ${b.mustHaveSlides.join(', ')}`,
    `10. **Takeaways:** ${b.takeaways.map((t) => `\n   - ${t}`).join('')}`,
    `11. **Their own pictures:** ${b.pictures.join('; ') || 'none'}`,
    `12. **Sources:** ${b.sources.join('; ') || 'none'}`,
    '',
    '## Slide plan',
    '',
    '| # | Slide (the claim it makes) | Light/dark | Template | What goes on it |',
    '|---|---|---|---|---|',
    ...deck.slides.map((s, i) => `| ${i + 1} | ${s.claim.replace(/\|/g, '/')} | ${s.spec.theme ?? templateInfo(s.spec.template)?.theme ?? 'light'} | ${s.spec.template} | ${String(s.spec.title ?? s.spec.quote ?? '').replace(/\|/g, '/')}${s.demoLink ? ' · switch to the live demo' : ''} |`),
  ]
  return { filename: `${slug(deck.title)}.brief.md`, mime: 'text/markdown', content: lines.join('\n') + '\n' }
}

export function exportNotesMd(deck: Deck) {
  const lines = [`# Speaker notes: ${deck.title}`, '']
  deck.slides.forEach((s, i) => {
    lines.push(`## ${i + 1}. ${s.claim}`)
    if (s.demoLink) lines.push(`**Transition:** ${s.demoLink.label}.`)
    lines.push(s.notes || '_No notes._', '')
  })
  return { filename: `${slug(deck.title)}.notes.md`, mime: 'text/markdown', content: lines.join('\n') }
}

/** A standalone HTML deck with present mode; the engine and its stylesheet are inlined. */
export async function exportDeckHtml(deck: Deck, base = '/vendor/nagarro-master-slides/') {
  const [js, css] = await Promise.all([fetch(`${base}bundle.js`).then((r) => r.text()), fetch(`${base}bundle.css`).then((r) => r.text())])
  const fonts = await Promise.all(
    [['Equip', 300, 'equiplig'], ['Equip', 400, 'equipreg'], ['Equip', 500, 'equipmed'], ['Equip', 700, 'equipbol'], ['Equip Extended', 400, 'equipextreg'], ['Equip Extended', 500, 'equipextmed'], ['Equip Extended', 700, 'equipextbol']].map(async ([family, weight, file]) => {
      try {
        const b = await (await fetch(`/fonts/equip/${file}-webfont.woff2`)).arrayBuffer()
        let bin = ''
        new Uint8Array(b).forEach((x) => (bin += String.fromCharCode(x)))
        return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${btoa(bin)}) format("woff2");font-weight:${weight};font-display:swap}`
      } catch {
        return ''
      }
    }),
  )
  let loop = ''
  try {
    const b = await (await fetch(`${base}media/assets/main/closing-loop.png`)).arrayBuffer()
    let bin = ''
    new Uint8Array(b).forEach((x) => (bin += String.fromCharCode(x)))
    loop = `data:image/png;base64,${btoa(bin)}`
  } catch {
    loop = ''
  }
  const data = JSON.stringify({ deck: deckInput(deck), slides: deck.slides.map((s) => s.spec) }).replace(/</g, '\\u003c')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${deck.title.replace(/</g, '&lt;')}</title>
<style>${fonts.join('')}${css}
html,body{margin:0;background:#05070d;color:#c4c9d2;font-family:"Equip",system-ui,sans-serif}.bar{position:sticky;top:0;z-index:2;display:flex;gap:16px;align-items:center;padding:12px 24px;background:#05070d;font-size:14px}.bar button{font:inherit;color:#fff;background:transparent;border:.5px solid #c4c9d2;border-radius:999px;padding:6px 14px;cursor:pointer}.list{display:flex;flex-direction:column;align-items:center;gap:32px;padding:24px}.present{position:fixed;inset:0;z-index:3;background:#05070d;display:none;align-items:center;justify-content:center}.present.on{display:flex}</style></head>
<body><div class="bar"><span>${deck.title.replace(/</g, '&lt;')} · built with Nagarro Master Slides ${ENGINE.artifactVersion}</span><button id="play">Present</button><span>← → to move · F for fullscreen · Esc to leave</span></div><div class="list" id="list"></div><div class="present" id="present" tabindex="-1"></div>
<script>${js.replace(/<\/script/gi, '<\\/script')}</script><script>
const D=${data};NagarroSlides.config({assetBase:"./"});let html=NagarroSlides.renderDeck(D.slides,D.deck);${loop ? `html=html.map(h=>h.split("./assets/main/closing-loop.png").join(${JSON.stringify(loop)}));` : ''}
const view=(h,w)=>{const s=w/1920;return '<div class="ns-viewport" style="width:'+w+'px;height:'+Math.round(1080*s)+'px"><div class="ns-scaler" style="transform:scale('+s+')">'+h+'</div></div>'};
const list=document.getElementById('list');const draw=()=>{const w=Math.min(1280,innerWidth-48);list.innerHTML=html.map(h=>view(h,w)).join('')};draw();addEventListener('resize',draw);
const p=document.getElementById('present');let i=0;const show=()=>{const w=Math.min(innerWidth,innerHeight*16/9);p.innerHTML=view(html[i],Math.floor(w))};
document.getElementById('play').onclick=()=>{i=0;p.classList.add('on');show();p.focus()};addEventListener('resize',()=>p.classList.contains('on')&&show());
document.addEventListener('keydown',e=>{if(!p.classList.contains('on'))return;if(e.key==='ArrowRight'||e.key===' '){i=Math.min(html.length-1,i+1);show()}else if(e.key==='ArrowLeft'){i=Math.max(0,i-1);show()}else if(e.key==='Escape'){p.classList.remove('on')}else if(e.key.toLowerCase()==='f'&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{})});
</script></body></html>`
  return { filename: `${slug(deck.title)}.deck.html`, mime: 'text/html', content: html }
}
