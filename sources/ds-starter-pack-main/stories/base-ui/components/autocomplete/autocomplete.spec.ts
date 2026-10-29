import type { ComponentSpec } from '../../spec/types'

/**
 * A composition: an Input whose suggestions open in a Listbox. It has no tokens of its own; the
 * Input, Listbox and Option tokens style it. The Figma component shows it open.
 */
export const autocompleteSpec: ComponentSpec = {
  name: 'Autocomplete',
  slug: 'autocomplete',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'Autocomplete.Root', figma: '', description: 'Input and list (in code the list is portalled, offset by the positioner).' },
    { id: 'input', baseUi: 'Autocomplete.Input', figma: 'input', instanceOf: 'Input', description: 'An Input: Autocomplete.Input renders the Input’s value element.' },
    { id: 'listbox', baseUi: 'Autocomplete.Popup', figma: 'listbox', instanceOf: 'Listbox', description: 'The suggestions: a Listbox of Options without indicators.' },
  ],
  bindings: [{ part: 'root', property: 'gap', by: [], value: 'space/xs', on: 'figma' }],
  figmaProps: [
    { kind: 'expose', name: 'Input', layer: 'input' },
    { kind: 'expose', name: 'Listbox', layer: 'listbox' },
  ],
  docs: {
    summary: 'A text input with suggestions. The user can pick one or keep typing their own text.',
    baseUi: 'https://base-ui.com/react/components/autocomplete',
    usage: [
      'Use it for search boxes and free-text fields with common values (tags, cities).',
      'When only listed values are valid, use Combobox instead.',
      'Wrap it in Field for a label; it takes the Field’s size like Input.',
    ],
    dont: ['Don’t show a check on suggestions: nothing stays selected, the text is the value.'],
    accessibility: [
      'Arrow keys move through the suggestions; Enter fills the input; Escape closes the list.',
      'The input keeps focus and points at the highlighted suggestion (aria-activedescendant).',
    ],
  },
}
