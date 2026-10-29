/**
 * The plugin's memory of the last sync, shared by the plugin and the configurator.
 *
 * When the plugin applies a change set, it notes on each variable what the variable held right
 * after (by collection and mode) and, on each component variant, a fingerprint of its bindings. Its
 * next export carries those notes, so the configurator can tell what changed in Figma since, what
 * changed in the system since, and what changed on both sides.
 *
 * Everything here is plain functions over the export's JSON, so both sides compute the same keys.
 */
import type { AnatomyBinding, ChangeValue, FigmaCollectionJson, FigmaValue, VariablesExport } from './exchange-format'

/** Shared plugin data namespace (readable by any version of the plugin). */
export const SYNC_NAMESPACE = 'ds_configurator'
/** On figma.root: the last sync (SyncBase JSON). */
export const SYNC_ROOT_KEY = 'sync'
/** On each variable: { "<collection>|<mode>": valueKey } right after the last sync. */
export const SYNC_VALUES_KEY = 'synced'
/** On each component variant: bindingsHash of its bindings right after the last sync. */
export const SYNC_BINDINGS_KEY = 'bindings'

/** What the file was last synced to. */
export interface SyncBase {
  syncedAt: string
  /** System (theme) name in the change set. */
  source: string
  /** System version the change set was made from, when it said. */
  version?: string
}

/** What a plugin export remembers of the last sync. */
export interface SyncSection {
  /** null: the plugin never applied a change set to this file (with memory). */
  base: SyncBase | null
  /** "<collection>|<variable>|<mode>" → valueKey, as the file was right after the last sync. */
  values: Record<string, string>
  /** variantKey of every variant whose bindings changed since the last sync. */
  rebound: string[]
}

/**
 * A collection as both sides name it: "semantic", "brand:<slug>" for a collection extending
 * semantic (Figma's "Gold", "Gold Brand" and the system's Gold brand are the same), else its name.
 */
export function collectionKey(col: { name: string; isExtension?: boolean; parentVariableCollectionId?: string }, semanticId: string | undefined) {
  if (col.name === 'semantic') return 'semantic'
  if (col.isExtension && col.parentVariableCollectionId === semanticId) return `brand:${brandKey(col.name)}`
  return col.name
}

export const brandKey = (name: string) => name.replace(/\s*brand\s*/i, '').trim().toLowerCase().replace(/\s+/g, '-')

/**
 * A mode as both sides name it: the color mode's name in semantic and brand collections ("Light"),
 * "*" in other single-mode collections (primitives' "Mode 1").
 */
export const modeKey = (collection: string, modeCount: number, name: string) =>
  collection === 'semantic' || collection.startsWith('brand:') || modeCount > 1 ? name : '*'

export const valueId = (collection: string, variable: string, mode: string) => `${collection}|${variable}|${mode}`

const hex2 = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0').toUpperCase()

/** #RRGGBB, or #RRGGBBAA when translucent, from hex (3, 4, 6, 8 digits) or rgb()/rgba(). */
export function canonicalColor(css: string): string | null {
  const s = css.trim()
  const hex = s.match(/^#([0-9a-f]{3,8})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
    if (h.length !== 6 && h.length !== 8) return null
    const a = h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1
    return `#${h.slice(0, 6).toUpperCase()}${a < 1 ? h.slice(6).toUpperCase() : ''}`
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/i)
  if (rgb) {
    const [r, g, b, a = '1'] = rgb[1].split(/[\s,/]+/).filter(Boolean)
    const ch = (x: string) => (x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x) / 255)
    const alpha = a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a)
    return `#${hex2(ch(r))}${hex2(ch(g))}${hex2(ch(b))}${alpha < 1 ? hex2(alpha) : ''}`
  }
  return null
}

/** One comparable, readable string per value: "→ colors/blue/500 · opacity/10", "#1300FF", "12". */
/** Figma stores numbers as 32-bit floats: 6 significant digits are what both sides agree on. */
const num = (n: number) => String(Number(n.toPrecision(6)))

export function valueKey(v: ChangeValue): string {
  if (typeof v === 'object') return `→ ${v.alias}${v.opacity !== undefined ? ` · ${typeof v.opacity === 'number' ? num(v.opacity) : v.opacity}` : ''}`
  if (typeof v === 'number') return num(v)
  if (typeof v === 'string') return canonicalColor(v) ?? v
  return String(v)
}

const isAlias = (v: unknown): v is { type: 'VARIABLE_ALIAS'; id: string } =>
  typeof v === 'object' && v !== null && (v as { type?: string }).type === 'VARIABLE_ALIAS'

function figmaColor(c: { r: number; g: number; b: number; a?: number }) {
  return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${(c.a ?? 1) < 1 ? hex2(c.a!) : ''}`
}

/** A Figma value as the change set writes values (aliases by name). */
export function figmaToChangeValue(val: FigmaValue | undefined, nameOf: (id: string) => { name: string; collection: string } | undefined): ChangeValue | null {
  if (val === undefined || val === null) return null
  if (isAlias(val)) {
    const t = nameOf(val.id)
    return t ? { alias: t.name, collection: t.collection } : null
  }
  if (typeof val === 'object' && 'color' in val) {
    const opacity = val.opacity === undefined ? undefined : isAlias(val.opacity) ? nameOf(val.opacity.id)?.name : val.opacity
    if (isAlias(val.color)) {
      const t = nameOf(val.color.id)
      return t ? { alias: t.name, collection: t.collection, ...(opacity !== undefined ? { opacity } : {}) } : null
    }
    return figmaColor({ ...val.color, a: (val.color.a ?? 1) * (typeof opacity === 'number' ? (opacity > 1 ? opacity / 100 : opacity) : 1) })
  }
  if (typeof val === 'object' && 'r' in val) return figmaColor(val)
  return val as string | number | boolean
}

export interface FileValue {
  /** Variable id in the file (an extension's values belong to the parent's variable). */
  varId: string
  variable: string
  /** collectionKey */
  collection: string
  /** modeKey */
  mode: string
  value: ChangeValue
}

/** Every value in the file: each variable in each mode, and each brand extension's effective value. */
export function fileValues(exp: VariablesExport): FileValue[] {
  const cols = Object.values(exp.meta.variableCollections)
  const colById = new Map(cols.map((c) => [c.id, c]))
  const semanticId = cols.find((c) => c.name === 'semantic')?.id
  const nameOf = (id: string) => {
    const v = exp.meta.variables[id]
    const c = v && colById.get(v.variableCollectionId)
    return v && c ? { name: v.name, collection: c.name } : undefined
  }
  const out: FileValue[] = []
  const push = (varId: string, variable: string, col: FigmaCollectionJson, modeName: string, val: FigmaValue | undefined) => {
    const value = figmaToChangeValue(val, nameOf)
    const collection = collectionKey(col, semanticId)
    if (value !== null) out.push({ varId, variable, collection, mode: modeKey(collection, col.modes.length, modeName), value })
  }
  for (const v of Object.values(exp.meta.variables)) {
    const col = colById.get(v.variableCollectionId)
    if (!col) continue
    for (const m of col.modes) push(v.id, v.name, col, m.name, v.valuesByMode[m.modeId])
  }
  for (const ext of cols) {
    if (!ext.isExtension) continue
    for (const vid of colById.get(ext.parentVariableCollectionId ?? '')?.variableIds ?? []) {
      const v = exp.meta.variables[vid]
      if (!v) continue
      for (const m of ext.modes) push(v.id, v.name, ext, m.name, ext.variableOverrides?.[vid]?.[m.modeId] ?? v.valuesByMode[m.parentModeId ?? ''])
    }
  }
  return out
}

/** Variant identity inside a component set: "Button|Size=Large,State=Hover,Type=Primary". */
export const variantKey = (component: string, props: Record<string, string>) =>
  `${component}|${Object.entries(props)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',')}`

/** Short fingerprint of a variant's bindings (FNV-1a over the sorted list). */
export function bindingsHash(bindings: AnatomyBinding[]) {
  const text = bindings
    .map((b) => `${b.layer}|${b.field}|${b.variable}`)
    .sort()
    .join('\n')
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}
