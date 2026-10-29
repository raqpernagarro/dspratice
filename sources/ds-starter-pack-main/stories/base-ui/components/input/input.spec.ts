import { bodyStyle, sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type InputSize = 'sm' | 'md' | 'lg'
type State = 'default' | 'hover' | 'focused' | 'disabled'

/*
 * The field is a box (root, a <label>) holding an optional icon and Base UI's Input (value).
 * Base UI sets data-filled / data-focused / data-invalid / data-disabled on the input; the box
 * reacts to them with :has().
 */
const VALUE = '.ds-input__value'

const filled: Axis = {
  id: 'filled',
  figma: 'Filled',
  kind: 'state',
  on: 'value',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-filled])'] },
    // Base UI sets data-filled inside a Field; :placeholder-shown covers inputs outside one (Autocomplete).
    { code: 'true', figma: 'True', css: ['[data-filled]', ':not(:placeholder-shown)'] },
  ],
}

const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [`:hover:not(:has(> ${VALUE}[data-disabled])):not(:focus-within)`, '[data-preview-state="hover"]'] },
    // :focus-within also covers inputs outside a Field (no data-focused there).
    { code: 'focused', figma: 'Focused', css: [`:has(> ${VALUE}[data-focused])`, ':focus-within', '[data-preview-state="focused"]'] },
    { code: 'disabled', figma: 'Disabled', css: [`:has(> ${VALUE}[data-disabled])`] },
  ],
}

const invalid: Axis = {
  id: 'invalid',
  figma: 'Invalid',
  kind: 'state',
  on: 'value',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-invalid])'] },
    { code: 'true', figma: 'True', css: ['[data-invalid]'] },
  ],
}

export const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as InputSize]

/** Field boxes share these (Select, Combobox). */
export function fieldBorder(v: VariantValues) {
  const s = v.state as State
  if (s === 'disabled') return 'color/border/interactive/disabled'
  if (v.invalid === 'true') return 'color/border/error'
  return s === 'focused' ? 'color/border/interactive/selected' : `color/border/interactive/${s}`
}

export function fieldText(v: VariantValues) {
  if (v.state === 'disabled') return 'color/foreground/interactive/disabled'
  return v.filled === 'true' ? 'color/foreground/neutral/primary' : 'color/foreground/neutral/secondary'
}

export const inputSpec: ComponentSpec = {
  name: 'Input',
  slug: 'input',
  axes: [sizes(), state, filled, invalid],
  // A disabled field isn't shown as invalid.
  exists: (v) => !(v.state === 'disabled' && v.invalid === 'true'),
  parts: [
    { id: 'root', figma: '', description: 'The field’s box: surface, border, padding and focus ring. Clicking anywhere in it focuses the input.' },
    { id: 'icon', figma: 'icon', description: 'Leading icon, shown by default (Figma: Show icon / Icon; code: showIcon / icon). Magnifying glass unless swapped.' },
    { id: 'value', baseUi: 'Input', figma: 'value', description: 'The value, or the placeholder while empty.' },
  ],
  bindings: [
    { part: 'root', property: 'height', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'height', label: 'Height', group: 'Container', token: 'input/height/{size}' } },
    { part: 'root', property: 'padding-x', by: ['size'], value: bySize('space/sm', 'space/md', 'space/lg'), override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'input/space-x/{size}' } },
    { part: 'root', property: 'gap', by: ['size'], value: bySize('space/xs', 'space/sm', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'input/gap/{size}' } },
    { part: 'root', property: 'radius', by: ['size'], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'input/radius/{size}' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'input/border-width' } },
    { part: 'root', property: 'background', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/background/interactive/disabled' : 'color/background/neutral/primary'), override: { id: 'background', label: 'Background', group: 'Color', token: 'input/background/{state}' } },
    { part: 'root', property: 'border-color', by: ['invalid', 'state'], value: fieldBorder, override: { id: 'border-color', label: 'Border', group: 'Color', token: 'input/border-color/{invalid}/{state}' } },
    { part: 'root', property: 'shadow', by: ['invalid', 'state'], value: (v) => (v.state !== 'focused' ? 'none' : v.invalid === 'true' ? 'effect/shadow/focus-ring/error' : 'effect/shadow/focus-ring/primary') },
    { part: 'icon', property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm'), override: { id: 'icon-size', label: 'Icon size', group: 'Icon', token: 'input/icon/size/{size}' } },
    { part: 'icon', property: 'foreground', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/secondary'), figmaLayers: ['icon › Vector'], override: { id: 'icon-foreground', label: 'Icon', group: 'Color', token: 'input/icon/foreground/{state}' } },
    { part: 'value', property: 'foreground', by: ['filled', 'state'], value: fieldText, override: { id: 'foreground', label: 'Text', group: 'Color', token: 'input/foreground/{filled}/{state}' } },
    { part: 'value', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size), override: { id: 'text-style', label: 'Text style', group: 'Text', token: 'input/text/text-style/{size}' } },
  ],
  tokenKeys: {
    invalid: (v) => (v.invalid === 'true' ? 'invalid' : 'valid'),
    filled: (v) => (v.filled === 'true' ? 'filled' : 'placeholder'),
  },
  docs: {
    summary: 'A single-line text field with an optional leading icon. Use it inside Field to get a label, description and validation message.',
    baseUi: 'https://base-ui.com/react/components/input',
    usage: [
      'Wrap it in Field whenever it has a visible label (almost always).',
      'Use the leading icon for what the field is for (search, email, amount); leave it out when it adds nothing.',
      'Match the size to the buttons next to it; heights are the same as Button’s.',
      'Use the placeholder for an example value, never as the label.',
    ],
    dont: ['Don’t disable a field to show it’s read-only; use readOnly.', 'Don’t make the icon the only clue to what the field is for.'],
    accessibility: [
      'Inside Field, the label, description and error are linked to the input automatically.',
      'The icon is decorative (aria-hidden); the label must say what the field is for.',
      'Invalid sets aria-invalid; the error text is announced with the field.',
    ],
  },
}
