/**
 * Applies a DS Configurator project file to this repo.
 *
 *   npm run ds:apply-project -- acme.dsproject.json
 *
 * Checks the file, then writes it as `ds.project.json` at the repo root. Storybook and the
 * configurator read that file as the default theme (see stories/base-ui/tokens/committed-project.ts),
 * and the configurator opens it as the first project. Commit it and open a pull request.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseProjectFile } from '../../stories/base-ui/tokens/project-file'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const arg = process.argv.slice(2).find((a) => !a.startsWith('-'))

if (!arg) {
  console.error('Usage: npm run ds:apply-project -- <file>.dsproject.json')
  process.exit(1)
}

const input = resolve(process.cwd(), arg)
if (!existsSync(input)) {
  console.error(`File not found: ${input}`)
  process.exit(1)
}

let file
try {
  file = parseProjectFile(readFileSync(input, 'utf8'))
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
}

// Every applied system starts with a version history.
if (!file.versions.length) {
  file.versions = [{ version: '1.0', note: 'First version, set up in the configurator.', date: new Date().toISOString() }]
}

const target = resolve(root, 'ds.project.json')
const replacing = existsSync(target)
writeFileSync(target, JSON.stringify(file, null, 2) + '\n')

const t = file.theme
const lines = [
  `${replacing ? 'Updated' : 'Created'} ds.project.json for “${file.project.name}” (${file.project.appType}).`,
  `  Modes ${t.modes.join(' and ')} (${t.modes[0]} first), brand color ${t.color.main ? `oklch(${t.color.main.l} ${t.color.main.c} ${t.color.main.h})` : 'default'}, body font ${t.type.body?.family ?? 'default'}.`,
  `  ${file.prototypes.length} saved screen(s).`,
  '',
  'Next:',
  '  1. Run `npm run editor:dev`: the configurator shows your system instead of the starter system.',
  '     (A theme edited earlier in the same browser wins over the file: use Reset in the configurator.)',
  '  2. Commit ds.project.json and open a pull request.',
]
console.log(lines.join('\n'))
