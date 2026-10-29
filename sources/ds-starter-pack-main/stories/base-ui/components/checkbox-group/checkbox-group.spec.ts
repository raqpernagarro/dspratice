import { bodyStyle, sizes, type ComponentSpec, type VariantValues } from '../../spec/types'

export type CheckboxGroupSize = 'sm' | 'md' | 'lg'
const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as CheckboxGroupSize]

export const checkboxGroupSpec: ComponentSpec = {
  name: 'Checkbox Group',
  slug: 'checkbox-group',
  axes: [sizes()],
  parts: [
    { id: 'root', baseUi: 'CheckboxGroup', figma: '', description: 'Stacks a label and its checkboxes.' },
    { id: 'label', figma: 'label', description: 'Names the group (aria-labelledby).' },
    { id: 'options', element: 'root', figma: 'Options', description: 'Slot for the options (in code, the children).' },
    { id: 'option', figma: 'Options › option', instanceOf: 'Checkbox', description: 'Checkbox instances of the same size; the first can be a “select all” parent.' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: ['size'], figmaLayers: ['', 'Options'], value: bySize('space/xs', 'space/xs', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'checkbox-group/gap/{size}' } },
    { part: 'label', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'checkbox-group/label/foreground' } },
    { part: 'label', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size, true), override: { id: 'label-style', label: 'Text style', group: 'Label', token: 'checkbox-group/label/text-style/{size}' } },
  ],
  figmaProps: [
    { kind: 'slot', name: 'Options', layer: 'Options', preferred: ['Checkbox'], code: 'children' },
  ],
  docs: {
    summary: 'A set of checkboxes sharing one value (an array), optionally with a “select all” parent.',
    baseUi: 'https://base-ui.com/react/components/checkbox-group',
    usage: ['Give the group a visible label.', 'Use a parent checkbox (indeterminate while partly selected) for “select all”.'],
    dont: ['Don’t use for a single choice; use a Radio Group.'],
    accessibility: ['Each checkbox stays its own tab stop; Space toggles it.'],
  },
}
