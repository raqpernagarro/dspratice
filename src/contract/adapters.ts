// Explicit adapters from three real token grammars to the contract's roles.
// The board decision: "3 token grammars → map, don't rename". Each adapter is a pure function
// from a source name to a contract path, or a reason it cannot be mapped automatically.

import { BANNED_WORDS } from '@/fixtures/reference/vocabulary'

export type GrammarId = 'dsn' | 'starter' | 'kit'

export interface MappingResult {
  source: string
  contractPath?: string
  status: 'mapped' | 'needs-decision' | 'unmapped'
  note?: string
}

export interface GrammarInfo {
  id: GrammarId
  name: string
  example: string
  model: string
  modes: string
}

export const GRAMMARS: GrammarInfo[] = [
  { id: 'dsn', name: 'DSN (Nagarro library)', example: '--color-background-accent-strong-default', model: 'Tiers: primitive → semantic (8 families) → component', modes: 'Single brand · light/dark via [data-theme]' },
  { id: 'starter', name: 'DS Starter Pack', example: 'color/background/interactive/primary/pressed', model: 'Semantic collection; brands extend it with overrides', modes: 'light/dark · gold/violet brands · continuous density' },
  { id: 'kit', name: 'Prototyping kit (client-style)', example: '--ds-semantic-color-text-primary-default', model: 'Brand / Theme / Device / _Core collections; modes inside $value', modes: '2 brands × 2 themes × 3 devices' },
]

const STATE = ['default', 'hover', 'active', 'selected', 'disabled', 'focus'] as const

function normaliseWord(w: string): { word: string; renamed?: string } {
  const banned = BANNED_WORDS[w]
  if (banned && !banned.includes(' ')) return { word: banned, renamed: w }
  return { word: w }
}

/** DSN: already the contract grammar. Only the duplicated `accent-strong` family needs a decision. */
export function mapDsn(name: string): MappingResult {
  const bare = name.replace(/^--/, '')
  if (bare.startsWith('primitive-')) {
    return { source: name, contractPath: bare.replace(/-/g, '.'), status: 'mapped' }
  }
  if (bare.startsWith('color-background-accent-strong') || bare.startsWith('color-foreground-accent-strong')) {
    return {
      source: name,
      contractPath: bare.replace('accent-strong', 'interactive-primary').replace(/-/g, '.'),
      status: 'needs-decision',
      note: 'DSN keeps both accent-strong and interactive-primary (aliases). Pick one as the contract role; the other stays as an alias.',
    }
  }
  const componentPrefixes = ['button-', 'input-', 'card-', 'toast-']
  if (componentPrefixes.some((p) => bare.startsWith(p))) {
    return { source: name, contractPath: bare.replace(/-/g, '.'), status: 'mapped', note: 'Component tier' }
  }
  return { source: name, contractPath: bare.replace(/-/g, '.'), status: 'mapped' }
}

/** Starter Pack: slash paths; "pressed" is banned by the vocabulary and maps to "active". */
export function mapStarter(path: string): MappingResult {
  const parts = path.split('/')
  const last = parts[parts.length - 1]
  const n = normaliseWord(last)
  if (n.renamed) {
    const mapped = [...parts.slice(0, -1), n.word].join('.')
    return {
      source: path,
      contractPath: mapped,
      status: 'needs-decision',
      note: `"${n.renamed}" is a banned word (vocabulary → "${n.word}"). Map it, or add "${n.renamed}" to the contract's allowed synonyms for this system.`,
    }
  }
  if (parts[0] === 'button' || parts[0] === 'input') {
    return { source: path, contractPath: parts.join('.'), status: 'mapped', note: 'Component tier' }
  }
  if (parts[0] === 'shape' && last === 'control') {
    return { source: path, contractPath: 'shape.radius.control', status: 'mapped' }
  }
  return { source: path, contractPath: parts.join('.'), status: 'mapped' }
}

const KIT_ROLE: Record<string, string> = {
  'color-text': 'color.foreground',
  'color-surface': 'color.background.surface',
  'color-action': 'color.background.interactive',
  'color-border': 'color.border',
  'color-feedback': 'color.background.status',
  radius: 'shape.radius',
  space: 'space',
}

/** Prototyping kit: `--ds-semantic-<aspect>-<role>-…`, plus device/text/effect/primitive prefixes. */
export function mapKit(name: string): MappingResult {
  const bare = name.replace(/^--ds-/, '')
  if (bare.startsWith('primitive-')) {
    return { source: name, contractPath: bare.replace(/-/g, '.'), status: 'mapped' }
  }
  if (bare.startsWith('device-')) {
    return { source: name, status: 'unmapped', note: 'Device breakpoints are not a contract layer yet. Kept as system-specific.' }
  }
  if (bare.startsWith('text-')) {
    return { source: name, contractPath: 'font.style.' + bare.replace('text-', ''), status: 'needs-decision', note: 'Composite text style; the contract models font family/size/weight separately.' }
  }
  if (bare.startsWith('effect-')) {
    return { source: name, contractPath: 'effect.shadow.' + bare.replace('effect-elevation-', 'lvl'), status: 'mapped' }
  }
  if (bare.startsWith('semantic-')) {
    const rest = bare.replace('semantic-', '')
    const key = Object.keys(KIT_ROLE).find((k) => rest.startsWith(k + '-') || rest === k)
    if (!key) return { source: name, status: 'unmapped', note: 'No role mapping for this aspect.' }
    const tail = rest === key ? [] : rest.slice(key.length + 1).split('-')
    const words = tail.map((w) => normaliseWord(w))
    const renamed = words.find((w) => w.renamed)
    const stateIdx = words.findIndex((w) => (STATE as readonly string[]).includes(w.word))
    const role = KIT_ROLE[key]
    let contractPath: string
    if (key === 'color-text' || key === 'color-action' || key === 'color-feedback' || key === 'color-surface' || key === 'color-border') {
      const roleWords = stateIdx >= 0 ? words.slice(0, stateIdx) : words
      const state = stateIdx >= 0 ? words[stateIdx].word : undefined
      const prominence = roleWords.map((w) => w.word).join('.')
      contractPath = [role, prominence || undefined, state].filter(Boolean).join('.')
      if (key === 'color-text') contractPath = contractPath.replace('color.foreground.primary', 'color.foreground.neutral').replace('color.foreground.secondary', 'color.foreground.neutral.muted')
      if (key === 'color-surface') contractPath = contractPath.replace('surface.primary', 'surface.default').replace('surface.secondary', 'surface.sunken')
    } else if (key === 'radius') {
      const w = words.map((x) => x.word).join('-')
      contractPath = w === 'shape' ? 'shape.radius.control' : `shape.radius.${w}`
      if (w === 'rounded-xl') return { source: name, contractPath: 'shape.radius.lg', status: 'needs-decision', note: 'Kit has 2 radius names for one role (shape, rounded-xl). Confirm which maps to shape.radius.lg.' }
    } else {
      contractPath = `${role}.${words.map((x) => x.word).join('.')}`
      if (words.some((x) => x.word === '4xl')) return { source: name, contractPath, status: 'needs-decision', note: 'Kit space scale goes to 4xl; the contract ladder ends at 2xl. Extend the ladder or alias.' }
    }
    if (renamed) {
      return { source: name, contractPath, status: 'needs-decision', note: `"${renamed.renamed}" is a banned word (vocabulary → "${renamed.word}").` }
    }
    return { source: name, contractPath, status: 'mapped' }
  }
  return { source: name, status: 'unmapped', note: 'Unknown prefix.' }
}

export function mapGrammar(id: GrammarId, names: string[]): MappingResult[] {
  const fn = id === 'dsn' ? mapDsn : id === 'starter' ? mapStarter : mapKit
  return names.map(fn)
}

export function summarise(results: MappingResult[]) {
  return {
    total: results.length,
    mapped: results.filter((r) => r.status === 'mapped').length,
    needsDecision: results.filter((r) => r.status === 'needs-decision').length,
    unmapped: results.filter((r) => r.status === 'unmapped').length,
  }
}
