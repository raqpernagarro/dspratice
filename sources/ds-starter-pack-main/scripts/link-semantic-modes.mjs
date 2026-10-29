/**
 * Keeps non-color semantic tokens identical across Light and Dark in Figma.
 *
 *   npm run figma:link-modes                 # apply
 *   npm run figma:link-modes -- --dry-run    # report only
 *   npm run figma:link-modes -- --prefer=dark
 *
 * Sizing, spacing, radius, type, effects and motion should not change with the color mode.
 * For every non-color variable in the `semantic` collection whose modes differ:
 *  - compare each mode with the snapshot from the last run to find the mode that was edited,
 *    and copy that value to the other mode (works Light → Dark and Dark → Light);
 *  - if both modes changed (or there is no snapshot yet), the preferred mode wins (Light by default).
 *
 * Opt out: put "[per-mode]" anywhere in a variable's description in Figma.
 * Brand extensions are only checked: per-mode differences in their overrides are reported.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import FigmaApi from '../variables-github-action/src/figma_api.ts'

export const PER_MODE_MARKER = '[per-mode]'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const snapshotPath = path.resolve(__dirname, '../stories/base-ui/tokens/figma-mode-links.json')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const prefer = args.find((a) => a.startsWith('--prefer='))?.split('=')[1] === 'dark' ? 'dark' : 'light'

for (const line of fs.readFileSync(path.resolve(__dirname, '../variables-github-action/.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)="(.*)"/)
  if (m) process.env[m[1]] = m[2]
}
const fileKey = process.env.FILE_KEY
const api = new FigmaApi(process.env.PERSONAL_ACCESS_TOKEN)
const { meta } = await api.getLocalVariables(fileKey)
const collections = Object.values(meta.variableCollections)
const semantic = collections.find((c) => c.name === 'semantic')
if (!semantic) throw new Error('semantic collection not found')
const modeId = (name) => semantic.modes.find((m) => m.name.toLowerCase() === name)?.modeId
const MODES = { light: modeId('light'), dark: modeId('dark') }
const other = { light: 'dark', dark: 'light' }

const key = (v) => JSON.stringify(v)
const snapshot = fs.existsSync(snapshotPath) ? JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) : {}

const linked = Object.values(meta.variables).filter(
  (v) => v.variableCollectionId === semantic.id && v.resolvedType !== 'COLOR' && !(v.description ?? '').includes(PER_MODE_MARKER),
)
const optedOut = Object.values(meta.variables).filter(
  (v) => v.variableCollectionId === semantic.id && v.resolvedType !== 'COLOR' && (v.description ?? '').includes(PER_MODE_MARKER),
)

const updates = []
const report = []
const nextSnapshot = {}

for (const v of linked) {
  const val = { light: v.valuesByMode[MODES.light], dark: v.valuesByMode[MODES.dark] }
  let final = val
  if (key(val.light) !== key(val.dark)) {
    const prev = snapshot[v.id]
    const changed = prev
      ? { light: key(val.light) !== key(prev), dark: key(val.dark) !== key(prev) }
      : { light: true, dark: true }
    const source = changed.light && !changed.dark ? 'light' : changed.dark && !changed.light ? 'dark' : prefer
    const target = other[source]
    updates.push({ variableId: v.id, modeId: MODES[target], value: val[source] })
    const why = !prev ? ` (first link; ${prefer} preferred)` : changed.light && changed.dark ? ` (both changed; ${prefer} preferred)` : ''
    report.push(`${v.name}: ${source} → ${target}${why}`)
    final = { light: val[source], dark: val[source] }
  }
  nextSnapshot[v.id] = final.light
}

// Brands: report non-color overrides that differ between their light/dark modes.
const brandWarnings = []
for (const brand of collections.filter((c) => c.isExtension && c.parentVariableCollectionId === semantic.id)) {
  const bl = brand.modes.find((m) => m.parentModeId === MODES.light)?.modeId
  const bd = brand.modes.find((m) => m.parentModeId === MODES.dark)?.modeId
  for (const v of linked) {
    const o = brand.variableOverrides?.[v.id]
    if (o && key(o[bl]) !== key(o[bd])) brandWarnings.push(`${brand.name}: ${v.name}`)
  }
}

console.log(`Linked tokens: ${linked.length} (opted out with ${PER_MODE_MARKER}: ${optedOut.length})`)
if (optedOut.length) console.log(`  per-mode: ${optedOut.map((v) => v.name).join(', ')}`)
if (!updates.length) console.log('Light and Dark already match.')
for (const line of report) console.log(`  ${line}`)
for (const w of brandWarnings) console.warn(`warn: brand override differs between modes — ${w}`)

if (updates.length && !dryRun) {
  await api.postVariables(fileKey, { variableModeValues: updates })
  console.log(`Updated ${updates.length} value(s) in Figma.`)
}
if (!dryRun) fs.writeFileSync(snapshotPath, JSON.stringify(nextSnapshot, null, 2))
if (dryRun && updates.length) console.log('(dry run — nothing written)')
