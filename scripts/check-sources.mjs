#!/usr/bin/env node
/**
 * check-sources.mjs — proves the read-only source repos (DSN, Starter Pack, Presentation Studio, DS Prototyping Tooling) are untouched.
 *
 *   node scripts/check-sources.mjs --write   # store an md5 manifest in docs/sources.md5
 *   node scripts/check-sources.mjs           # verify; exit 1 listing changed / added / removed paths
 *
 * Walks every file under both repos except node_modules, dist, .git, storybook-static,
 * *.tsbuildinfo and .DS_Store (Finder metadata, not source). Pure Node built-ins, no network.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCES = {
  dsn: resolve(APP_ROOT, '..', 'demo tools', 'DSN-main'),
  starter: resolve(APP_ROOT, '..', 'demo tools', 'ds-starter-pack-main'),
  // Carolina's Presentation Studio: run from tool-copies/ (npm run tools), never from here.
  studio: resolve(APP_ROOT, '..', 'demo tools', 'deckgenerator-platform-main'),
  // The ASSA ABLOY DS Prototyping Tooling, behind "Prototype on a client's design system".
  prototyping: resolve(APP_ROOT, '..', 'demo tools', 'ASSA-ABLOY-DS-prototyping-v5'),
}
const MANIFEST = join(APP_ROOT, 'docs', 'sources.md5')
const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git', 'storybook-static'])
const excludedFile = (name) => name.endsWith('.tsbuildinfo') || name === '.DS_Store'

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, entry.name)
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) walk(full, out)
    } else if (entry.isFile() && !excludedFile(entry.name)) {
      out.push(full)
    }
  }
  return out
}

function md5(file) {
  return createHash('md5').update(readFileSync(file)).digest('hex')
}

/** Map of "<source>/<relative path>" → md5, for both repos. */
function snapshot() {
  const map = new Map()
  for (const [label, root] of Object.entries(SOURCES)) {
    if (!existsSync(root)) throw new Error(`Source repo not found: ${root}`)
    for (const file of walk(root)) map.set(`${label}/${relative(root, file).split('\\').join('/')}`, md5(file))
  }
  return map
}

function parseManifest(text) {
  const map = new Map()
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const sep = line.indexOf('  ')
    map.set(line.slice(sep + 2), line.slice(0, sep))
  }
  return map
}

const write = process.argv.includes('--write')
if (!existsSync(resolve(APP_ROOT, '..', 'demo tools'))) {
  // A clone of the repository: the tools run from the vendored copies in sources/ and tool-copies/,
  // and the read-only originals only exist on the machine they were collected on.
  console.log('check-sources: ../demo tools is not on this machine, so there are no read-only originals to check.')
  process.exit(0)
}
const current = snapshot()

if (write) {
  const lines = [
    '# md5 manifest of the read-only source repos (scripts/check-sources.mjs --write)',
    `# generated ${new Date().toISOString()}`,
    ...Object.entries(SOURCES).map(([label, root]) => `# ${label}: ${root}`),
    ...[...current.keys()].sort().map((key) => `${current.get(key)}  ${key}`),
  ]
  writeFileSync(MANIFEST, lines.join('\n') + '\n')
  const perSource = Object.keys(SOURCES).map((l) => `${l}=${[...current.keys()].filter((k) => k.startsWith(l + '/')).length}`)
  console.log(`Wrote ${relative(APP_ROOT, MANIFEST)}: ${current.size} files (${perSource.join(', ')})`)
  process.exit(0)
}

if (!existsSync(MANIFEST)) {
  console.error(`No manifest at ${relative(APP_ROOT, MANIFEST)}. Run: node scripts/check-sources.mjs --write`)
  process.exit(2)
}

const stored = parseManifest(readFileSync(MANIFEST, 'utf8'))
const changed = [], added = [], removed = []
for (const [key, hash] of current) {
  if (!stored.has(key)) added.push(key)
  else if (stored.get(key) !== hash) changed.push(key)
}
for (const key of stored.keys()) if (!current.has(key)) removed.push(key)

if (changed.length || added.length || removed.length) {
  const list = (title, items) => items.length ? `\n${title} (${items.length}):\n  ${items.sort().join('\n  ')}` : ''
  console.error(`Source repos differ from ${relative(APP_ROOT, MANIFEST)}:${list('changed', changed)}${list('added', added)}${list('removed', removed)}`)
  process.exit(1)
}
console.log(`OK: ${current.size} files in the source repos match ${relative(APP_ROOT, MANIFEST)} (unchanged).`)
