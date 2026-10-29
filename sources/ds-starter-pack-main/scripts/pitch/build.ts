/**
 * Builds the pitch deck from pitch/story.md, pitch/roadmap.md and live facts from the repo.
 *
 *   npm run pitch:build                        everything (tests, screenshots): a few minutes
 *   npm run pitch:build -- --skip-tests        reuse the last test results
 *   npm run pitch:build -- --skip-screenshots  reuse the last screenshots (fast, for text edits)
 *
 * Output in pitch/dist/: pitch-deck.html (self-contained), pitch-deck.pdf, slides.json (the deck as
 * data, for other renderers), images/.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { collect } from './collect'
import { exportPdf, renderWeb } from './render-web'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = join(root, 'pitch/dist')
const cacheDir = join(root, 'pitch/.cache')
const args = new Set(process.argv.slice(2))

async function main() {
  mkdirSync(outDir, { recursive: true })
  console.log('Collecting…')
  const deck = await collect({ root, outDir, cacheDir, tests: !args.has('--skip-tests'), screenshots: !args.has('--skip-screenshots') })
  writeFileSync(join(outDir, 'slides.json'), JSON.stringify(deck, null, 2) + '\n')

  console.log('Rendering…')
  const html = join(outDir, 'pitch-deck.html')
  writeFileSync(html, renderWeb(deck, { root, outDir }))
  await exportPdf(html, join(outDir, 'pitch-deck.pdf'))

  console.log(`Done: ${deck.slides.length} slides → pitch/dist/pitch-deck.html and .pdf`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
