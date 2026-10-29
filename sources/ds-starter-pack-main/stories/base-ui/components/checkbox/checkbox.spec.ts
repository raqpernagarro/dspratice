import { bodyStyle, labelledControlStates, sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type CheckboxSize = 'sm' | 'md' | 'lg'
export type CheckboxChecked = 'unchecked' | 'checked' | 'indeterminate'
type State = 'default' | 'hover' | 'pressed' | 'disabled'

/** Checked lives on Checkbox.Root (the control), as Base UI's data attributes. */
const checked: Axis = {
  id: 'checked',
  figma: 'Checked',
  kind: 'state',
  on: 'control',
  values: [
    { code: 'unchecked', figma: 'False', css: ['[data-unchecked]'] },
    { code: 'checked', figma: 'True', css: ['[data-checked]'] },
    { code: 'indeterminate', figma: 'Indeterminate', css: ['[data-indeterminate]'] },
  ],
}

const state = labelledControlStates('checkbox')

/** Control fill / border / indicator color per Checked × State. */
function controlColor(role: 'bg' | 'border' | 'fg', v: VariantValues): string {
  const s = v.state as State
  const on = v.checked !== 'unchecked'
  if (s === 'disabled') {
    if (role === 'fg') return 'color/foreground/neutral/tertiary'
    return role === 'bg' ? 'color/background/interactive/disabled' : 'color/border/interactive/disabled'
  }
  // The indicator is only rendered while checked / indeterminate.
  if (role === 'fg') return 'color/foreground/on-accent/primary'
  if (on) return `color/background/accent/${s}`
  if (role === 'bg') return 'color/background/neutral/primary'
  return `color/border/interactive/${s}`
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as CheckboxSize]
const COLOR = ['checked', 'state']

export const checkboxSpec: ComponentSpec = {
  name: 'Checkbox',
  slug: 'checkbox',
  axes: [checked, sizes(), state],
  tokenKeys: { checked: (v) => v.checked },
  parts: [
    { id: 'root', figma: '', description: 'The <label> wrapping the box and its text; clicking either toggles it.' },
    { id: 'control', baseUi: 'Checkbox.Root', figma: 'control', description: 'The box.' },
    { id: 'indicator', baseUi: 'Checkbox.Indicator', parent: 'control', figma: 'control › indicator', description: 'Check or dash icon; only rendered while checked or indeterminate.' },
    { id: 'label', figma: 'label', description: 'The text. Optional (Show label = False), e.g. in table rows that have their own label.' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: ['size'], value: bySize('space/xs', 'space/sm', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'checkbox/gap/{size}' } },
    { part: 'control', property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm'), override: { id: 'control-size', label: 'Box size', group: 'Box', token: 'checkbox/control/size/{size}' } },
    { part: 'control', property: 'radius', by: ['size'], value: 'shape/radius/sm', override: { id: 'radius', label: 'Radius', group: 'Box', token: 'checkbox/control/radius/{size}' } },
    { part: 'control', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Box', token: 'checkbox/control/border-width' } },
    { part: 'control', property: 'background', by: COLOR, value: (v) => controlColor('bg', v), override: { id: 'background', label: 'Background', group: 'Color', token: 'checkbox/control/background/{checked}/{state}' } },
    { part: 'control', property: 'border-color', by: COLOR, value: (v) => controlColor('border', v), override: { id: 'border-color', label: 'Border', group: 'Color', token: 'checkbox/control/border-color/{checked}/{state}' } },
    { part: 'indicator', property: 'foreground', by: COLOR, value: (v) => controlColor('fg', v), figmaLayers: ['control › indicator › Vector'], override: { id: 'foreground', label: 'Check', group: 'Color', token: 'checkbox/indicator/foreground/{checked}/{state}' } },
    { part: 'indicator', property: 'size', by: ['size'], value: bySize('space/md', 'size/2xs', 'size/xs'), override: { id: 'indicator-size', label: 'Icon size', group: 'Box', token: 'checkbox/indicator/size/{size}' } },
    { part: 'label', property: 'foreground', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary'), override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'checkbox/label/foreground/{state}' } },
    { part: 'label', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size), override: { id: 'label-style', label: 'Text style', group: 'Label', token: 'checkbox/label/text-style/{size}' } },
  ],
  docs: {
    summary: 'Lets people turn a single option on or off, or pick several options from a list.',
    baseUi: 'https://base-ui.com/react/components/checkbox',
    usage: [
      'Use for independent options, and for choosing several items from a list (with Checkbox Group).',
      'Use Indeterminate on a “select all” checkbox when only some of its items are selected.',
      'Match the size to the controls next to it: Small with Small buttons and inputs, and so on.',
    ],
    dont: ['Don’t use a checkbox for an action that takes effect immediately; use a Switch.', 'Don’t use it for mutually exclusive choices; use Radio Group.'],
    accessibility: [
      'The wrapping <label> names the checkbox; without a visible label, pass aria-label.',
      'Space toggles it. Base UI renders a hidden native input so forms and autofill work.',
      'Indeterminate is announced as “mixed”.',
    ],
  },
}
