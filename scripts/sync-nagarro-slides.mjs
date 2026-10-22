#!/usr/bin/env node
// sync-nagarro-slides.mjs — vendors Carolina Baptista's Nagarro Master Slides engine (the same
// engine as her Presentation Studio, Presentation_v1) into this app, pinned and unmodified.
//
//   node scripts/sync-nagarro-slides.mjs <folder holding project/> --version <artifact version>
//
// Get the folder with Claude Code: Artifact read of https://claude.ai/artifact/FTePiAfzdDWtb71Bogjpn2
// for project/components/bundle.{js,css}, project/components/index.d.ts, project/tokens.json,
// project/README.md, project/09-building-decks.md and project/kit/{deck-starter.html,checks.js,compose.js}.
//
// Writes only inside this app:
//   public/vendor/nagarro-master-slides/   bundle.js, bundle.css (served to the slides frame)
//                                           + VERSION.json, index.d.ts, tokens.json, kit/, docs/
//   src/deck/catalog.generated.json        slim template catalogue (no examples) used by the mapper
// Never edit the vendored files: re-run this script on a newer version instead.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { JSDOM } from 'jsdom'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const src = args.find((a) => !a.startsWith('--'))
const version = args[args.indexOf('--version') + 1]
if (!src || !version || args.indexOf('--version') < 0) {
  console.error('usage: node scripts/sync-nagarro-slides.mjs <folder holding project/> --version <artifact version>')
  process.exit(1)
}
const from = (...p) => resolve(src, 'project', ...p)
const out = resolve(root, 'public/vendor/nagarro-master-slides')
const FILES = [
  ['components/bundle.js', 'bundle.js'],
  ['components/bundle.css', 'bundle.css'],
  ['components/index.d.ts', 'index.d.ts'],
  ['tokens.json', 'tokens.json'],
  ['README.md', 'docs/README.md'],
  ['09-building-decks.md', 'docs/09-building-decks.md'],
  ['16-composed-layouts.md', 'docs/16-composed-layouts.md'],
  ['kit/deck-starter.html', 'kit/deck-starter.html'],
  ['kit/checks.js', 'kit/checks.js'],
  ['kit/compose.js', 'kit/compose.js'],
  ['media/assets/main/closing-loop.png', 'media/assets/main/closing-loop.png'],
]
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const files = {}
for (const [a, b] of FILES) {
  const f = from(a)
  if (!existsSync(f)) { console.warn(`skip (not downloaded): ${a}`); continue }
  mkdirSync(dirname(join(out, b)), { recursive: true })
  copyFileSync(f, join(out, b))
  files[b] = { from: `project/${a}`, sha256: sha(readFileSync(f)), bytes: readFileSync(f).length }
}
if (!files['bundle.js']) { console.error('bundle.js is required'); process.exit(1) }

// Run the engine once in jsdom to read its template registry.
const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true })
dom.window.eval(readFileSync(join(out, 'bundle.js'), 'utf8'))
const NS = dom.window.NagarroSlides
if (!NS || !Array.isArray(NS.templates)) { console.error('bundle did not define window.NagarroSlides.templates'); process.exit(1) }
const catalog = NS.templates.map((t) => ({
  name: t.name, family: t.family, role: t.role, category: t.category, shape: t.shape, theme: t.theme,
  media: t.media ?? [], capacity: t.capacity, slots: t.slots ?? {}, description: t.description ?? '', use: t.use ?? '', schema: t.schema ?? null,
}))
const tokens = existsSync(join(out, 'tokens.json')) ? JSON.parse(readFileSync(join(out, 'tokens.json'), 'utf8')) : {}
const VERSION = {
  name: 'Nagarro Master Slides',
  owner: 'Carolina Baptista (carolina.baptista@nagarro.com)',
  artifact: 'https://claude.ai/artifact/FTePiAfzdDWtb71Bogjpn2',
  artifactVersion: version,
  upstream: tokens.meta ? `${tokens.meta.repo} @ ${tokens.meta.ref} (synced ${tokens.meta.synced})` : 'unknown',
  syncedAt: new Date().toISOString(),
  templates: catalog.length,
  files,
  note: 'Vendored unmodified. Do not edit; re-run scripts/sync-nagarro-slides.mjs on a newer version.',
}
writeFileSync(join(out, 'VERSION.json'), JSON.stringify(VERSION, null, 2) + '\n')
mkdirSync(resolve(root, 'src/deck'), { recursive: true })
writeFileSync(resolve(root, 'src/deck/catalog.generated.json'), JSON.stringify({ version, templates: catalog }) + '\n')
writeFileSync(resolve(root, 'src/deck/engine.generated.json'), JSON.stringify({ name: VERSION.name, owner: VERSION.owner, artifact: VERSION.artifact, artifactVersion: version, upstream: VERSION.upstream, templates: catalog.length, syncedAt: VERSION.syncedAt, bundleSha256: files['bundle.js'].sha256 }, null, 2) + '\n')
console.log(`Vendored Nagarro Master Slides ${version}: ${catalog.length} templates, ${Object.keys(files).length} files → public/vendor/nagarro-master-slides/`)
