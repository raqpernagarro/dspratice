import { bodyStyle, sizes, type ComponentSpec, type VariantValues } from '../../spec/types'

export type RadioGroupSize = 'sm' | 'md' | 'lg'
const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as RadioGroupSize]

export const radioGroupSpec: ComponentSpec = {
  name: 'Radio Group',
  slug: 'radio-group',
  axes: [sizes()],
  parts: [
    { id: 'root', baseUi: 'RadioGroup', figma: '', description: 'Stacks a label and its options.' },
    { id: 'label', figma: 'label', description: 'Names the group (aria-labelledby).' },
    { id: 'options', element: 'root', figma: 'Options', description: 'Slot for the options (in code, the children).' },
    { id: 'option', figma: 'Options › option', instanceOf: 'Radio', description: 'Radio instances of the same size.' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: ['size'], figmaLayers: ['', 'Options'], value: bySize('space/xs', 'space/xs', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'radio-group/gap/{size}' } },
    { part: 'label', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'radio-group/label/foreground' } },
    { part: 'label', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size, true), override: { id: 'label-style', label: 'Text style', group: 'Label', token: 'radio-group/label/text-style/{size}' } },
  ],
  figmaProps: [
    { kind: 'slot', name: 'Options', layer: 'Options', preferred: ['Radio'], code: 'children' },
  ],
  docs: {
    summary: 'A set of radios where exactly one can be selected.',
    baseUi: 'https://base-ui.com/react/components/radio-group',
    usage: ['Give the group a visible label.', 'Order options logically (most common first, or a natural order).', 'Preselect a sensible default when there is one.'],
    dont: ['Don’t use radios for on / off; use a Switch or Checkbox.'],
    accessibility: ['Tab moves into the group to the selected option; arrows move between options.'],
  },
}
