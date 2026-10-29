/**
 * Web renderer: Deck → one self-contained HTML file (images, font and tokens inlined), and a PDF of it.
 * Styled with the design system's own semantic tokens and font, Light mode. A PowerPoint renderer
 * for a template would sit next to this file and read the same Deck.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { chromium } from 'playwright'

import type { Block, Deck, Image, Inline, Slide } from './slides'

const W = 1280
const H = 720

export function renderWeb(deck: Deck, { root, outDir }: { root: string; outDir: string }): string {
  const tokens = readFileSync(join(root, 'stories/base-ui/tokens/figma-semantic.css'), 'utf8')
  const fonts = [400, 500, 600, 700]
    .map((w) => {
      const data = readFileSync(join(root, `node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-${w}-normal.woff2`)).toString('base64')
      return `@font-face{font-family:'Hanken Grotesk';font-weight:${w};font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${data}) format('woff2')}`
    })
    .join('\n')
  const img = (i: Image) => `data:image/png;base64,${readFileSync(join(outDir, i.file)).toString('base64')}`
  const built = new Date(deck.builtAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const n = deck.slides.length

  const slides = deck.slides
    .map((s, i) => {
      const footer = s.kind === 'title' ? '' : `<footer><span>${esc(deck.title)}</span><span>${i + 1} / ${n}</span></footer>`
      return `<section class="slide slide--${s.kind}" data-index="${i}">${body(s, img, built, deck.commit)}${footer}</section>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(deck.title)}</title>
<style>
${fonts}
${tokens}
${CSS}
</style>
</head>
<body class="theme-scope" data-appearance="light">
<main class="stage" aria-live="polite">
${slides}
</main>
<div class="progress" aria-hidden="true"><div></div></div>
<script>${JS}</script>
</body>
</html>
`
}

function body(s: Slide, img: (i: Image) => string, built: string, commit: string): string {
  switch (s.kind) {
    case 'title':
      return `<div class="title-block"><h1>${esc(s.title)}</h1>${s.subtitle ? `<p class="subtitle">${inline(s.subtitle)}</p>` : ''}</div>
<p class="meta">Built ${esc(built)} · ${esc(commit)}</p>`
    case 'statement':
      return `<p class="eyebrow">${esc(s.title)}</p><p class="statement">${inline(s.text)}</p>`
    case 'content':
      return `${head(s.title, s.subtitle)}<div class="blocks">${s.blocks.map(block).join('')}</div>`
    case 'facts':
      return `${head(s.title)}<div class="facts">${s.facts
        .map((f) => `<div class="fact"><div class="fact__value">${esc(f.value)}</div><div class="fact__label">${esc(f.label)}</div>${f.note ? `<div class="fact__note">${esc(f.note)}</div>` : ''}</div>`)
        .join('')}</div>`
    case 'gallery':
      return `${head(s.title)}<div class="gallery">${
        s.images.length
          ? s.images.map((i) => `<figure><div class="frame"><img src="${img(i)}" alt="${esc(i.caption)}"></div><figcaption>${esc(i.caption)}</figcaption></figure>`).join('')
          : '<p class="empty">Screenshots were skipped in this build.</p>'
      }</div>`
    case 'screenshot':
      return `${head(s.title)}<figure class="shot"><img src="${img(s.image)}" alt="${esc(s.image.caption)}"></figure>`
    case 'roadmap':
      return `${head(s.title)}<ul class="roadmap" style="grid-template-rows:repeat(${Math.ceil(s.items.length / 2)},auto)">${s.items
        .map(
          (r) =>
            `<li class="item item--${r.status}"><span class="item__mark" aria-hidden="true"></span><div><div class="item__title">${esc(r.title)}${r.status === 'in-progress' ? ' <span class="badge">In progress</span>' : ''}</div><div class="item__text">${inline(r.text)}</div></div></li>`,
        )
        .join('')}</ul>`
  }
}

const head = (title: string, subtitle?: string) => `<header><h2>${esc(title)}</h2>${subtitle ? `<p class="subtitle">${inline(subtitle)}</p>` : ''}</header>`

function block(b: Block): string {
  if (b.type === 'paragraph') return `<p>${inline(b.text)}</p>`
  const tag = b.type === 'steps' ? 'ol' : 'ul'
  return `<${tag} class="${b.type}">${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${tag}>`
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inline(text: Inline): string {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

/** Prints the HTML to a PDF, one slide per page. */
export async function exportPdf(htmlFile: string, pdfFile: string) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(htmlFile).href)
    await page.evaluate(() => document.fonts.ready)
    await page.emulateMedia({ media: 'print' })
    await page.pdf({ path: pdfFile, width: `${W}px`, height: `${H}px`, printBackground: true, preferCSSPageSize: true })
  } finally {
    await browser.close()
  }
}

const CSS = `
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--color-background-inverted-primary);color:var(--color-foreground-neutral-primary);font-family:var(--font-family-primary),system-ui,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}
.stage{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;transform-origin:0 0}
.slide{position:absolute;inset:0;display:none;flex-direction:column;padding:64px 80px 72px;background:var(--color-background-surface-low);overflow:hidden}
.slide.active{display:flex}
h1,h2,p{margin:0}
header{margin-bottom:36px}
h2{font-size:40px;line-height:48px;font-weight:600;letter-spacing:-.01em}
.subtitle{font-size:24px;line-height:32px;color:var(--color-foreground-neutral-secondary);margin-top:8px}
code{font-family:var(--font-family-mono),ui-monospace,monospace;font-size:.9em;background:var(--color-background-neutral-tertiary);padding:.05em .3em;border-radius:var(--shape-radius-sm)}
strong{font-weight:600}
footer{position:absolute;left:80px;right:80px;bottom:28px;display:flex;justify-content:space-between;font-size:14px;color:var(--color-foreground-neutral-tertiary)}

.slide--title{background:var(--color-background-accent-default);color:var(--color-foreground-on-accent-primary);justify-content:center}
.slide--title h1{font-size:72px;line-height:80px;font-weight:700;letter-spacing:-.02em;max-width:960px}
.slide--title .subtitle{color:inherit;opacity:.72;font-size:30px;line-height:40px;margin-top:20px;max-width:900px}
.slide--title .meta{position:absolute;left:80px;bottom:40px;font-size:14px;opacity:.5}

.slide--statement{justify-content:center}
.eyebrow{font-size:18px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--color-foreground-neutral-tertiary);margin-bottom:24px}
.statement{font-size:44px;line-height:56px;font-weight:500;letter-spacing:-.01em;max-width:1040px}

.blocks{display:flex;flex-direction:column;gap:20px;font-size:26px;line-height:36px;max-width:1040px}
.blocks ul,.blocks ol{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:18px}
.bullets li{position:relative;padding-left:32px}
.bullets li::before{content:'';position:absolute;left:4px;top:14px;width:10px;height:10px;border-radius:var(--shape-radius-full);background:var(--color-background-accent-default)}
.steps{counter-reset:step}
.steps li{position:relative;padding-left:56px;counter-increment:step}
.steps li::before{content:counter(step);position:absolute;left:0;top:0;width:36px;height:36px;border-radius:var(--shape-radius-full);background:var(--color-background-accent-default);color:var(--color-foreground-on-accent-primary);font-size:18px;font-weight:600;line-height:36px;text-align:center}

.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;flex:1}
.fact{border:1px solid var(--color-border-neutral-subtle);border-radius:var(--shape-radius-lg);padding:28px 32px;display:flex;flex-direction:column;justify-content:flex-end;background:var(--color-background-neutral-secondary)}
.fact__value{font-size:64px;line-height:68px;font-weight:700;letter-spacing:-.02em}
.fact__label{font-size:22px;line-height:30px;font-weight:600;margin-top:8px}
.fact__note{font-size:16px;line-height:22px;color:var(--color-foreground-neutral-secondary);margin-top:4px}

.gallery{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:20px 24px;flex:1;min-height:0}
.gallery figure{margin:0;display:flex;flex-direction:column;min-height:0}
.frame{flex:1;min-height:0;border:1px solid var(--color-border-neutral-subtle);border-radius:var(--shape-radius-lg);background:var(--color-background-surface-low);display:flex;align-items:center;justify-content:center;padding:12px;overflow:hidden}
.frame img{max-width:100%;max-height:100%;object-fit:contain}
figcaption{font-size:15px;line-height:20px;color:var(--color-foreground-neutral-secondary);margin-top:8px}
.empty{color:var(--color-foreground-neutral-tertiary);font-size:20px}

.shot{margin:0;flex:1;min-height:0;display:flex;justify-content:center}
.shot img{max-width:100%;max-height:100%;object-fit:contain;border:1px solid var(--color-border-neutral-subtle);border-radius:var(--shape-radius-lg);box-shadow:0 12px 32px rgba(6,4,31,.12)}

.roadmap{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-flow:column;gap:14px 48px;align-content:start}
.item{display:flex;gap:14px;align-items:flex-start}
.item__mark{flex:none;width:18px;height:18px;margin-top:3px;border-radius:var(--shape-radius-full);border:2px solid var(--color-border-neutral-strong)}
.item--done .item__mark{border-color:var(--color-foreground-success);background:var(--color-foreground-success);box-shadow:inset 0 0 0 3px var(--color-background-surface-low)}
.item--in-progress .item__mark{border-color:var(--color-foreground-info);background:linear-gradient(90deg,var(--color-foreground-info) 50%,transparent 50%)}
.item__title{font-size:18px;line-height:24px;font-weight:600}
.item__text{font-size:15px;line-height:20px;color:var(--color-foreground-neutral-secondary);margin-top:2px}
.badge{display:inline-block;font-size:12px;line-height:18px;font-weight:600;padding:0 8px;margin-left:6px;vertical-align:2px;border-radius:var(--shape-radius-full);background:var(--color-background-info-subtle);color:var(--color-foreground-info)}

.progress{position:fixed;left:0;right:0;bottom:0;height:3px}
.progress div{height:100%;width:0;background:var(--color-foreground-info);transition:width .2s}

@page{size:${W}px ${H}px;margin:0}
@media print{
  body{background:none;overflow:visible}
  .stage{position:static;transform:none!important;width:auto;height:auto}
  .slide{display:flex!important;position:relative;width:${W}px;height:${H}px;break-after:page}
  .progress{display:none}
}
`

const JS = `
(() => {
  const slides = [...document.querySelectorAll('.slide')]
  const stage = document.querySelector('.stage')
  const bar = document.querySelector('.progress div')
  let i = Math.min(Math.max(parseInt(location.hash.slice(1), 10) - 1 || 0, 0), slides.length - 1)
  const show = (n) => {
    i = Math.min(Math.max(n, 0), slides.length - 1)
    slides.forEach((s, k) => s.classList.toggle('active', k === i))
    bar.style.width = ((i + 1) / slides.length) * 100 + '%'
    history.replaceState(null, '', '#' + (i + 1))
  }
  const fit = () => {
    const k = Math.min(innerWidth / ${W}, innerHeight / ${H})
    stage.style.transform = 'scale(' + k + ') translate(-50%, -50%)'
  }
  addEventListener('keydown', (e) => {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) show(i + 1)
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) show(i - 1)
    else if (e.key === 'Home') show(0)
    else if (e.key === 'End') show(slides.length - 1)
    else return
    e.preventDefault()
  })
  addEventListener('click', (e) => show(e.clientX > innerWidth / 2 ? i + 1 : i - 1))
  addEventListener('resize', fit)
  addEventListener('hashchange', () => show(parseInt(location.hash.slice(1), 10) - 1 || 0))
  // Load every weight up front: a face only loads when first used, which blanks text mid-talk.
  ;[400, 500, 600, 700].forEach((w) => document.fonts.load(w + ' 16px "Hanken Grotesk"'))
  fit()
  show(i)
})()
`
