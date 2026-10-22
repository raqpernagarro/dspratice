#!/usr/bin/env node
// figma-cli-extract.mjs — reads the text of the open Figma Desktop page with figma-cli
// (https://github.com/silships/figma-cli, MIT) using our shared extractor, with zero model tokens
// and no Figma token. Use figma-cli's Safe mode (its FigCli dev plugin) or Browser mode; do NOT use
// its default "Yolo" mode on Nagarro-managed machines (it patches the Figma desktop app).
// Status: written against figma-cli's documented `eval --file`; not exercised on this machine.
//
//   node scripts/figma-cli-extract.mjs <path to figma-cli checkout> --file-key <key> [--page <id>] [--port 9222] [--out file.json]
// Then: npm run knowledge:figma -- <file.json> --source <source id>   (or upload the JSON in the hub)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { tmpdir } from 'node:os'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const val = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined)
const cli = args.find((a) => !a.startsWith('--') && !['--file-key', '--page', '--port', '--out'].includes(args[args.indexOf(a) - 1]))
const fileKey = val('--file-key') ?? ''
if (!cli) {
  console.error('usage: node scripts/figma-cli-extract.mjs <figma-cli checkout> --file-key <key> [--page <page id>] [--port 9222] [--out capture.json]')
  process.exit(1)
}
const extractor = readFileSync(resolve(app, 'figma-plugin/extract-text.js'), 'utf8')
const opts = { fileKey, pageId: val('--page'), capturedBy: 'figma-cli' }
const script = `${extractor}\nextractCapture(${JSON.stringify(opts)}).then((c) => JSON.stringify(c))`
const tmp = join(tmpdir(), `udt-figma-extract-${process.pid}.js`)
writeFileSync(tmp, script)
const env = { ...process.env, ...(val('--port') ? { FIGMA_PORT: val('--port') } : {}) }
const res = spawnSync(process.execPath, [resolve(cli, 'src/index.js'), 'eval', '--file', tmp], { encoding: 'utf8', env, maxBuffer: 50 * 1024 * 1024 })
if (res.status !== 0) {
  console.error(res.stderr || res.stdout || 'figma-cli failed. Is Figma Desktop open and connected (figma-cli connect)?')
  process.exit(res.status ?? 1)
}
const raw = res.stdout.trim()
const json = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
if (json.schema !== 'figma-text@1') throw new Error('Unexpected output from figma-cli eval')
const out = val('--out') ?? resolve(app, '.cache/figma-snapshots', `${(json.fileName || fileKey || 'file').replace(/[^\w-]+/g, '-')}-${json.page.name.replace(/[^\w-]+/g, '-')}.json`)
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(json))
console.log(`${json.frames.length} frames → ${out}`)
