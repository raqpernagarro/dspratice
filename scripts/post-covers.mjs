#!/usr/bin/env node
// post-covers.mjs — renders a 1080 × 1350 cover for each post in src/fixtures/posts.nagarro-design.json
// (its `coverSpec`), in the Nagarro Design look: the dark page, one glass render, Equip type, one mint
// phrase. Used as the LinkedIn video thumbnail or as the picture of an image post.
//
//   npm run covers                 every post  → media/posts/<post-id>.png
//   npm run covers -- <post-id>    one post
//
// Renders in Edge from local files only (fonts in public/fonts/equip, renders in public/brand/3d).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { posts } = JSON.parse(readFileSync(resolve(root, 'src/fixtures/posts.nagarro-design.json'), 'utf8'))
const wanted = process.argv.slice(2)
const list = wanted.length ? posts.filter((p) => wanted.includes(p.id)) : posts
const url = (p) => pathToFileURL(resolve(root, p)).href
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function html(post) {
  const c = post.coverSpec
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Equip;font-weight:400;src:url(${url('public/fonts/equip/equipreg-webfont.woff2')}) format('woff2')}
@font-face{font-family:'Equip Extended';font-weight:500;src:url(${url('public/fonts/equip/equipextmed-webfont.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;background:#010716;color:#fff;font-family:Equip,sans-serif;overflow:hidden;position:relative}
.art{position:absolute;right:-300px;top:470px;width:1080px;height:1080px;background:url(${url(`public/brand/3d/${c.art}.jpg`)}) center/contain no-repeat;${c.art === 'glass-x' ? 'mix-blend-mode:screen;' : '-webkit-mask-image:linear-gradient(to bottom,transparent 22%,#000 46%),linear-gradient(to right,transparent 0%,#000 35%);-webkit-mask-composite:source-in;mask-composite:intersect;'}}
.fade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(1,7,22,1) 0%,rgba(1,7,22,.85) 30%,rgba(1,7,22,0) 52%,rgba(1,7,22,0) 72%,rgba(1,7,22,.95) 90%),linear-gradient(90deg,rgba(1,7,22,.7) 0%,rgba(1,7,22,0) 45%)}
.top{position:absolute;left:80px;top:80px;display:flex;align-items:center;gap:22px;font-family:'Equip Extended';font-weight:500;font-size:34px;letter-spacing:-.02em}
.top img{height:38px;filter:invert(1) brightness(2)}
.top i{width:2px;height:40px;background:rgba(255,255,255,.5)}
.kicker{position:absolute;left:80px;top:250px;font-family:'Equip Extended';font-weight:500;font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:#47D7AC}
h1{position:absolute;left:80px;right:80px;top:310px;font-family:'Equip Extended';font-weight:500;font-size:112px;line-height:1.02;letter-spacing:-.03em;text-wrap:balance}
h1 em{font-style:normal;color:#47D7AC}
.play{position:absolute;left:80px;bottom:150px;display:flex;align-items:center;gap:24px;font-size:32px;color:rgba(255,255,255,.8)}
.play b{width:96px;height:96px;border-radius:50%;background:#47D7AC;display:grid;place-items:center}
.play b::after{content:'';border-left:30px solid #13294B;border-top:19px solid transparent;border-bottom:19px solid transparent;margin-left:8px}
.foot{position:absolute;left:80px;right:80px;bottom:72px;display:flex;justify-content:space-between;font-size:26px;color:rgba(255,255,255,.55);border-top:1px solid rgba(255,255,255,.2);padding-top:22px}
</style></head><body>
<div class="art"></div><div class="fade"></div>
<div class="top"><img src="${url('public/brand/nagarro-logo.svg')}"><i></i>Design</div>
<p class="kicker">${esc(c.kicker)}</p>
<h1>${esc(c.before)}<em>${esc(c.hl)}</em>${esc(c.after)}</h1>
${post.format === 'video' ? '<div class="play"><b></b>Watch the demo</div>' : ''}
<div class="foot"><span>design.nagarro.com</span><span>Nagarro Design Systems &amp; AI</span></div>
</body></html>`
}

mkdirSync(resolve(root, 'media/posts'), { recursive: true })
const browser = await chromium.launch({ channel: 'msedge' })
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
  for (const post of list) {
    // Opened from a file: an in-memory page may not load the local fonts and renders.
    const tmp = resolve(root, 'media/posts', `.${post.id}.html`)
    writeFileSync(tmp, html(post))
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    const out = resolve(root, 'media/posts', `${post.id}.png`)
    await page.screenshot({ path: out })
    rmSync(tmp)
    console.log(`${post.id}: media/posts/${post.id}.png`)
  }
} finally {
  await browser.close()
}
