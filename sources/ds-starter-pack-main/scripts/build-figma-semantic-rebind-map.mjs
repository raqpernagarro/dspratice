/**
 * Maps button/* and icon-button/* variables to semantic color/*, scale/*, font/* targets.
 * Run: cd variables-github-action && npx tsx ../scripts/build-figma-semantic-rebind-map.mjs
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

const STATE_SUFFIX = {
  default: 'default',
  hover: 'hover',
  pressed: 'pressed',
  disabled: 'disabled',
}

/** Mirrors `button-semantic-recipe.ts` colorPath + composite overrides. */
function colorPath(type, destructive, role, state) {
  const s = STATE_SUFFIX[state] ?? state

  if (destructive) {
    if (type === 'primary') {
      if (role === 'bg') return `color/background/interactive/danger/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : 'color/foreground/on-danger/primary'
      if (role === 'border') return `color/background/interactive/danger/${s}`
    }
    if (type === 'ghost') {
      if (role === 'bg') return `color/background/override/destructive-ghost/${s}`
      if (role === 'fg') return `color/foreground/interactive/danger/${s}`
      if (role === 'border') return `color/border/override/ghost/${s}`
    }
  }

  switch (type) {
    case 'primary':
      if (role === 'bg') return s === 'disabled' ? 'color/background/interactive/disabled' : `color/background/interactive/primary/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : 'color/foreground/on-interactive/primary'
      if (role === 'border') return s === 'disabled' ? 'color/background/interactive/disabled' : `color/background/interactive/primary/${s}`
      break
    case 'secondary':
      if (role === 'bg') return s === 'disabled' ? 'color/background/interactive/disabled' : `color/background/interactive/secondary/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : 'color/foreground/neutral/primary'
      if (role === 'border') return `color/border/interactive/${s}`
      break
    case 'ghost':
      if (role === 'bg') return `color/background/override/ghost/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : `color/foreground/interactive/${s}`
      if (role === 'border') return `color/border/override/ghost/${s}`
      break
    case 'outline':
      if (role === 'bg') return `color/background/override/outline/${s}`
      if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : `color/foreground/interactive/${s}`
      if (role === 'border') return `color/border/interactive/${s}`
      break
  }

  return 'color/foreground/neutral/primary'
}

const DIMENSION_MAP = {
  'button/border-width': 'scale/25',
  'button/border-width/outline': 'scale/25',
  'button/size/sm': 'scale/600',
  'button/size/md': 'scale/900',
  'button/size/lg': 'scale/1200',
  'button/space-x/sm': 'scale/150',
  'button/space-x/md': 'scale/200',
  'button/space-x/lg': 'scale/300',
  'button/space-y/sm': 'scale/100',
  'button/space-y/md': 'scale/200',
  'button/space-y/lg': 'scale/300',
  'button/gap/sm': 'scale/50',
  'button/gap/md': 'scale/50',
  'button/gap/lg': 'scale/100',
  'button/icon/size/sm': 'scale/350',
  'button/icon/size/md': 'scale/400',
  'button/icon/size/lg': 'scale/500',
  'button/radius/sm': 'scale/00',
  'button/radius/md': 'scale/00',
  'button/radius/lg': 'scale/00',
  'button/label/size/sm': 'font/size/body/sm',
  'button/label/size/md': 'font/size/body/md',
  'button/label/size/lg': 'font/size/body/lg',
  'button/label/space-x/sm': 'scale/100',
  'button/label/space-x/md': 'scale/100',
  'button/label/space-x/lg': 'scale/100',
  'icon-button/border-width': 'scale/25',
  'icon-button/size/sm': 'scale/600',
  'icon-button/size/md': 'scale/900',
  'icon-button/size/lg': 'scale/1200',
  'icon-button/icon/size/sm': 'scale/350',
  'icon-button/icon/size/md': 'scale/400',
  'icon-button/icon/size/lg': 'scale/500',
  'icon-button/radius/sm': 'scale/00',
  'icon-button/radius/md': 'scale/00',
  'icon-button/radius/lg': 'scale/00',
}

function mapComponentVariable(name) {
  if (DIMENSION_MAP[name]) return DIMENSION_MAP[name]

  const normalized = name.replace(/^icon-button\//, 'button/')
  if (DIMENSION_MAP[normalized]) return DIMENSION_MAP[normalized]

  const colorMatch = normalized.match(/^button\/(background|foreground|border-color)\/(.+)$/)
  if (!colorMatch) return null

  const [, roleKey, tail] = colorMatch
  const role = roleKey === 'background' ? 'bg' : roleKey === 'foreground' ? 'fg' : 'border'

  let destructive = false
  let rest = tail
  if (rest.startsWith('destructive/')) {
    destructive = true
    const sub = rest.slice('destructive/'.length)
    rest = sub.includes('/') ? sub : `primary/${sub}`
  }

  const segments = rest.split('/')
  const buttonType = segments[0]
  const state = segments[1] ?? 'default'

  return colorPath(buttonType, destructive, role, state)
}

const api = new FigmaApi(process.env.PERSONAL_ACCESS_TOKEN)
const data = await api.getLocalVariables(process.env.FILE_KEY)
const vars = data.meta.variables

const map = {}
for (const v of Object.values(vars)) {
  if (!v.name.startsWith('button/') && !v.name.startsWith('icon-button/')) continue
  const target = mapComponentVariable(v.name)
  if (target) map[v.name] = target
}

const out = path.resolve(__dirname, '../stories/base-ui/tokens/figma-rebind-map.json')
fs.writeFileSync(out, JSON.stringify(map, null, 2))

const colorTargets = Object.values(map).filter((t) => t.startsWith('color/'))
console.log(`Wrote ${Object.keys(map).length} entries (${colorTargets.length} color/*) to figma-rebind-map.json`)
