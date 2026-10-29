/**
 * Component anatomy (what each Figma variant's layers are bound to) and the override slots it
 * produces. Used by the configurator's Components view and its change-set export.
 *
 * Source: the plugin export's `components` section, or figma-components.json (kept in the repo by
 * the sync / scanned once from the Figma file).
 */
import repo from './figma-components.json'
import type { AnatomyBinding, ComponentAnatomy, ComponentOverrideChange } from './exchange-format'
import { OVERRIDABLE, type OverridableComponent, type OverrideProperty } from './component-tokens'
import { combos, figmaProps, overrideToken, specBySlug, type Binding, type ComponentSpec, type VariantValues } from '../spec'

const REPO_ANATOMY = repo as unknown as ComponentAnatomy[]
let anatomy = REPO_ANATOMY

/** Swaps in the anatomy of an imported file (falls back to the repo's when it has none). */
export function setComponentAnatomy(list: ComponentAnatomy[] | null | undefined) {
  anatomy = list?.length ? list : REPO_ANATOMY
  slots = null
}

/**
 * A component's anatomy: from the imported file when it has the component, else the repo's copy
 * (an export made before the component existed still lets you edit it).
 */
export function anatomyOf(component: OverridableComponent) {
  return anatomy.find((c) => c.name === component.name) ?? REPO_ANATOMY.find((c) => c.name === component.name)
}

/** The repo's own anatomy (what the system's components are bound to), whatever file is imported. */
export const repoAnatomy = () => REPO_ANATOMY

/** Components that can be overridden and exist in the current file. */
export function overridableComponents() {
  return OVERRIDABLE.filter((c) => anatomyOf(c))
}

const specOf = (component: OverridableComponent): ComponentSpec => specBySlug(component.slug)!
const bindingOf = (component: OverridableComponent, property: OverrideProperty): Binding =>
  specOf(component).bindings.find((b) => b.override?.id === property.id)!

/* ------------------------------------------------------------ variant axes */

/**
 * A color "kind": one combination of the axes that aren't Size or State (Button: Type × Destructive,
 * Checkbox: Checked). Colors are edited per kind and state.
 */
export interface VariantKind {
  values: VariantValues
  slug: string
  label: string
}

const KIND_SKIP = new Set(['size', 'state'])
export const kindAxes = (component: OverridableComponent) => specOf(component).axes.filter((a) => !KIND_SKIP.has(a.id) && !a.layout)

/** "Type", "Checked": what the kind picker is called. */
export const kindTitle = (component: OverridableComponent) => kindAxes(component).map((a) => a.figma).filter((n) => n !== 'Destructive').join(' × ') || 'Variant'

const isFlag = (a: ComponentSpec['axes'][number]) => a.values.length === 2 && a.values.every((x) => x.figma === 'True' || x.figma === 'False')

export function variantKinds(component: OverridableComponent): VariantKind[] {
  const axes = kindAxes(component)
  const spec = specOf(component)
  const out = combos(spec, axes.map((a) => a.id)).map((values) => {
    const parts = axes.map((a) => {
      const v = a.values.find((x) => x.code === values[a.id])!
      if (isFlag(a)) return v.figma === 'True' ? { slug: a.id, label: a.figma } : null
      return { slug: v.code, label: v.figma === 'True' || v.figma === 'False' ? v.code.charAt(0).toUpperCase() + v.code.slice(1) : v.figma }
    })
    const kept = parts.filter((p): p is { slug: string; label: string } => !!p)
    return { values, slug: kept.map((p) => p.slug).join('-') || 'default', label: kept.map((p) => p.label).join(' · ') || 'Default' }
  })
  // Flagged variants (Destructive) after the plain ones, like the Figma set.
  return out.sort((a, b) => Number(a.label.includes(' · ')) - Number(b.label.includes(' · ')))
}

/** Figma option names of an axis, in spec order ([] when the component has no such axis). */
function axisOptions(component: OverridableComponent, id: string) {
  return specOf(component).axes.find((a) => a.id === id)?.values.map((x) => x.figma) ?? []
}
export const sizesOf = (component: OverridableComponent) => axisOptions(component, 'size')
export const statesOf = (component: OverridableComponent) => axisOptions(component, 'state')

/* ------------------------------------------------------------------ slots */

/** What the editor is pointing at: one size, one color kind, one state (Figma option names / kind slug). */
export interface Selection {
  size: string
  kind: string
  state: string
}

export function defaultSelection(component: OverridableComponent): Selection {
  const sizes = sizesOf(component)
  return {
    size: sizes.includes('Medium') ? 'Medium' : (sizes[0] ?? ''),
    kind: variantKinds(component)[0]?.slug ?? 'default',
    state: statesOf(component)[0] ?? '',
  }
}

/** Code values for a selection: size / state from their Figma names, kind axes from the kind. */
export function selectionValues(component: OverridableComponent, sel: Selection): VariantValues {
  const spec = specOf(component)
  const code = (id: string, figma: string) => spec.axes.find((a) => a.id === id)?.values.find((x) => x.figma === figma)?.code
  const kind = variantKinds(component).find((k) => k.slug === sel.kind)
  const out: VariantValues = { ...(kind?.values ?? {}) }
  const size = code('size', sel.size)
  const state = code('state', sel.state)
  if (size) out.size = size
  if (state) out.state = state
  return out
}

/** One override token and the variants it applies to. */
export interface OverrideSlot {
  component: OverridableComponent
  property: OverrideProperty
  token: string
  /** Variant properties selecting the variants, e.g. { Size: "Large" }. */
  variants: Record<string, string>
}

function slotAt(component: OverridableComponent, property: OverrideProperty, values: VariantValues): OverrideSlot | null {
  const spec = specOf(component)
  const b = bindingOf(component, property)
  if (b.by.some((id) => values[id] === undefined)) return null
  const own = Object.fromEntries(b.by.map((id) => [id, values[id]]))
  return { component, property, token: overrideToken(spec, b, own)!, variants: figmaProps(spec, own) }
}

export function slotFor(component: OverridableComponent, property: OverrideProperty, sel: Selection): OverrideSlot | null {
  if (!anatomyOf(component)) return null
  return slotAt(component, property, selectionValues(component, sel))
}

let slots: Map<string, OverrideSlot> | null = null

/** Every possible override token in the current anatomy, by token name. */
export function allSlots() {
  if (slots) return slots
  slots = new Map()
  for (const component of overridableComponents()) {
    for (const property of component.properties) {
      for (const values of combos(specOf(component), bindingOf(component, property).by)) {
        const slot = slotAt(component, property, values)
        if (slot) slots.set(slot.token, slot)
      }
    }
  }
  return slots
}

const matches = (props: Record<string, string>, filter: Record<string, string>) =>
  Object.entries(filter).every(([k, v]) => props[k] === undefined || props[k] === v)

/** Bindings an override slot takes over, in every variant it applies to. */
export function slotBindings(slot: OverrideSlot): AnatomyBinding[] {
  const a = anatomyOf(slot.component)
  if (!a) return []
  const out: AnatomyBinding[] = []
  for (const v of a.variants) {
    if (!matches(v.props, slot.variants)) continue
    for (const b of v.bindings) {
      if (slot.property.targets.some((t) => t.layer.test(b.layer) && t.fields.includes(b.field))) out.push(b)
    }
  }
  return out
}

/**
 * The override slot that owns one layer property in one variant (Button, { Size: Large, … },
 * "Label", "fills"), or null when the code has no setting for it.
 */
export function slotForBinding(component: string, props: Record<string, string>, layer: string, field: string): OverrideSlot | null {
  for (const slot of allSlots().values()) {
    if (slot.component.name !== component || !matches(props, slot.variants)) continue
    if (slot.property.targets.some((t) => t.layer.test(layer) && t.fields.includes(field))) return slot
  }
  return null
}

/** Variables the slot's layers are bound to today (usually one). */
export function currentBindings(slot: OverrideSlot) {
  return [...new Set(slotBindings(slot).map((b) => b.variable))]
}

/** Number of variants the slot applies to. */
export function variantCount(slot: OverrideSlot) {
  const a = anatomyOf(slot.component)
  return a ? a.variants.filter((v) => matches(v.props, slot.variants)).length : 0
}

/**
 * Overrides already in the Figma file: component tokens the component's layers are bound to
 * (e.g. button/label/space-x/md), with the number of bindings each one has.
 */
export function existingOverrides(component: OverridableComponent): { token: string; bindings: number; slot?: OverrideSlot }[] {
  const a = anatomyOf(component)
  if (!a) return []
  const counts = new Map<string, number>()
  for (const v of a.variants) {
    for (const b of v.bindings) {
      if (b.variable.startsWith(`${component.slug}/`)) counts.set(b.variable, (counts.get(b.variable) ?? 0) + 1)
    }
  }
  const all = allSlots()
  return [...counts]
    .sort(([x], [y]) => x.localeCompare(y, undefined, { numeric: true }))
    .map(([token, bindings]) => ({ token, bindings, slot: all.get(token) }))
}

/** True when the slot's layers are already bound to its own token (an override in place). */
export function isInPlace(slot: OverrideSlot) {
  const names = currentBindings(slot)
  return names.length > 0 && names.every((n) => n === slot.token)
}

/* ----------------------------------------------------------- change set */

const COLOR_KINDS = new Set(['background', 'border', 'foreground'])

/** Overrides from the theme → plugin instructions (create token, bind layers). */
export function overrideChanges(overrides: Record<string, string>): ComponentOverrideChange[] {
  const out: ComponentOverrideChange[] = []
  const all = allSlots()
  for (const [token, alias] of Object.entries(overrides)) {
    const slot = all.get(token)
    if (!slot) continue
    const fields = new Map<string, Set<string>>()
    for (const b of slotBindings(slot)) {
      if (!fields.has(b.layer)) fields.set(b.layer, new Set())
      fields.get(b.layer)!.add(b.field)
    }
    const kind = slot.property.kind
    out.push({
      component: slot.component.name,
      collection: 'components',
      token,
      type: COLOR_KINDS.has(kind) ? 'COLOR' : kind === 'font-family' || kind === 'text-style' ? 'STRING' : 'FLOAT',
      ...(kind === 'text-style' ? { kind: 'text-style' as const } : {}),
      alias,
      from: currentBindings(slot),
      variants: slot.variants,
      layers: [...fields].map(([layer, f]) => ({ layer, fields: [...f] })),
      reason: `Component · ${slot.component.name} · ${slot.property.label}`,
    })
  }
  return out.sort((a, b) => a.token.localeCompare(b.token))
}
