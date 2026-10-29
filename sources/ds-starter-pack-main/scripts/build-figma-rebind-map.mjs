/**
 * Builds full component→semantic map for Figma rebind plugin.
 * Run: cd variables-github-action && npx tsx ../scripts/build-figma-rebind-map.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import FigmaApi from '../variables-github-action/src/figma_api.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  const envPath = path.resolve(__dirname, '../variables-github-action/.env')
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)="(.*)"/)
    if (m) process.env[m[1]] = m[2]
  }
}
loadEnv()

const COMPONENT_MODE = '4:6'
const api = new FigmaApi(process.env.PERSONAL_ACCESS_TOKEN)
const data = await api.getLocalVariables(process.env.FILE_KEY)
const vars = data.meta.variables

function resolveTargetName(id, modeId, seen = new Set()) {
  if (seen.has(id)) return null
  seen.add(id)
  const v = vars[id]
  if (!v) return null
  const modeIds = Object.keys(v.valuesByMode)
  const val = v.valuesByMode[modeId] ?? v.valuesByMode[modeIds[0]]
  if (val?.type === 'VARIABLE_ALIAS') return resolveTargetName(val.id, modeId, seen)
  if (val?.color?.type === 'VARIABLE_ALIAS') return resolveTargetName(val.color.id, modeId, seen)
  return v.name
}

const map = {}
for (const v of Object.values(vars)) {
  if (!v.name.startsWith('button/') && !v.name.startsWith('icon-button/')) continue
  const target = resolveTargetName(v.id, COMPONENT_MODE)
  if (target && target !== v.name) map[v.name] = target
}

const out = path.resolve(__dirname, '../stories/base-ui/tokens/figma-rebind-map.json')
fs.writeFileSync(out, JSON.stringify(map, null, 2))
console.log(`Wrote ${Object.keys(map).length} entries to figma-rebind-map.json`)
