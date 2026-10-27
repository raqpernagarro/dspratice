#!/usr/bin/env node
// clips.mjs — films a social cut (src/fixtures/social-cuts.ts) as a 1080 × 1350 video, in Edge.
// The cut plays on the real client demo at /cut/<id>?record=1; this script only records the screen.
//
//   npm run clips -- <cut-id>            one cut   → media/clips/<cut-id>.webm
//   npm run clips -- all                 every cut
//   BASE_URL=http://localhost:4310 npm run clips -- <cut-id>   another dev server (default :4300)
//
// The workspace must be running (npm run dev). Nothing is uploaded or posted: the file stays here.
// Recording needs Playwright's own video encoder once: npx playwright install ffmpeg
import { mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = process.env.BASE_URL ?? 'http://localhost:4300'
const ids = [...readFileSync(resolve(root, 'src/fixtures/social-cuts.ts'), 'utf8').matchAll(/^\s{4}id: '([a-z0-9-]+)'/gm)].map((m) => m[1])
const wanted = process.argv.slice(2)
const list = !wanted.length || wanted.includes('all') ? ids : wanted
const unknown = list.filter((id) => !ids.includes(id))
if (unknown.length) {
  console.error(`No social cut called ${unknown.join(', ')}. Cuts: ${ids.join(', ')}.`)
  process.exit(1)
}

const out = resolve(root, 'media/clips')
const tmp = resolve(out, '.recording')
mkdirSync(tmp, { recursive: true })
const size = { width: 1080, height: 1350 }
const browser = await chromium.launch({ channel: 'msedge' })
try {
  for (const id of list) {
    const context = await browser.newContext({ viewport: size, recordVideo: { dir: tmp, size }, reducedMotion: 'no-preference' })
    const page = await context.newPage()
    const t = Date.now()
    await page.goto(`${base}/cut/${id}?record=1`)
    await page.waitForSelector('[data-cut-state="done"]', { timeout: 120_000 })
    await page.waitForTimeout(800)
    const video = page.video()
    await context.close()
    const file = resolve(out, `${id}.webm`)
    renameSync(await video.path(), file)
    console.log(`${id}: filmed in ${((Date.now() - t) / 1000).toFixed(0)}s → media/clips/${id}.webm`)
  }
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg.includes('ffmpeg')) {
    console.error('Recording needs Playwright’s video encoder, once:  npx playwright install ffmpeg   then run this again.')
    process.exitCode = 1
  } else if (msg.includes('ERR_CONNECTION_REFUSED')) {
    console.error(`Nothing answers at ${base}. Start the workspace (npm run dev), or set BASE_URL.`)
    process.exitCode = 1
  } else throw e
} finally {
  await browser.close()
  rmSync(tmp, { recursive: true, force: true })
}
