#!/usr/bin/env node
// figma-json-to-doc.mjs — turns one or more figma-text@1 captures (from the knowledge plugin,
// figma-cli or the Figma MCP) into a knowledge document in src/fixtures/knowledge/docs/ and
// updates docs/index.generated.json. Zero tokens.
//
//   node scripts/figma-json-to-doc.mjs <capture.json> [more.json…] --source <source id> [--exclude-text <regex>]…
//
// --exclude-text drops whole frames whose text matches (e.g. a client name in a frame that is
// generically called "Chapter Cover"); they are listed in the document's "missing" with the reason.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { SEED_SOURCE_META } from '../src/fixtures/knowledge/registry.ts'
import { extractFigmaText } from '../src/knowledge/extract/figmaText.ts'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (name) => args.flatMap((a, i) => (a === name ? [args[i + 1]] : []))
const files = args.filter((a, i) => !a.startsWith('--') && !['--source', '--exclude-text'].includes(args[i - 1]))
const sourceId = flag('--source')[0]
const meta = SEED_SOURCE_META.find((m) => m.id === sourceId)
if (!files.length || !meta) {
  console.error('usage: node scripts/figma-json-to-doc.mjs <capture.json…> --source <seed source id> [--exclude-text <regex>]')
  process.exit(1)
}
const excludeText = flag('--exclude-text').map((r) => new RegExp(r, 'i'))
const caps = files.map((f) => JSON.parse(readFileSync(f, 'utf8')))
for (const c of caps) if (c.schema !== 'figma-text@1') throw new Error(`${files[caps.indexOf(c)]} is not a figma-text@1 capture`)
const merged = { ...caps[0], frames: caps.flatMap((c) => c.frames), excluded: caps.flatMap((c) => c.excluded ?? []) }
merged.frames = merged.frames.filter((f) => {
  const hit = excludeText.find((re) => f.texts.some((t) => re.test(t.text)))
  if (hit) merged.excluded.push({ nodeId: f.nodeId, name: f.name, reason: 'client-specific text: not practice material' })
  return !hit
})
const doc = extractFigmaText(merged, { sourceId, docId: `seed.${meta.slug}` })
for (const re of excludeText) if (doc.sections.some((s) => re.test(s.text) || re.test(s.heading))) throw new Error(`excluded text ${re} still present`)
const docsDir = resolve(app, 'src/fixtures/knowledge/docs')
writeFileSync(resolve(docsDir, `${meta.slug}.doc.json`), JSON.stringify(doc) + '\n')
const indexPath = resolve(docsDir, 'index.generated.json')
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : {}
index[sourceId] = { docId: doc.docId, sourceHash: doc.sourceHash, readAt: doc.readAt, readBy: doc.readBy, outline: doc.sections.slice(0, 60).map((s) => ({ id: s.id, heading: s.heading })), excerpt: (doc.sections[0]?.text ?? '').slice(0, 280), charCount: doc.stats.chars, sections: doc.stats.sections, missing: doc.missing.length, fileKey: merged.fileKey, page: merged.page.name, capturedBy: merged.capturedBy }
writeFileSync(indexPath, JSON.stringify(Object.fromEntries(Object.keys(index).sort().map((k) => [k, index[k]])), null, 1) + '\n')
console.log(`${sourceId}: ${doc.stats.sections} sections, ${doc.missing.length} listed as missing, ${doc.warnings.length} warnings → docs/${meta.slug}.doc.json`)
