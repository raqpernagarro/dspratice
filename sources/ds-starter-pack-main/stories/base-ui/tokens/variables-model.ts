/**
 * Figma variable graph (from figma-variables.json) + manual edits made in the configurator's
 * Variables table. Resolves values per color mode and brand, and turns edits into CSS overrides.
 */
import raw from './figma-variables.json'
import { parseColor, withAlpha } from './color-math'
import { figmaTokenToCssVar } from './figma-css-var'
import type { FigmaValue, VariablesExport } from './exchange-format'
import type { Appearance } from './theme-config'

export type AliasValue = { a: string; o?: string | number }
export type RawValue = string | number | boolean | null | AliasValue
export type VariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'

export interface RawVariable {
  id: string
  name: string
  collection: string
  type: VariableType
  description?: string
  values: Record<string, RawValue>
}

export interface RawCollection {
  id: string
  name: string
  /** `filled`: a mode the imported file doesn't have, filled in from the starter system (see fillMissingModes). */
  modes: { id: string; name: string; parent?: string; filled?: boolean }[]
  /** Variables in the collection (including ones loaded on demand). */
  count: number
  extends?: string
  overrides?: Record<string, Record<string, RawValue>>
}

/** Manual edits: variable id → mode id → value. Mode ids belong to the variable's collection
 *  (or to a brand extension, for brand-specific edits). */
export type VariableEdits = Record<string, Record<string, RawValue>>

export interface ModeContext {
  appearance: Appearance
  /** Brand slug (e.g. "violet") or null. */
  brand: string | null
}

export const isAlias = (v: RawValue): v is AliasValue => typeof v === 'object' && v !== null && 'a' in v

/** Marker for tokens that may differ between color modes (see scripts/link-semantic-modes.mjs). */
export const PER_MODE_MARKER = '[per-mode]'

export const brandSlug = (name: string) => name.replace(/\s*brand\s*/i, '').trim().toLowerCase().replace(/\s+/g, '-')

export interface GraphData {
  collections: RawCollection[]
  variables: RawVariable[]
  /** Component tokens some Figma layer is bound to (absent = treat all as bound). */
  bound?: string[]
}

/** Where the current variables came from. */
export interface VariableSource {
  fileName: string
  exportedAt: string
}

export class VariableGraph {
  collections: RawCollection[] = []
  readonly vars = new Map<string, RawVariable>()
  semantic!: RawCollection
  private bound: Set<string> | null = null
  /** Set when the data comes from a Figma plugin export instead of the repo's synced files. */
  imported: VariableSource | null = null

  constructor(data: GraphData) {
    this.replace(data, null)
  }

  /** Swaps in a different variable set (e.g. a plugin export of another Figma file). */
  replace(data: GraphData, source: VariableSource | null) {
    const sem = data.collections.find((c) => c.name === 'semantic')
    if (!sem) throw new Error('No "semantic" collection found in these variables')
    this.collections = data.collections
    this.vars.clear()
    for (const v of data.variables) this.vars.set(v.id, v)
    this.semantic = sem
    this.bound = data.bound ? new Set(data.bound) : null
    this.imported = source
  }

  /** Variable by name (first match). */
  byName(name: string) {
    for (const v of this.vars.values()) if (v.name === name) return v
    return undefined
  }

  addVariables(list: RawVariable[]) {
    for (const v of list) this.vars.set(v.id, v)
  }

  collection(id: string) {
    return this.collections.find((c) => c.id === id)
  }

  brandCollection(slug: string | null) {
    return slug ? this.collections.find((c) => c.extends === this.semantic.id && brandSlug(c.name) === slug) : undefined
  }

  semanticMode(appearance: Appearance) {
    return this.semantic.modes.find((m) => m.name.toLowerCase() === appearance)?.id ?? this.semantic.modes[0].id
  }

  /** Non-color semantic tokens share one value across color modes unless marked [per-mode]. */
  isLinked(v: RawVariable) {
    return v.collection === this.semantic.id && v.type !== 'COLOR' && !(v.description ?? '').includes(PER_MODE_MARKER)
  }

  /** Exported to CSS as its own custom property (so aliases to it stay var() references). */
  isExported(v: RawVariable) {
    if (v.collection === this.semantic.id || v.name.startsWith('scale/')) return true
    // Component tokens only when a layer uses them; unused ones would shadow the code's fallbacks.
    return (v.name.startsWith('button/') || v.name.startsWith('icon-button/')) && (!this.bound || this.bound.has(v.name))
  }

  /** Value of `v` in a context: brand edit > brand override > edit > Figma. */
  value(v: RawVariable, ctx: ModeContext, edits: VariableEdits = {}): RawValue {
    if (v.collection === this.semantic.id) {
      const mode = this.semanticMode(this.isLinked(v) ? 'light' : ctx.appearance)
      const brand = this.brandCollection(ctx.brand)
      const brandMode = brand?.modes.find((m) => m.parent === mode)?.id
      if (brand && brandMode) {
        const e = edits[v.id]?.[brandMode]
        if (e !== undefined) return e
        const o = brand.overrides?.[v.id]?.[brandMode]
        if (o !== undefined) return o
      }
      return edits[v.id]?.[mode] ?? v.values[mode] ?? null
    }
    const mode = Object.keys(v.values)[0]
    return edits[v.id]?.[mode] ?? v.values[mode] ?? null
  }

  /** Follows aliases to a literal (color string, number, string). */
  resolve(v: RawVariable, ctx: ModeContext, edits: VariableEdits = {}, depth = 0): string | number | boolean | null {
    if (depth > 30) return null
    const val = this.value(v, ctx, edits)
    if (!isAlias(val)) return val
    const target = this.vars.get(val.a)
    if (!target) return null
    const lit = this.resolve(target, ctx, edits, depth + 1)
    if (val.o === undefined || typeof lit !== 'string') return lit
    const op = typeof val.o === 'number' ? val.o : this.resolve(this.vars.get(val.o)!, ctx, edits, depth + 1)
    const alpha = typeof op === 'number' ? (op > 1 ? op / 100 : op) : 1
    const c = parseColor(lit)
    return c ? withAlpha(lit.length > 7 ? lit.slice(0, 7) : lit, c.a * alpha) : lit
  }

  /** Resolves a raw value (as stored in a cell) to a literal. */
  resolveValue(val: RawValue, ctx: ModeContext, edits: VariableEdits = {}): string | number | boolean | null {
    if (!isAlias(val)) return val
    const target = this.vars.get(val.a)
    if (!target) return null
    const lit = this.resolve(target, ctx, edits)
    if (val.o === undefined || typeof lit !== 'string') return lit
    const op = typeof val.o === 'number' ? val.o : this.resolve(this.vars.get(val.o)!, ctx, edits)
    const alpha = typeof op === 'number' ? (op > 1 ? op / 100 : op) : 1
    const c = parseColor(lit)
    return c ? withAlpha(lit.slice(0, 7), c.a * alpha) : lit
  }

  /** CSS value for an exported variable: var() for exported aliases, literal otherwise. */
  cssValue(v: RawVariable, ctx: ModeContext, edits: VariableEdits = {}): string | null {
    const val = this.value(v, ctx, edits)
    if (isAlias(val)) {
      const target = this.vars.get(val.a)
      if (target && this.isExported(target)) {
        if (val.o === undefined) return `var(${figmaTokenToCssVar(target.name)})`
        const op = typeof val.o === 'number' ? val.o : this.resolve(this.vars.get(val.o)!, ctx, edits)
        const pct = typeof op === 'number' ? (op > 1 ? op : op * 100) : 100
        return `color-mix(in srgb, var(${figmaTokenToCssVar(target.name)}) ${Math.round(pct * 10) / 10}%, transparent)`
      }
    }
    const lit = this.resolve(v, ctx, edits)
    if (lit == null) return null
    if (typeof lit === 'number') return formatNumber(v.name, lit)
    if (typeof lit === 'string' && v.name.startsWith('font/family/')) return /\s/.test(lit) && !/^['"]/.test(lit) ? `'${lit}'` : lit
    return String(lit)
  }

  /** True when `v`'s value, followed through non-exported aliases, touches an edited variable. */
  private touchesEdit(v: RawVariable, ctx: ModeContext, edits: VariableEdits, depth = 0): boolean {
    if (depth > 30) return false
    const val = this.value(v, ctx, edits)
    if (!isAlias(val)) return false
    const ids = [val.a, typeof val.o === 'string' ? val.o : null].filter(Boolean) as string[]
    return ids.some((id) => {
      const t = this.vars.get(id)
      if (!t) return false
      if (edits[id]) return true
      return !this.isExported(t) && this.touchesEdit(t, ctx, edits, depth + 1)
    })
  }

  /**
   * CSS overrides produced by manual edits in this context: every edited exported variable, plus
   * exported variables that resolve through an edited primitive (skipped when `generated` already
   * sets them, so theme controls keep priority over indirect edits).
   */
  overrides(ctx: ModeContext, edits: VariableEdits, generated: Record<string, string> = {}): Record<string, string> {
    if (!Object.keys(edits).length) return {}
    const out: Record<string, string> = {}
    for (const v of this.vars.values()) {
      if (!this.isExported(v)) continue
      const direct = Boolean(edits[v.id])
      if (!direct && (generated[v.name] !== undefined || !this.touchesEdit(v, ctx, edits))) continue
      const css = this.cssValue(v, ctx, edits)
      if (css != null) out[v.name] = css
    }
    return out
  }
}

/* ------------------------------------------------- base values from data */

/** CSS for every exported variable in a context (the "Figma base" layer, computed from data). */
export function baseCss(graph: VariableGraph, ctx: ModeContext): Record<string, string> {
  const out: Record<string, string> = {}
  for (const v of graph.vars.values()) {
    if (!graph.isExported(v)) continue
    const css = graph.cssValue(v, ctx)
    if (css != null) out[v.name] = css
  }
  return out
}

/** Literal (resolved, formatted) values of semantic tokens — what the theme generator does math on. */
export function literalMap(graph: VariableGraph, ctx: ModeContext): Record<string, string> {
  const out: Record<string, string> = {}
  for (const v of graph.vars.values()) {
    if (v.collection !== graph.semantic.id) continue
    const lit = graph.resolve(v, ctx)
    if (lit == null) continue
    out[v.name] = typeof lit === 'number' ? formatNumber(v.name, lit) : String(lit)
  }
  return out
}

/* ------------------------------------------------- plugin export → graph */

const hex2 = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
function figmaColorToCss(c: { r: number; g: number; b: number; a?: number }) {
  const a = c.a ?? 1
  return a < 1
    ? `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(a * 1000) / 1000})`
    : `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`
}

function toRawValue(val: FigmaValue): RawValue {
  if (val && typeof val === 'object') {
    if ('type' in val && val.type === 'VARIABLE_ALIAS') return { a: val.id }
    if ('color' in val) {
      const o = val.opacity && typeof val.opacity === 'object' ? { o: val.opacity.id } : typeof val.opacity === 'number' ? { o: val.opacity } : {}
      return 'type' in val.color ? { a: val.color.id, ...o } : figmaColorToCss(val.color)
    }
    if ('r' in val) return figmaColorToCss(val)
  }
  return (val as RawValue) ?? null
}

/** Converts a Figma plugin export (REST-shaped) into the graph's compact format. */
export function graphDataFromExport(exp: VariablesExport): GraphData {
  const cols = Object.values(exp.meta.variableCollections)
  const collections: RawCollection[] = cols.map((c) => ({
    id: c.id,
    name: c.name,
    modes: c.modes.map((m) => ({ id: m.modeId, name: m.name, parent: m.parentModeId })),
    count: c.variableIds?.length ?? 0,
    extends: c.isExtension ? c.parentVariableCollectionId : undefined,
    overrides: c.isExtension
      ? Object.fromEntries(
          Object.entries(c.variableOverrides ?? {}).map(([vid, byMode]) => [
            vid,
            Object.fromEntries(Object.entries(byMode).map(([m, val]) => [m, toRawValue(val)])),
          ]),
        )
      : undefined,
  }))
  const variables: RawVariable[] = Object.values(exp.meta.variables)
    .filter((v) => ['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'].includes(v.resolvedType))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((v) => ({
      id: v.id,
      name: v.name,
      collection: v.variableCollectionId,
      type: v.resolvedType as VariableType,
      description: v.description || undefined,
      values: Object.fromEntries(Object.entries(v.valuesByMode).map(([m, val]) => [m, toRawValue(val)])),
    }))
  const bound = exp.components
    ? [...new Set(exp.components.flatMap((c) => c.variants.flatMap((x) => x.bindings.map((b) => b.variable))))]
    : undefined
  return fillMissingModes({ collections, variables, bound })
}

const APPEARANCE_NAMES: Record<Appearance, string> = { light: 'Light', dark: 'Dark' }

/**
 * A file with Light but no Dark (or the reverse), e.g. one exported while the system had one mode,
 * gets the missing mode filled in from the starter system, by variable name: the values it would
 * have had if the system had shipped both modes from the start. Colors take the starter's values;
 * tokens shared by both modes (type, spacing, shape) and tokens the starter doesn't have copy the
 * file's own mode, as Figma does when a mode is added. Brand collections get the mode too, with
 * the starter brand's overrides when the starter has that brand.
 * Files with both modes, or with neither named Light or Dark, come back unchanged.
 */
export function fillMissingModes(data: GraphData, starterData: GraphData = REPO_DATA): GraphData {
  const sem = data.collections.find((c) => c.name === 'semantic')
  if (!sem?.modes.length) return data
  const has = (a: Appearance) => sem.modes.some((m) => m.name.toLowerCase() === a)
  const missing = (['light', 'dark'] as Appearance[]).filter((a) => !has(a))
  if (missing.length !== 1) return data
  const appearance = missing[0]

  const starter = new VariableGraph(starterData)
  const starterMode = starter.semantic.modes.find((m) => m.name.toLowerCase() === appearance)
  if (!starterMode) return data

  // Starter variable id → this file's variable id, matched by collection and variable name.
  const colName = new Map(data.collections.map((c) => [c.id, c.name]))
  const idByName = new Map(data.variables.map((v) => [`${colName.get(v.collection)}|${v.name}`, v.id]))
  const mapId = (starterId: string) => {
    const s = starter.vars.get(starterId)
    return s ? idByName.get(`${starter.collection(s.collection)?.name}|${s.name}`) : undefined
  }
  const ctx: ModeContext = { appearance, brand: null }
  // An alias keeps pointing at the same token in this file; one this file doesn't have becomes its value.
  const mapValue = (val: RawValue): RawValue => {
    if (!isAlias(val)) return val
    const a = mapId(val.a)
    if (a) {
      if (val.o === undefined) return { a }
      if (typeof val.o === 'number') return { a, o: val.o }
      const o = mapId(val.o)
      if (o) return { a, o }
      const op = starter.vars.get(val.o)
      const n = op ? starter.resolve(op, ctx) : null
      if (typeof n === 'number') return { a, o: n }
    }
    return starter.resolveValue(val, ctx)
  }
  const shared = (v: RawVariable) => v.type !== 'COLOR' && !(v.description ?? '').includes(PER_MODE_MARKER)
  const starterByName = new Map([...starter.vars.values()].filter((v) => v.collection === starter.semantic.id).map((v) => [v.name, v]))

  const modeId = `filled:${appearance}`
  const own = sem.modes[0].id
  const variables = data.variables.map((v) => {
    if (v.collection !== sem.id) return v
    const s = starterByName.get(v.name)
    const value = !shared(v) && s && s.values[starterMode.id] !== undefined ? mapValue(s.values[starterMode.id]) : (v.values[own] ?? null)
    return { ...v, values: { ...v.values, [modeId]: value } }
  })
  const vById = new Map(variables.map((v) => [v.id, v]))

  const collections = data.collections.map((c) => {
    if (c.id === sem.id) return { ...c, modes: [...c.modes, { id: modeId, name: APPEARANCE_NAMES[appearance], filled: true }] }
    if (c.extends !== sem.id) return c
    const brandMode = `${modeId}:${c.id}`
    const ownMode = c.modes.find((m) => m.parent === own)?.id
    const starterBrand = starter.brandCollection(brandSlug(c.name))
    const starterBrandMode = starterBrand?.modes.find((m) => m.parent === starterMode.id)?.id
    const overrides: Record<string, Record<string, RawValue>> = { ...c.overrides }
    for (const [vid, byMode] of Object.entries(c.overrides ?? {})) {
      const v = vById.get(vid)
      if (v && shared(v) && ownMode && byMode[ownMode] !== undefined) overrides[vid] = { ...byMode, [brandMode]: byMode[ownMode] }
    }
    if (starterBrand && starterBrandMode)
      for (const [sid, byMode] of Object.entries(starterBrand.overrides ?? {})) {
        const vid = mapId(sid)
        const v = vid ? vById.get(vid) : undefined
        if (!v || shared(v) || byMode[starterBrandMode] === undefined) continue
        overrides[v.id] = { ...overrides[v.id], [brandMode]: mapValue(byMode[starterBrandMode]) }
      }
    return { ...c, modes: [...c.modes, { id: brandMode, name: APPEARANCE_NAMES[appearance], parent: modeId, filled: true }], overrides }
  })

  return { ...data, collections, variables }
}

/** Unit for a FLOAT token, decided by its path (same rules as the Figma → CSS sync). */
export function formatNumber(name: string, n: number) {
  if (name.includes('weight')) return String(n)
  if (name.includes('duration')) return `${n}ms`
  if (name.startsWith('opacity/')) return String(n > 1 ? n / 100 : n)
  return `${n}px`
}

/** The repo's own variables (synced from Figma), used until a plugin export is imported. */
export const REPO_DATA = raw as unknown as GraphData

export const variableGraph = new VariableGraph(REPO_DATA)
