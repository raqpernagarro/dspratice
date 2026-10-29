/**
 * Semantic bindings for button layers (no component-collection composites).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Keep in sync with stories/base-ui/tokens/shared-overlay-tokens.ts */
const SHARED_OVERLAY_COMPOSITES = {
  'color/background/interactive/subtle/default': ['color/foreground/interactive/default', 'opacity/0'],
  'color/background/interactive/subtle/hover': ['color/foreground/interactive/default', 'opacity/10'],
  'color/background/interactive/subtle/pressed': ['color/foreground/interactive/default', 'opacity/15'],
  'color/background/interactive/danger-subtle/default': ['color/foreground/interactive/default', 'opacity/0'],
  'color/background/interactive/danger-subtle/hover': ['color/background/interactive/danger/default', 'opacity/10'],
  'color/background/interactive/danger-subtle/pressed': ['color/background/interactive/danger/default', 'opacity/20'],
}

const TYPES = ['primary', 'secondary', 'ghost', 'outline']
const STATES = ['default', 'hover', 'pressed', 'disabled']
const PREFIXES = ['button', 'icon-button']

function semanticAlias(prefix, role, type, destructive, state) {
  const s = state
  if (destructive && type === 'primary') {
    if (role === 'bg' || role === 'border') return s === 'disabled' ? 'color/background/interactive/disabled' : `color/background/interactive/danger/${s}`
    if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : 'color/foreground/on-danger/primary'
  }
  if (destructive && type === 'ghost') {
    if (role === 'bg') {
      if (state === 'hover') return 'color/background/interactive/danger-subtle/hover'
      if (state === 'pressed') return 'color/background/interactive/danger-subtle/pressed'
      if (state === 'default' || state === 'disabled') return 'color/background/interactive/subtle/default'
    }
    if (role === 'border') return 'colors/transparent'
    if (role === 'fg') return s === 'disabled' ? 'color/foreground/interactive/disabled' : `color/foreground/interactive/danger/${s}`
  }
  if (type === 'ghost' || type === 'outline') {
    if (role === 'bg') {
      if (state === 'hover') return 'color/background/interactive/subtle/hover'
      if (state === 'pressed') return 'color/background/interactive/subtle/pressed'
      if (state === 'default' || state === 'disabled') return 'color/background/interactive/subtle/default'
    }
    if (role === 'border' && type === 'ghost') return 'colors/transparent'
  }
  if (type === 'primary') {
    if (role === 'bg' || role === 'border') return s === 'disabled' ? 'color/background/interactive/disabled' : `color/background/interactive/primary/${s}`
    if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : 'color/foreground/on-interactive/primary'
  }
  if (type === 'secondary') {
    if (role === 'bg') return s === 'disabled' ? 'color/background/interactive/disabled' : `color/background/interactive/secondary/${s}`
    if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : 'color/foreground/neutral/primary'
    if (role === 'border') return `color/border/interactive/${s}`
  }
  if (type === 'ghost' || type === 'outline') {
    if (role === 'fg') return s === 'disabled' ? 'color/foreground/neutral/tertiary' : `color/foreground/interactive/${s}`
    if (role === 'border' && type === 'outline') return `color/border/interactive/${s}`
  }
  return null
}

function componentPath(prefix, role, type, destructive, state) {
  if (destructive && type === 'primary') {
    if (role === 'bg') return `${prefix}/background/destructive/primary/${state}`
    if (role === 'fg') return `${prefix}/foreground/destructive/primary/${state}`
    if (role === 'border') {
      return prefix === 'button'
        ? `${prefix}/border-color/destructive/${state}`
        : `${prefix}/border-color/destructive/primary/${state}`
    }
  }
  if (destructive && type === 'ghost') {
    if (role === 'bg') return `${prefix}/background/destructive/ghost/${state}`
    if (role === 'fg') return `${prefix}/foreground/destructive/ghost/${state}`
    if (role === 'border') return `${prefix}/border-color/destructive/ghost/${state}`
  }
  if (role === 'bg') return `${prefix}/background/${type}/${state}`
  if (role === 'fg') return `${prefix}/foreground/${type}/${state}`
  if (role === 'border') return `${prefix}/border-color/${type}/${state}`
  return null
}

const semanticBindings = {}

for (const prefix of PREFIXES) {
  for (const type of TYPES) {
    for (const destructive of [false, true]) {
      for (const state of STATES) {
        for (const role of ['bg', 'fg', 'border']) {
          const path = componentPath(prefix, role, type, destructive, state)
          if (!path) continue
          const alias = semanticAlias(prefix, role, type, destructive, state)
          if (alias) semanticBindings[path] = alias
        }
      }
    }
  }
}

const out = {
  collection: 'components',
  mode: 'Mode 1',
  modeId: '4:6',
  semanticBindings,
  composites: {},
  sharedOverlay: SHARED_OVERLAY_COMPOSITES,
}

const outPath = path.resolve(__dirname, '../stories/base-ui/tokens/component-button-token-spec.json')
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
fs.writeFileSync(
  path.resolve(__dirname, '../stories/base-ui/tokens/figma-rebind-map.json'),
  JSON.stringify(SHARED_OVERLAY_COMPOSITES, null, 2),
)
console.log(
  `Wrote ${Object.keys(semanticBindings).length} semantic bindings, ${Object.keys(SHARED_OVERLAY_COMPOSITES).length} shared overlay composites`,
)
