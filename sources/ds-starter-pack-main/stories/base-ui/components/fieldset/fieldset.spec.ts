import { sizes, type ComponentSpec, type VariantValues } from '../../spec/types'

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as 'sm' | 'md' | 'lg']

export const fieldsetSpec: ComponentSpec = {
  name: 'Fieldset',
  slug: 'fieldset',
  axes: [sizes()],
  parts: [
    { id: 'root', baseUi: 'Fieldset.Root', figma: '', description: 'Groups related fields under one legend. Disabling it disables every field inside.' },
    { id: 'legend', baseUi: 'Fieldset.Legend', figma: 'legend', description: 'Names the group, one step larger than the field labels.' },
    { id: 'fields', element: 'root', figma: 'Fields', description: 'Slot for the fields (in code, the children).' },
    { id: 'field', figma: 'Fields › field', instanceOf: 'Field', description: 'Field instances of the same size.' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: ['size'], figmaLayers: ['', 'Fields'], value: bySize('space/sm', 'space/md', 'space/lg'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'fieldset/gap/{size}' } },
    { part: 'legend', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'legend-foreground', label: 'Legend', group: 'Color', token: 'fieldset/legend/foreground' } },
    { part: 'legend', property: 'text-style', by: ['size'], value: bySize('Body/MD Strong', 'Body/LG Strong', 'Heading/SM'), override: { id: 'legend-style', label: 'Text style', group: 'Legend', token: 'fieldset/legend/text-style/{size}' } },
  ],
  figmaProps: [
    { kind: 'slot', name: 'Fields', layer: 'Fields', preferred: ['Field', 'Radio Group', 'Checkbox Group'], code: 'children' },
    { kind: 'text', name: 'Legend', layers: ['legend'], default: 'Billing details', code: 'legend' },
  ],
  docs: {
    summary: 'A group of related fields with a legend, e.g. “Billing details”.',
    baseUi: 'https://base-ui.com/react/components/fieldset',
    usage: ['Use to split a long form into named sections.', 'The size applies to the legend and to the fields inside.'],
    dont: ['Don’t nest fieldsets more than one level.'],
    accessibility: ['Renders a <fieldset> with a <legend>, announced with each field inside.'],
  },
}
