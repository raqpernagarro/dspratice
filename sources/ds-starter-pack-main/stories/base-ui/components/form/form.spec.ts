import type { ComponentSpec } from '../../spec/types'

/** A form layout: fields (or fieldsets) stacked, then the actions. One size: its fields carry the size. */
export const formSpec: ComponentSpec = {
  name: 'Form',
  slug: 'form',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'Form', figma: '', description: 'Stacks fields and fieldsets; shows their errors on submit (Base UI validation).' },
    { id: 'fields', element: 'root', figma: 'Fields', description: 'Slot for fields and fieldsets.' },
    { id: 'field', figma: 'Fields › field', instanceOf: 'Field', description: 'Field instances.' },
    { id: 'actions', figma: 'Actions', description: 'The submit button and other actions, in a row.' },
    { id: 'button', figma: 'Actions › button', instanceOf: 'Button', description: 'Button instances.' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: [], figmaLayers: ['', 'Fields'], value: 'space/lg', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'form/gap' } },
    { part: 'actions', property: 'gap', by: [], value: 'space/sm', override: { id: 'actions-gap', label: 'Actions gap', group: 'Actions', token: 'form/actions/gap' } },
    { part: 'actions', property: 'padding-y', by: [], value: 'space/xs', override: { id: 'actions-space-y', label: 'Actions padding', group: 'Actions', token: 'form/actions/space-y' } },
  ],
  figmaProps: [
    { kind: 'slot', name: 'Fields', layer: 'Fields', preferred: ['Field', 'Fieldset'], code: 'children' },
    { kind: 'slot', name: 'Actions', layer: 'Actions', preferred: ['Button'], code: '<FormActions>' },
  ],
  docs: {
    summary: 'A form that validates its fields and shows their errors, laid out with consistent spacing.',
    baseUi: 'https://base-ui.com/react/components/form',
    usage: ['Use Form around Fields; pass errors from the server with the errors prop.', 'Put the primary action first in the actions row.'],
    dont: ['Don’t disable the submit button to show a form is incomplete; let validation explain what’s missing.'],
    accessibility: ['On a failed submit, focus moves to the first invalid field.'],
  },
}
