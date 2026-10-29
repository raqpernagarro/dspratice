import { ArrowCounterClockwise, CaretDown, Info } from '@phosphor-icons/react'
import { useState } from 'react'

import {
  anatomyOf,
  currentBindings,
  isInPlace,
  kindAxes,
  kindTitle,
  sizesOf,
  slotFor,
  statesOf,
  variantKinds,
  type OverrideSlot,
  type Selection,
} from '../../../stories/base-ui/tokens/component-anatomy'
import {
  KIND_PREFIXES,
  OVERRIDABLE,
  sectionOf,
  type OverridableComponent,
  type OverrideProperty,
  type OverrideSection,
} from '../../../stories/base-ui/tokens/component-tokens'
import { TEXT_STYLES } from '../../../stories/base-ui/spec'
import { figmaTokenVar } from '../../../stories/base-ui/tokens/figma-css-var'
import { variableGraph } from '../../../stories/base-ui/tokens/variables-model'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { contrastRatio, resolveRgba } from '../lib/color'
import { useTokens } from '../showcase/useThemeVars'
import { FieldGroup, Segmented } from './controls/Field'

/** What a slot points at by default: its Figma binding, followed through an existing component token. */
export function defaultAlias(slot: OverrideSlot): { name: string | null; mixed: boolean } {
  const names = currentBindings(slot)
  if (names.length !== 1) return { name: null, mixed: names.length > 1 }
  let name = names[0]
  // Already bound to a component token (e.g. button/label/space-x/md): show what it points at.
  for (let i = 0; i < 5 && name.startsWith(`${slot.component.slug}/`); i++) {
    const v = variableGraph.byName(name)
    const val = v ? Object.values(v.values)[0] : null
    const target = val && typeof val === 'object' && 'a' in val ? variableGraph.vars.get(val.a) : undefined
    if (!target) break
    name = target.name
  }
  return { name, mixed: false }
}

/** Token a slot points at now: the override, else the default. */
export function slotValue(slot: OverrideSlot, overrides: Record<string, string>) {
  return overrides[slot.token] ?? defaultAlias(slot).name
}

/** CSS for a slot's current value (for previews). */
export function slotCss(slot: OverrideSlot | null, overrides: Record<string, string>) {
  const name = slot ? slotValue(slot, overrides) : null
  return name ? figmaTokenVar(name) : 'transparent'
}

function tokenOptions(property: OverrideProperty, include: (string | null)[]) {
  // Text styles: the file's styles, in their own order (Heading … Caption).
  if (property.kind === 'text-style') return TEXT_STYLES.map((s) => s.name)
  const prefixes = KIND_PREFIXES[property.kind]
  const names = new Set<string>()
  for (const v of variableGraph.vars.values()) {
    const semantic = v.collection === variableGraph.semantic.id
    if (prefixes.some((p) => (p.endsWith('/') ? semantic && v.name.startsWith(p) : v.name === p))) names.add(v.name)
  }
  for (const n of include) if (n) names.add(n)
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function InPlaceBadge() {
  return (
    <span className="override-badge override-badge--file" title="Already a component token in the Figma file">
      In Figma
    </span>
  )
}

/* -------------------------------------------------------- non-color rows */

/** What a value looks like: a token's resolved value, or a text style's size / line height. */
function literal(value: string | null | undefined, read: (token: string) => string) {
  if (!value) return '—'
  const style = TEXT_STYLES.find((s) => s.name === value)
  return style ? `${read(style.fontSize)} / ${read(style.lineHeight)}` : read(value)
}

function TokenRow({ slot }: { slot: OverrideSlot }) {
  const { theme, setComponentOverride } = useSemanticEditor()
  const read = useTokens()
  const base = defaultAlias(slot)
  const override = theme.components[slot.token]
  const value = override ?? base.name
  const options = tokenOptions(slot.property, [base.name, override])

  return (
    <div className={`override-row${override ? ' is-overridden' : ''}`}>
      <div className="override-row__head">
        <span className="override-row__label">{slot.property.label}</span>
        {isInPlace(slot) ? <InPlaceBadge /> : null}
        <code className="override-row__token" title="Component token">
          {slot.token}
        </code>
      </div>
      <div className="override-row__control">
        <span className="override-row__literal">{literal(value, read)}</span>
        <select
          value={value ?? ''}
          aria-label={`${slot.property.label} token`}
          onChange={(e) => setComponentOverride(slot.token, e.target.value === base.name ? undefined : e.target.value)}
        >
          {!value ? <option value="">{base.mixed ? 'Mixed' : 'Not bound'}</option> : null}
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
              {name === base.name ? '  (default)' : ''}
            </option>
          ))}
        </select>
        {override ? (
          <button
            type="button"
            className="override-row__reset"
            onClick={() => setComponentOverride(slot.token, undefined)}
            title={`Back to ${base.name ?? 'the default'}`}
            aria-label="Reset override"
          >
            <ArrowCounterClockwise size={12} weight="bold" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ color rows */

/** Semantic color tokens grouped by family (color/background/interactive/primary → its states). */
function swatchGroups(options: string[]) {
  const groups = new Map<string, string[]>()
  for (const name of options) {
    const family = name.includes('/') ? name.slice(0, name.lastIndexOf('/')) : name
    if (!groups.has(family)) groups.set(family, [])
    groups.get(family)!.push(name)
  }
  return [...groups]
}

const leaf = (name: string) => name.slice(name.lastIndexOf('/') + 1)
const familyLabel = (family: string) => family.replace(/^color\/(background|border|foreground)\//, '').replace(/^colors\//, '')

function ColorRow({ slot, open, onToggle, note }: { slot: OverrideSlot; open: boolean; onToggle: () => void; note?: string }) {
  const { theme, setComponentOverride } = useSemanticEditor()
  const base = defaultAlias(slot)
  const override = theme.components[slot.token]
  const value = override ?? base.name
  const options = tokenOptions(slot.property, [base.name, override])

  return (
    <div className={`token-color-row${open ? ' is-open' : ''}${override ? ' is-overridden' : ''}`}>
      <button type="button" className="token-color-row__summary" onClick={onToggle} aria-expanded={open}>
        <span className="token-color-row__swatch" style={{ ['--swatch' as string]: value ? figmaTokenVar(value) : 'transparent' }} />
        <span className="token-color-row__text">
          <span className="token-color-row__label">
            {slot.property.label}
            {isInPlace(slot) ? <InPlaceBadge /> : null}
            {override ? <span className="override-badge">Changed</span> : null}
          </span>
          <code className="token-color-row__value">{value ?? (base.mixed ? 'Mixed' : 'Not bound')}</code>
        </span>
        <CaretDown className="token-color-row__caret" size={12} weight="bold" />
      </button>
      {note ? <p className="token-color-row__note">{note}</p> : null}
      {open ? (
        <div className="swatch-picker">
          {swatchGroups(options).map(([family, names]) => (
            <div key={family} className="swatch-picker__group">
              <span className="swatch-picker__family">{familyLabel(family)}</span>
              <div className="swatch-picker__row">
                {names.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`swatch-picker__swatch${name === value ? ' is-selected' : ''}${name === base.name ? ' is-default' : ''}`}
                    style={{ ['--swatch' as string]: figmaTokenVar(name) }}
                    title={`${name}${name === base.name ? ' (default)' : ''}`}
                    aria-label={name}
                    aria-pressed={name === value}
                    onClick={() => setComponentOverride(slot.token, name === base.name ? undefined : name)}
                  >
                    <span>{leaf(name)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="swatch-picker__foot">
            <span>
              <i className="swatch-picker__dot" /> default · {base.name}
            </span>
            {override ? (
              <button type="button" className="field-group__reset" onClick={() => setComponentOverride(slot.token, undefined)}>
                Reset
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** A color as seen on the card behind it (translucent backgrounds blend over the surface). */
function flatten(color: string, behind: string) {
  const [r, g, b, a] = resolveRgba(color)
  if (a >= 1) return color
  const [br, bg, bb] = resolveRgba(behind)
  const mix = (x: number, y: number) => Math.round(x * a + y * (1 - a))
  return `rgb(${mix(r, br)}, ${mix(g, bg)}, ${mix(b, bb)})`
}

function ColorSectionPanel({ component, selection }: { component: OverridableComponent; selection: Selection }) {
  const { theme, patchSelection } = useSemanticEditor()
  const read = useTokens()
  const [open, setOpen] = useState<string | null>(null)
  const props = component.properties.filter((p) => sectionOf(p) === 'color')
  // The swatch previews the first fill / border / foreground property (Checkbox: its box and check).
  const first = (kind: string) => props.find((p) => p.kind === kind)
  const slotAt = (kind: string, sel: Selection) => {
    const p = first(kind)
    return p ? slotFor(component, p, sel) : null
  }
  const kinds = variantKinds(component)
  const kind = kinds.find((k) => k.slug === selection.kind) ?? kinds[0]
  const flags = kindAxes(component).filter((x) => x.values.length === 2 && x.values.every((v) => v.figma === 'True' || v.figma === 'False'))

  // Translucent fills are shown over the card surface the component sits on.
  const chip = (sel: Selection) => ({
    background: `linear-gradient(${slotCss(slotAt('background', sel), theme.components)}, ${slotCss(slotAt('background', sel), theme.components)}), var(--color-background-surface-low)`,
    color: slotCss(slotAt('foreground', sel), theme.components),
    borderColor: slotCss(slotAt('border', sel), theme.components),
  })

  // Contrast of the label/icon on its background, as rendered on a card.
  const bgSlot = slotAt('background', selection)
  const fgSlot = slotAt('foreground', selection)
  const bgName = bgSlot && slotValue(bgSlot, theme.components)
  const fgName = fgSlot && slotValue(fgSlot, theme.components)
  let note: string | undefined
  if (bgName && fgName && read(fgName) && read(bgName)) {
    const surface = read('color/background/surface/low') || '#ffffff'
    const ratio = contrastRatio(flatten(read(fgName), surface), flatten(read(bgName), surface))
    note = `Contrast on background ${ratio.toFixed(1)}:1 · ${ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large only' : 'below AA'}`
  }

  return (
    <>
      {kinds.length > 1 ? (
        <FieldGroup title={kindTitle(component)} hint={flags.length ? `${flags.map((x) => x.figma).join(' and ')} variants are colored on their own.` : undefined}>
          <div className="variant-chips">
            {kinds.map((k) => (
              <button
                key={k.slug}
                type="button"
                className={`variant-chip${k.slug === kind.slug ? ' is-active' : ''}`}
                aria-pressed={k.slug === kind.slug}
                onClick={() => patchSelection({ kind: k.slug })}
              >
                <span className="variant-chip__sample" style={chip({ ...selection, kind: k.slug, state: 'Default' })}>
                  Aa
                </span>
                <span className="variant-chip__label">{k.label}</span>
              </button>
            ))}
          </div>
        </FieldGroup>
      ) : null}

      {statesOf(component).length ? (
        <FieldGroup title="State" hint={sizesOf(component).length ? 'A state applies to every size.' : undefined}>
          <div className="variant-chips variant-chips--states">
            {statesOf(component).map((state) => (
              <button
                key={state}
                type="button"
                className={`variant-chip${state === selection.state ? ' is-active' : ''}`}
                aria-pressed={state === selection.state}
                onClick={() => patchSelection({ state })}
              >
                <span className="variant-chip__sample" style={chip({ ...selection, kind: kind.slug, state })}>
                  Aa
                </span>
                <span className="variant-chip__label">{state}</span>
              </button>
            ))}
          </div>
        </FieldGroup>
      ) : null}

      <FieldGroup title={[kinds.length > 1 ? kind.label : null, selection.state || null].filter(Boolean).join(' · ') || component.name}>
        {props.map((p) => {
          const slot = slotFor(component, p, selection)
          if (!slot) return null
          return (
            <ColorRow
              key={p.id}
              slot={slot}
              open={open === p.id}
              onToggle={() => setOpen(open === p.id ? null : p.id)}
              note={p === first('foreground') ? note : undefined}
            />
          )
        })}
      </FieldGroup>
    </>
  )
}

/* ------------------------------------------------------- size / type */

function ScaleSectionPanel({ component, selection, section }: { component: OverridableComponent; selection: Selection; section: OverrideSection }) {
  const { patchSelection } = useSemanticEditor()
  const props = component.properties.filter((p) => sectionOf(p) === section)
  const perSize = props.filter((p) => p.scope === 'size')
  const whole = props.filter((p) => p.scope === 'all')
  const groups = [...new Set(perSize.map((p) => p.group))]
  const rows = (list: OverrideProperty[]) =>
    list.map((p) => {
      const slot = slotFor(component, p, selection)
      return slot ? <TokenRow key={p.id} slot={slot} /> : null
    })

  return (
    <>
      {perSize.length ? (
        <FieldGroup title="Per size" hint="Applies to every variant of the chosen size.">
          <Segmented
            label="Size"
            value={selection.size}
            options={sizesOf(component).map((s) => ({ value: s, label: s }))}
            onChange={(size) => patchSelection({ size })}
          />
          {groups.map((g) => (
            <div key={g} className="override-group">
              {groups.length > 1 ? <span className="override-group__title">{g}</span> : null}
              {rows(perSize.filter((p) => p.group === g))}
            </div>
          ))}
        </FieldGroup>
      ) : null}
      {whole.length ? (
        <FieldGroup title="All sizes" hint="One value for every variant.">
          <div className="override-group">{rows(whole)}</div>
        </FieldGroup>
      ) : null}
    </>
  )
}

/* ---------------------------------------------------------------- panel */

const SECTION_TITLES: Record<OverrideSection, string> = { color: 'Color', size: 'Size', type: 'Typography' }

export function ComponentsPanel() {
  const { editingComponent, componentSection, selection, theme } = useSemanticEditor()
  const component = OVERRIDABLE.find((c) => c.slug === editingComponent) ?? OVERRIDABLE[0]
  const a = anatomyOf(component)
  const own = Object.keys(theme.components).filter((t) => t.startsWith(`${component.slug}/`)).length

  return (
    <aside className="semantic-panel component-panel" aria-label={`${component.name} overrides`}>
      <div className="semantic-panel__header">
        <span className="component-panel__eyebrow">{component.name}</span>
        <h2>{SECTION_TITLES[componentSection]}</h2>
        <p className="component-panel__scope" role="note">
          <Info size={14} weight="fill" aria-hidden />
          <span>
            Changes here only apply to <strong>{component.name}</strong>. They become <code>{component.slug}/…</code>{' '}
            component tokens; the theme and every other component are untouched.
          </span>
        </p>
      </div>
      <div className="semantic-panel__content">
        {!a ? (
          <p className="semantic-panel__empty">This file has no “{component.name}” component set.</p>
        ) : componentSection === 'color' ? (
          <ColorSectionPanel component={component} selection={selection} />
        ) : (
          <ScaleSectionPanel component={component} selection={selection} section={componentSection} />
        )}
      </div>
      <footer className="semantic-panel__footer">
        <span className="saved-indicator">Saved locally</span>
        <span className="semantic-panel__footnote">{own ? `${own} change${own === 1 ? '' : 's'} to ${component.name}` : 'No changes yet'}</span>
      </footer>
    </aside>
  )
}
