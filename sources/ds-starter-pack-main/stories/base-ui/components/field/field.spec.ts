import { bodyStyle, flag, sizes, type ComponentSpec, type VariantValues } from '../../spec/types'

export type FieldSize = 'sm' | 'md' | 'lg'

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as FieldSize]
const text = (part: string, group: string, strong: boolean) => [
  { part, property: 'text-style' as const, by: ['size'], value: (v: VariantValues) => bodyStyle(v.size, strong), override: { id: `${part}-style`, label: 'Text style', group, token: `field/${part}/text-style/{size}` } },
]

export const fieldSpec: ComponentSpec = {
  name: 'Field',
  slug: 'field',
  axes: [sizes(), { ...flag('invalid', 'Invalid'), kind: 'state', values: [{ code: 'false', figma: 'False', css: [':not([data-invalid])'] }, { code: 'true', figma: 'True', css: ['[data-invalid]'] }] }],
  parts: [
    { id: 'root', baseUi: 'Field.Root', figma: '', description: 'Stacks the label, control and messages.' },
    { id: 'label', baseUi: 'Field.Label', figma: 'label', description: 'Names the control.' },
    { id: 'control', baseUi: 'Field.Control', figma: 'Control', description: 'An Input (or another control) of the same size. Its look comes from Input.' },
    { id: 'description', baseUi: 'Field.Description', figma: 'description', description: 'Optional help text (Show description). Hidden while the field is invalid.' },
    { id: 'error', baseUi: 'Field.Error', figma: 'error', description: 'Validation message: replaces the description while the field is invalid.' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: ['size'], value: bySize('space/xs', 'space/xs', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'field/gap/{size}' } },
    { part: 'label', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'field/label/foreground' } },
    ...text('label', 'Label', true),
    { part: 'description', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'description-foreground', label: 'Description', group: 'Color', token: 'field/description/foreground' } },
    ...text('description', 'Description', false),
    { part: 'error', property: 'foreground', by: [], value: 'color/foreground/error', override: { id: 'error-foreground', label: 'Error', group: 'Color', token: 'field/error/foreground' } },
    ...text('error', 'Error', false),
  ],
  figmaProps: [
    { kind: 'slot', name: 'Control', layer: 'Control', preferred: ['Input', 'Select', 'Combobox', 'Autocomplete', 'Number Field', 'OTP Field', 'Slider', 'Switch', 'Checkbox'], code: 'children' },
  ],
  docs: {
    summary: 'Labels a control and shows its help text and validation message. Wraps Input, and other Base UI controls.',
    baseUi: 'https://base-ui.com/react/components/field',
    usage: [
      'Give every input a Field with a visible label.',
      'Use the description for format hints (“At least 8 characters”), the error for what went wrong and how to fix it. While invalid, the error replaces the description, so the field keeps its height.',
      'The size applies to the label, the messages and the control inside.',
    ],
    dont: ['Don’t repeat the label in the placeholder.', 'Don’t show an error before the person has had a chance to fill the field in.'],
    accessibility: [
      'Field.Label, Field.Description and Field.Error are linked to the control (aria-labelledby / aria-describedby).',
      'Errors come from the browser’s constraint validation or the validate prop; invalid sets aria-invalid on the control.',
    ],
  },
}
