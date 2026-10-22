#!/usr/bin/env node
// snapshot-local-sources.mjs — reads the curated local practice documents (and the bundled
// samples) into src/fixtures/knowledge/docs/*.doc.json and updates docs/index.generated.json.
// Zero tokens: plain Node, the same extractors as the app (Node strips the TypeScript types).
// Never writes outside this app; the source documents are only read.
//
//   node scripts/snapshot-local-sources.mjs          write the snapshot
//   node scripts/snapshot-local-sources.mjs --check  exit 1 if a source file changed since its snapshot
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { SEED_SOURCE_META } from '../src/fixtures/knowledge/registry.ts'
import { extractMarkdown } from '../src/knowledge/extract/markdown.ts'
import { extractPlain } from '../src/knowledge/extract/plain.ts'
import { htmlToMarkdown } from '../src/knowledge/extract/html.ts'
import { hashText } from '../src/knowledge/hash.ts'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspace = resolve(app, '..')
const docsDir = resolve(app, 'src/fixtures/knowledge/docs')
const indexPath = resolve(docsDir, 'index.generated.json')
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : {}
const check = process.argv.includes('--check')

const SAMPLES = {
  'src-contoso-questionnaire': 'samples/contoso-vendor-questionnaire.md',
  'src-contoso-multibrand-note': 'samples/multibrand-governance-note.md',
}
const md5 = (buf) => createHash('md5').update(buf).digest('hex')

const jobs = []
for (const m of SEED_SOURCE_META) {
  if (SAMPLES[m.id]) jobs.push({ m, file: resolve(app, 'src/fixtures/knowledge', SAMPLES[m.id]), readBy: 'upload', label: SAMPLES[m.id].split('/').pop() })
  else if (m.location.type === 'local' && /\.(md|mdx|txt|html?)$/i.test(m.location.path)) jobs.push({ m, file: resolve(workspace, m.location.path), readBy: 'local-read', label: m.location.path })
}

let stale = 0
let written = 0
for (const { m, file, readBy, label } of jobs) {
  if (!existsSync(file)) {
    console.warn(`missing (skipped): ${label}`)
    continue
  }
  const buf = readFileSync(file)
  const fileMd5 = md5(buf)
  if (check) {
    if (index[m.id]?.fileMd5 !== fileMd5) {
      stale++
      console.log(`stale: ${m.id} (${label})`)
    }
    continue
  }
  const raw = buf.toString('utf8')
  const ctx = { sourceId: m.id, docId: `seed.${m.slug}`, readBy, readAt: Date.now() }
  const doc = /\.mdx?$/i.test(label) ? extractMarkdown(raw, { ...ctx, path: label }) : /\.html?$/i.test(label) ? extractMarkdown(htmlToMarkdown(raw), { ...ctx, path: label }) : extractPlain(raw, { ...ctx, label })
  writeFileSync(resolve(docsDir, `${m.slug}.doc.json`), JSON.stringify(doc) + '\n')
  index[m.id] = { docId: doc.docId, sourceHash: doc.sourceHash, readAt: doc.readAt, readBy: doc.readBy, outline: doc.sections.slice(0, 60).map((s) => ({ id: s.id, heading: s.heading })), excerpt: (doc.sections[0]?.text ?? '').slice(0, 280), charCount: doc.stats.chars, sections: doc.stats.sections, missing: doc.missing.length, fileMd5, mtime: statSync(file).mtimeMs, path: label }
  written++
}

// The sample request (not a library source): stored as plain text for the Northwind opportunity.
const rfp = resolve(app, 'src/fixtures/knowledge/samples/northwind-rfp.md')
if (!check && existsSync(rfp)) {
  const text = readFileSync(rfp, 'utf8')
  writeFileSync(resolve(docsDir, 'northwind-rfp.doc.json'), JSON.stringify({ id: 'seed.northwind-rfp', hash: hashText(text), text, storedAt: Date.now() }) + '\n')
}

if (check) {
  console.log(stale ? `${stale} local source(s) changed since the snapshot. Run npm run knowledge:local.` : 'All local sources match the snapshot.')
  process.exit(stale ? 1 : 0)
}
const sorted = Object.fromEntries(Object.keys(index).sort().map((k) => [k, index[k]]))
writeFileSync(indexPath, JSON.stringify(sorted, null, 1) + '\n')
console.log(`Snapshot: ${written} sources written to src/fixtures/knowledge/docs/ (index has ${Object.keys(sorted).length} entries).`)
