/**
 * Component-level overrides: which properties of a component can be overridden, how the override
 * token is named, and which Figma layer bindings it takes over.
 *
 * An override is a token in the `components` collection (next to e.g. `button/label/space-x/md`)
 * that aliases a semantic token. The catalog is derived from the component specs
 * (`stories/base-ui/spec`): every binding with an `override` becomes an overridable property.
 */
import { SPECS } from '../spec'
import { TEXT_STYLES } from '../spec/resolve'
import { PROPERTIES, TEXT_STYLE_FIELDS, type Binding, type ComponentSpec, type TokenKind } from '../spec/types'
import { figmaTokenVar } from './figma-css-var'

export type { TokenKind }

/** size = one token per Size · variant = one per kind × State (colors) · all = one for the component. */
export type OverrideScope = 'size' | 'variant' | 'all'

/** Semantic token prefixes offered for each kind (the current binding is always offered too). */
export const KIND_PREFIXES: Record<TokenKind, string[]> = {
  radius: ['shape/radius/'],
  space: ['space/'],
  dimension: ['size/', 'space/'],
  'border-width': ['size/border/'],
  'font-family': ['font/family/'],
  'font-size': ['font/size/'],
  'font-weight': ['font/weight/'],
  'line-height': ['font/line-height/'],
  background: ['color/background/'],
  border: ['color/border/', 'colors/transparent'],
  foreground: ['color/foreground/'],
  opacity: ['opacity/'],
  shadow: ['effect/shadow/'],
  /** Text styles aren't tokens: the options are the file's text styles (figma-text-styles.json). */
  'text-style': [],
}

export interface OverrideTarget {
  /** Layer path from the variant root, names joined by " › " ("" = the variant itself). */
  layer: RegExp
  fields: string[]
}

export interface OverrideProperty {
  id: string
  label: string
  group: string
  scope: OverrideScope
  kind: TokenKind
  /** Token path with {axis} placeholders: 'button/background/{type}/{state}'. */
  token: string
  targets: OverrideTarget[]
}

export interface OverridableComponent {
  /** Component set name in Figma. */
  name: string
  /** Token prefix in the components collection. */
  slug: string
  properties: OverrideProperty[]
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function overrideProperty(spec: ComponentSpec, b: Binding): OverrideProperty {
  const o = b.override!
  const layers = b.figmaLayers ?? [spec.parts.find((p) => p.id === b.part)!.figma].flat()
  return {
    id: o.id,
    label: o.label,
    group: o.group,
    scope: !b.by.length ? 'all' : b.by.every((a) => a === 'size') ? 'size' : 'variant',
    kind: PROPERTIES[b.property].kind,
    token: o.token,
    targets: layers.map((layer) => ({ layer: new RegExp(`^${escape(layer)}$`), fields: PROPERTIES[b.property].figma })),
  }
}

/**
 * Bindings that share an override id (a popup's background and its arrow's) are one property: the
 * token takes over every layer they bind.
 */
function properties(spec: ComponentSpec): OverrideProperty[] {
  const out = new Map<string, OverrideProperty>()
  for (const b of spec.bindings.filter((x) => x.override)) {
    const p = overrideProperty(spec, b)
    const seen = out.get(p.id)
    if (!seen) out.set(p.id, p)
    else if (seen.token !== p.token) throw new Error(`${spec.name}: override "${p.id}" names two tokens`)
    else seen.targets.push(...p.targets)
  }
  return [...out.values()]
}

export const OVERRIDABLE: OverridableComponent[] = SPECS.filter((s) => s.bindings.some((b) => b.override)).map((spec) => ({
  name: spec.name,
  slug: spec.slug,
  properties: properties(spec),
}))

/** Editor section a property is shown in. */
export type OverrideSection = 'color' | 'size' | 'type'

export function sectionOf(p: OverrideProperty): OverrideSection {
  if (p.group === 'Color') return 'color'
  if (p.kind.startsWith('font-') || p.kind === 'line-height' || p.kind === 'text-style') return 'type'
  return 'size'
}

/**
 * Component overrides as CSS custom properties (token → aliased semantic token). A text-style
 * override (value = a style name) sets one property per font field: <token>/font-size → the
 * style's font size token, and so on (what the generated CSS reads).
 */
export function overrideCss(overrides: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [token, alias] of Object.entries(overrides)) {
    const style = TEXT_STYLES.find((s) => s.name === alias)
    if (!style) out[token] = figmaTokenVar(alias)
    else for (const [prop, field] of TEXT_STYLE_FIELDS) out[`${token}/${prop}`] = figmaTokenVar(style[field])
  }
  return out
}
