/**
 * Expands a ComponentSpec into what each side consumes:
 * - expectedAnatomy(): every Figma variant's bindings (same shape as figma-components.json)
 * - componentCss(): the component's token stylesheet (<slug>.tokens.css)
 * - tokensUsed(): semantic tokens the component reads (inspector, docs)
 */
import { figmaTokenToCssVar, figmaTokenVar } from '../tokens/figma-css-var'
import textStyles from '../tokens/figma-text-styles.json'
import { PROPERTIES, TEXT_STYLE_FIELDS, type Axis, type Binding, type ComponentSpec, type Part, type TextStyle, type VariantValues } from './types'

export const TEXT_STYLES = textStyles as TextStyle[]
export function textStyle(name: string): TextStyle {
  const s = TEXT_STYLES.find((x) => x.name === name)
  if (!s) throw new Error(`Unknown text style "${name}" (figma-text-styles.json)`)
  return s
}

/* -------------------------------------------------------------- variants */

function product(axes: Axis[]): VariantValues[] {
  let out: VariantValues[] = [{}]
  for (const axis of axes) out = out.flatMap((v) => axis.values.map((x) => ({ ...v, [axis.id]: x.code })))
  return out
}

/** Every variant that exists (Figma variants, code matrix). */
export function variantsOf(spec: ComponentSpec): VariantValues[] {
  return product(spec.axes).filter((v) => spec.exists?.(v) ?? true)
}

/** Combinations of some axes that occur in at least one existing variant. */
export function combos(spec: ComponentSpec, axisIds: string[]): VariantValues[] {
  const axes = axisIds.map((id) => axis(spec, id))
  const all = variantsOf(spec)
  return product(axes).filter((c) => all.some((v) => axisIds.every((id) => v[id] === c[id])))
}

export function axis(spec: ComponentSpec, id: string): Axis {
  const a = spec.axes.find((x) => x.id === id)
  if (!a) throw new Error(`${spec.name}: unknown axis "${id}"`)
  return a
}

export function part(spec: ComponentSpec, id: string): Part {
  const p = spec.parts.find((x) => x.id === id)
  if (!p) throw new Error(`${spec.name}: unknown part "${id}"`)
  return p
}

/** Figma variant properties for code values: { Type: 'Primary', Size: 'Medium', … }. */
export function figmaProps(spec: ComponentSpec, v: VariantValues): Record<string, string> {
  const out: Record<string, string> = {}
  for (const a of spec.axes) {
    if (v[a.id] === undefined) continue
    out[a.figma] = a.values.find((x) => x.code === v[a.id])!.figma
  }
  return out
}

/** Code values for Figma variant properties (inverse of figmaProps). */
export function codeValues(spec: ComponentSpec, props: Record<string, string>): VariantValues {
  const out: VariantValues = {}
  for (const a of spec.axes) {
    const x = a.values.find((y) => y.figma === props[a.figma])
    if (x) out[a.id] = x.code
  }
  return out
}

/* -------------------------------------------------------------- bindings */

/** Combinations of a binding's axes it exists in (all, unless it has `exists`). */
export function bindingCombos(spec: ComponentSpec, b: Binding): VariantValues[] {
  return combos(spec, b.by).filter((v) => !b.exists || b.exists(v))
}

/** Figma slot layers: what's inside them is the designer's, not the spec's. */
export const slotLayers = (spec: ComponentSpec) => (spec.figmaProps ?? []).flatMap((p) => (p.kind === 'slot' ? [p.layer] : []))
export const inSlot = (spec: ComponentSpec, layer: string) => slotLayers(spec).some((slot) => layer.startsWith(`${slot} › `))

export function valueOf(b: Binding, v: VariantValues) {
  return typeof b.value === 'function' ? b.value(v) : b.value
}

/** The override token for a variant: 'button/space-x/{size}' → 'button/space-x/md'. */
export function overrideToken(spec: ComponentSpec, b: Binding, v: VariantValues) {
  if (!b.override) return null
  return b.override.token.replace(/\{(\w+)\}/g, (_, key: string) => spec.tokenKeys?.[key]?.(v) ?? v[key] ?? '')
}

/** CSS value: the override token when set, else the semantic token. */
export function cssValue(spec: ComponentSpec, b: Binding, v: VariantValues) {
  const semantic = valueOf(b, v)
  const token = overrideToken(spec, b, v)
  const fallback = figmaTokenVar(semantic)
  return !token || token === semantic ? fallback : `var(${figmaTokenToCssVar(token)}, ${fallback})`
}

/**
 * CSS declarations for a binding in one variant. A text style becomes its four font tokens; an
 * override of it sets <token>/<css property> (e.g. --button-label-text-style-md-font-size).
 */
export function cssDeclarations(spec: ComponentSpec, b: Binding, v: VariantValues): [string, string][] {
  if (b.property !== 'text-style') return PROPERTIES[b.property].css.map((prop) => [prop, cssValue(spec, b, v)])
  const style = textStyle(valueOf(b, v))
  const token = overrideToken(spec, b, v)
  return TEXT_STYLE_FIELDS.map(([prop, field]) => {
    const fallback = figmaTokenVar(style[field])
    return [prop, token ? `var(${figmaTokenToCssVar(`${token}/${prop}`)}, ${fallback})` : fallback]
  })
}

const layersOf = (spec: ComponentSpec, b: Binding) => {
  return b.figmaLayers ?? [part(spec, b.part).figma].flat()
}

/* ------------------------------------------------------- figma anatomy */

export interface AnatomyBinding {
  layer: string
  field: string
  variable: string
}

export interface ExpectedAnatomy {
  name: string
  axes: Record<string, string[]>
  variants: { props: Record<string, string>; bindings: AnatomyBinding[] }[]
}

/** What every Figma variant's layers must be bound to. */
export function expectedAnatomy(spec: ComponentSpec): ExpectedAnatomy {
  return {
    name: spec.name,
    axes: Object.fromEntries(spec.axes.map((a) => [a.figma, a.values.map((x) => x.figma)])),
    variants: variantsOf(spec).map((v) => {
      const bindings: AnatomyBinding[] = []
      for (const b of spec.bindings) {
        if (b.on === 'code' || b.when) continue
        if (b.exists && !b.exists(v)) continue
        const variable = valueOf(b, v)
        if (variable === 'none') continue
        for (const layer of layersOf(spec, b)) {
          if (inSlot(spec, layer)) continue
          for (const field of PROPERTIES[b.property].figma) bindings.push({ layer, field, variable })
        }
      }
      return { props: figmaProps(spec, v), bindings }
    }),
  }
}

/* ------------------------------------------------------------------- css */

export const rootClass = (spec: ComponentSpec) => `ds-${spec.slug}`
export const partClass = (spec: ComponentSpec, partId: string) =>
  partId === 'root' ? rootClass(spec) : `ds-${spec.slug}__${partId}`

/** Selector alternatives for one axis value ('' = no condition). */
function conditions(a: Axis, code: string): string[] {
  const x = a.values.find((y) => y.code === code)!
  if (x.css) return x.css.length ? x.css : ['']
  if (a.kind === 'state') return ['']
  return [`[${a.attr ?? `data-${a.id}`}="${code}"]`]
}

/** Parts from the root (or the nearest portalled part, which isn't inside the root) down to `id`. */
function lineage(spec: ComponentSpec, id: string): string[] {
  const chain = [id]
  for (let p = part(spec, id); p.id !== 'root' && !p.portal; p = part(spec, p.parent ?? 'root')) chain.unshift(p.parent ?? 'root')
  return chain
}

/**
 * Selector alternatives for a binding in one variant. Each axis condition is matched on the part
 * that carries it: on the element itself or an ancestor (descendant combinator), or on a part
 * elsewhere in the component (`:has()` on the root).
 */
function selectors(spec: ComponentSpec, b: Binding, v: VariantValues): string[] {
  const drawnBy = part(spec, b.part).element
  if (drawnBy) {
    const pseudo = part(spec, b.part).pseudo ?? ''
    if (pseudo && b.when) throw new Error(`${spec.name}: "when" on a pseudo-element part (${b.part})`)
    return selectors(spec, { ...b, part: drawnBy }, v).map((s) => s + pseudo)
  }
  if (b.when) return selectors(spec, { ...b, when: undefined }, v).map((s) => s + b.when)
  const target = part(spec, b.part)
  const chain = target.portal ? [b.part] : lineage(spec, b.part)
  // Alternatives per hosting part, combined across axes.
  const hosts = new Map<string, string[]>()
  for (const id of b.by) {
    const a = axis(spec, id)
    let host = a.on ?? 'root'
    if (target.portal && host === 'root') host = b.part
    const conds = conditions(a, v[id])
    const prev = hosts.get(host) ?? ['']
    hosts.set(host, prev.flatMap((s) => conds.map((c) => s + c)))
  }
  let alts = ['']
  for (const [i, id] of chain.entries()) {
    const own = hosts.get(id) ?? ['']
    const off = [...hosts].filter(([h]) => i === 0 && !chain.includes(h))
    let segs = own.map((c) => `.${partClass(spec, id)}${c}`)
    // Conditions on parts outside the lineage are matched with :has() on the first element.
    for (const [h, conds] of off) segs = segs.flatMap((seg) => conds.map((c) => `${seg}:has(.${partClass(spec, h)}${c})`))
    alts = alts.flatMap((prefix) => segs.map((seg) => (prefix ? `${prefix} ${seg}` : seg)))
  }
  // Ancestors without conditions add nothing but specificity: drop them (keep the first and last).
  return alts.map((sel) =>
    sel
      .split(' ')
      .filter((seg, i, all) => i === 0 || i === all.length - 1 || /[[:]/.test(seg))
      .join(' '),
  )
}

/** The component's token stylesheet: one rule per selector, in state order so later states win ties. */
export function componentCss(spec: ComponentSpec, header = ''): string {
  const rules = new Map<string, { rank: number; decls: string[] }>()
  for (const b of spec.bindings) {
    if (b.on === 'figma') continue
    for (const v of bindingCombos(spec, b)) {
      const key = selectors(spec, b, v).join(',\n')
      if (!rules.has(key)) rules.set(key, { rank: stateRank(spec, v), decls: [] })
      for (const [prop, value] of cssDeclarations(spec, b, v)) rules.get(key)!.decls.push(`  ${prop}: ${value};`)
    }
  }
  const sorted = [...rules].map(([sel, r], i) => ({ sel, ...r, i })).sort((a, b) => a.rank - b.rank || a.i - b.i)
  return header + sorted.map(({ sel, decls }) => `${sel} {\n${decls.join('\n')}\n}`).join('\n\n') + '\n'
}

/** Position of the variant's state values in their axes (0 = default), so hover < pressed < disabled. */
function stateRank(spec: ComponentSpec, v: VariantValues) {
  let rank = 0
  for (const a of spec.axes) {
    if (a.kind === 'state' && v[a.id] !== undefined) rank = Math.max(rank, a.values.findIndex((x) => x.code === v[a.id]))
  }
  return rank
}

/* ------------------------------------------------------------- inventory */

/** Every token the component reads (semantic and component), sorted. */
export function tokensUsed(spec: ComponentSpec): string[] {
  const out = new Set<string>()
  for (const b of spec.bindings) {
    for (const v of bindingCombos(spec, b)) {
      const value = valueOf(b, v)
      if (b.property === 'text-style') for (const [, field] of TEXT_STYLE_FIELDS) out.add(textStyle(value)[field])
      else out.add(value)
    }
  }
  out.delete('none')
  return [...out].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

/** Override tokens a binding can produce, with the Figma variants each one applies to. */
export function overrideSlots(spec: ComponentSpec, b: Binding) {
  if (!b.override) return []
  return bindingCombos(spec, b).map((v) => ({ token: overrideToken(spec, b, v)!, values: v, variants: figmaProps(spec, v) }))
}
