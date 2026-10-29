import { bodyStyle, labelledControlStates, sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type RadioSize = 'sm' | 'md' | 'lg'

/** Checked lives on Radio.Root (the control). */
const checked: Axis = {
  id: 'checked',
  figma: 'Checked',
  kind: 'state',
  on: 'control',
  values: [
    { code: 'false', figma: 'False', css: ['[data-unchecked]'] },
    { code: 'true', figma: 'True', css: ['[data-checked]'] },
  ],
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as RadioSize]

/** Same colors as Checkbox: a filled accent circle with an on-accent dot while checked. */
function control(role: 'bg' | 'border' | 'dot', v: VariantValues) {
  if (v.state === 'disabled') return role === 'bg' ? 'color/background/interactive/disabled' : role === 'border' ? 'color/border/interactive/disabled' : 'color/foreground/neutral/tertiary'
  if (role === 'dot') return 'color/foreground/on-accent/primary'
  if (v.checked === 'true') return `color/background/accent/${v.state}`
  return role === 'bg' ? 'color/background/neutral/primary' : `color/border/interactive/${v.state}`
}

export const radioSpec: ComponentSpec = {
  name: 'Radio',
  slug: 'radio',
  axes: [checked, sizes(), labelledControlStates('radio')],
  tokenKeys: { checked: (v) => (v.checked === 'true' ? 'checked' : 'unchecked') },
  parts: [
    { id: 'root', figma: '', description: 'The <label> wrapping the radio and its text.' },
    { id: 'control', baseUi: 'Radio.Root', figma: 'control', description: 'The circle.' },
    { id: 'indicator', baseUi: 'Radio.Indicator', parent: 'control', figma: 'control › indicator', description: 'The dot, only while checked.' },
    { id: 'label', figma: 'label', description: 'The option’s text.' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: ['size'], value: bySize('space/xs', 'space/sm', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'radio/gap/{size}' } },
    { part: 'control', property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm'), override: { id: 'control-size', label: 'Circle size', group: 'Circle', token: 'radio/control/size/{size}' } },
    { part: 'control', property: 'radius', by: [], value: 'shape/radius/full' },
    { part: 'control', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Circle', token: 'radio/control/border-width' } },
    { part: 'control', property: 'background', by: ['checked', 'state'], value: (v) => control('bg', v), override: { id: 'background', label: 'Background', group: 'Color', token: 'radio/control/background/{checked}/{state}' } },
    { part: 'control', property: 'border-color', by: ['checked', 'state'], value: (v) => control('border', v), override: { id: 'border-color', label: 'Border', group: 'Color', token: 'radio/control/border-color/{checked}/{state}' } },
    { part: 'indicator', property: 'size', by: [], value: 'space/sm', override: { id: 'dot-size', label: 'Dot size', group: 'Circle', token: 'radio/indicator/size' } },
    { part: 'indicator', property: 'radius', by: [], value: 'shape/radius/full' },
    { part: 'indicator', property: 'background', by: ['checked', 'state'], value: (v) => control('dot', v), override: { id: 'dot', label: 'Dot', group: 'Color', token: 'radio/indicator/background/{checked}/{state}' } },
    { part: 'label', property: 'foreground', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary'), override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'radio/label/foreground/{state}' } },
    { part: 'label', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size), override: { id: 'label-style', label: 'Text style', group: 'Label', token: 'radio/label/text-style/{size}' } },
  ],
  docs: {
    summary: 'One option in a Radio Group: pick exactly one of several.',
    baseUi: 'https://base-ui.com/react/components/radio',
    usage: ['Always use radios inside a Radio Group.', 'Use for 2–6 visible options; for more, use Select.'],
    dont: ['Don’t use a single radio on its own; use a Checkbox.'],
    accessibility: ['Arrow keys move between options in the group and select them.', 'The wrapping <label> names each option.'],
  },
}
