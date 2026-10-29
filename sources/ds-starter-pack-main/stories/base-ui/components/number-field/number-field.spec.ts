import { bodyStyle, sizes, type Axis, type Binding, type ComponentSpec, type Property, type VariantValues } from '../../spec/types'

export type NumberFieldSize = 'sm' | 'md' | 'lg'
type State = 'default' | 'hover' | 'focused' | 'disabled'

/** NumberField.Group sets data-focused / data-invalid / data-disabled; it is the box. */
const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [':hover:not([data-disabled]):not([data-focused])', '[data-preview-state="hover"]'] },
    { code: 'focused', figma: 'Focused', css: ['[data-focused]', '[data-preview-state="focused"]'] },
    { code: 'disabled', figma: 'Disabled', css: ['[data-disabled]'] },
  ],
}

const invalid: Axis = {
  id: 'invalid',
  figma: 'Invalid',
  kind: 'state',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-invalid])'] },
    { code: 'true', figma: 'True', css: ['[data-invalid]'] },
  ],
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as NumberFieldSize]

/** Same as Input's border; the − / + dividers use it too. */
function border(v: VariantValues) {
  const s = v.state as State
  if (s === 'disabled') return 'color/border/interactive/disabled'
  if (v.invalid === 'true') return 'color/border/error'
  return s === 'focused' ? 'color/border/interactive/selected' : `color/border/interactive/${s}`
}

const content = (v: VariantValues) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary')
const ENABLED = ':not([data-disabled])'

/** The − and + segments: square, a divider towards the value, a wash on hover / press (code only). */
function stepper(id: 'decrement' | 'increment'): Binding[] {
  const divider: Property = id === 'decrement' ? 'border-right-width' : 'border-left-width'
  return [
    { part: id, property: 'width', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: `${id}-width`, label: id === 'decrement' ? '− width' : '+ width', group: 'Buttons', token: `number-field/${id}/width/{size}` } },
    { part: id, property: divider, by: [], value: 'size/border/regular' },
    { part: id, property: 'border-color', by: ['invalid', 'state'], value: border },
    { part: id, property: 'background', by: [], value: 'color/background/interactive/subtle/default' },
    { part: id, property: 'background', by: [], value: 'color/background/interactive/subtle/hover', when: `:hover${ENABLED}` },
    { part: id, property: 'background', by: [], value: 'color/background/interactive/subtle/pressed', when: `:active${ENABLED}` },
    { part: `${id}-icon`, property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm') },
    { part: `${id}-icon`, property: 'foreground', by: ['state'], value: content, figmaLayers: [`${id} › icon › Vector`] },
  ]
}

export const numberFieldSpec: ComponentSpec = {
  name: 'Number Field',
  slug: 'number-field',
  axes: [sizes(), state, invalid],
  exists: (v) => !(v.state === 'disabled' && v.invalid === 'true'),
  tokenKeys: { invalid: (v) => (v.invalid === 'true' ? 'invalid' : 'valid') },
  parts: [
    { id: 'root', baseUi: 'NumberField.Group', figma: '', description: 'The box: like Input (heights, border, focus ring, invalid).' },
    { id: 'decrement', baseUi: 'NumberField.Decrement', figma: 'decrement', description: 'Steps down. Divided from the value by a line in the border color.' },
    { id: 'decrement-icon', parent: 'decrement', figma: 'decrement › icon', description: 'Minus.' },
    { id: 'value', baseUi: 'NumberField.Input', figma: 'value', description: 'The number, centered, with tabular figures.' },
    { id: 'increment', baseUi: 'NumberField.Increment', figma: 'increment', description: 'Steps up.' },
    { id: 'increment-icon', parent: 'increment', figma: 'increment › icon', description: 'Plus.' },
  ],
  bindings: [
    { part: 'root', property: 'height', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'height', label: 'Height', group: 'Container', token: 'number-field/height/{size}' } },
    { part: 'root', property: 'radius', by: ['size'], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'number-field/radius/{size}' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'number-field/border-width' } },
    { part: 'root', property: 'background', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/background/interactive/disabled' : 'color/background/neutral/primary'), override: { id: 'background', label: 'Background', group: 'Color', token: 'number-field/background/{state}' } },
    { part: 'root', property: 'border-color', by: ['invalid', 'state'], value: border, override: { id: 'border-color', label: 'Border', group: 'Color', token: 'number-field/border-color/{invalid}/{state}' } },
    { part: 'root', property: 'shadow', by: ['invalid', 'state'], value: (v) => (v.state !== 'focused' ? 'none' : v.invalid === 'true' ? 'effect/shadow/focus-ring/error' : 'effect/shadow/focus-ring/primary') },
    ...stepper('decrement'),
    { part: 'value', property: 'foreground', by: ['state'], value: content, override: { id: 'foreground', label: 'Value', group: 'Color', token: 'number-field/foreground/{state}' } },
    { part: 'value', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size), override: { id: 'text-style', label: 'Text style', group: 'Text', token: 'number-field/text-style/{size}' } },
    ...stepper('increment'),
  ],
  docs: {
    summary: 'A numeric input with − / + steppers. Same box as Input, so it lines up with other controls.',
    baseUi: 'https://base-ui.com/react/components/number-field',
    usage: ['Use for small adjustments (quantity, count); type for big jumps.', 'Set min, max and step; wrap in Field for a label.'],
    dont: ['Don’t use for numbers that aren’t quantities (phone, card, postal code); use Input.'],
    accessibility: ['Arrow Up / Down step; Page Up / Down step by 10× (largeStep); Home / End jump to min / max.', 'The − / + buttons have their own labels.'],
  },
}
