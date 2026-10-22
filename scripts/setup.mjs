#!/usr/bin/env node
// setup.mjs — one command to get a colleague running: checks Node, installs dependencies,
// creates .env.local from the example, and reports what is optional (library sources, model key,
// Figma token, Carolina's slide engine, fonts). It never writes outside this folder, never
// commits, and only clones the private library repositories when asked (--clone-sources).
//
//   npm run setup                    check and prepare
//   npm run setup -- --clone-sources also clone DSN and the DS Starter Pack into ./sources
import { existsSync, copyFileSync, readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const p = (...x) => resolve(root, ...x)
const rows = []
const row = (what, status, next = '') => rows.push([what, status, next])

const major = Number(process.versions.node.split('.')[0])
if (major < 20) {
  console.error(`Node ${process.versions.node} is too old. Install Node 20 or newer (https://nodejs.org), then run npm run setup again.`)
  process.exit(1)
}
row('Node', `ok (${process.versions.node})`)

if (!existsSync(p('node_modules'))) {
  console.log('Installing dependencies (npm install)…')
  const res = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], { cwd: root, stdio: 'inherit' })
  if (res.status !== 0) process.exit(res.status ?? 1)
}
row('Dependencies', 'ok')

if (!existsSync(p('.env.local')) && existsSync(p('.env.local.example'))) {
  copyFileSync(p('.env.local.example'), p('.env.local'))
  row('.env.local', 'created from the example', 'Add ANTHROPIC_API_KEY for model drafts; optional FIGMA_TOKEN for Figma refresh')
} else {
  const env = existsSync(p('.env.local')) ? readFileSync(p('.env.local'), 'utf8') : ''
  const has = (k) => new RegExp(`^${k}=\\S+`, 'm').test(env)
  row('Model key', has('ANTHROPIC_API_KEY') ? 'set' : 'not set', has('ANTHROPIC_API_KEY') ? '' : 'Drafts use the template composer until a key is added')
  row('Figma token', has('FIGMA_TOKEN') ? 'set' : 'not set', has('FIGMA_TOKEN') ? '' : 'Figma refresh uses the plugin or figma-cli instead')
}

const sources = [
  ['DSN (Rui Dias)', 'DSN-main', 'https://github.com/nagarro-dv/DSN.git', 'src/index.ts'],
  ['DS Starter Pack (Nuno Almeida)', 'ds-starter-pack-main', 'https://github.com/nagarro-dv/ds-starter-pack.git', 'stories/base-ui'],
]
const clone = process.argv.includes('--clone-sources')
for (const [label, dir, url, marker] of sources) {
  const found = [p('sources', dir), p('..', 'demo tools', dir)].find((d) => existsSync(resolve(d, marker)))
  if (found) { row(label, `found (${found.startsWith(root) ? 'sources/' : '../demo tools/'}${dir})`); continue }
  if (clone) {
    console.log(`Cloning ${url} (needs access to the private repository)…`)
    const res = spawnSync('git', ['clone', '--depth', '1', url, p('sources', dir)], { stdio: 'inherit' })
    row(label, res.status === 0 ? 'cloned into sources/' : 'clone failed', res.status === 0 ? '' : 'Ask the owner for access, or work without it')
  } else {
    row(label, 'not installed (optional)', 'Previews of its real components stay off. npm run setup -- --clone-sources')
  }
}

const fonts = existsSync(p('public/fonts/equip')) ? readdirSync(p('public/fonts/equip')).filter((f) => f.endsWith('.woff2')).length : 0
row('Equip fonts', fonts >= 7 ? `ok (${fonts} files)` : 'missing', fonts >= 7 ? '' : 'The shell falls back to system fonts; see public/fonts/README.md')

const slides = p('public/vendor/nagarro-master-slides/VERSION.json')
if (existsSync(slides)) {
  const v = JSON.parse(readFileSync(slides, 'utf8'))
  row("Carolina's slide engine", `ok (Master Slides ${v.artifactVersion})`)
} else row("Carolina's slide engine", 'missing', 'Presentations cannot render; see docs/presentations.md')

const w = [0, 0, 0]
for (const r of rows) r.forEach((c, i) => (w[i] = Math.max(w[i], String(c).length)))
console.log('\nNagarro DS hub · setup\n')
for (const r of rows) console.log(`  ${r[0].padEnd(w[0])}  ${r[1].padEnd(w[1])}  ${r[2]}`)
console.log('\nNext: npm run dev, then open http://localhost:4300\n')
