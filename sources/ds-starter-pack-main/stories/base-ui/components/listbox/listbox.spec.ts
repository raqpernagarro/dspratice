import type { ComponentSpec } from '../../spec/types'
import { surface } from '../shared/popup'

/** The popup of Select, Combobox and Autocomplete: a surface holding Options. One size. */
export const listboxSpec: ComponentSpec = {
  name: 'Listbox',
  slug: 'listbox',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'Select.Popup / Combobox.Popup / Autocomplete.Popup', figma: '', description: 'The surface. At least as wide as its trigger or input.' },
    { id: 'items', figma: 'Items', element: 'root', description: 'Slot for the Options (in code, the List’s children).' },
    { id: 'option', figma: 'Items › option', instanceOf: 'Option', description: 'Option instances.' },
    { id: 'empty', baseUi: 'Combobox.Empty / Autocomplete.Empty', figma: 'empty', description: 'Shown instead of the options when a search matches nothing (hidden in Figma; turn it on).' },
    { id: 'empty-text', figma: 'empty › text', element: 'empty', description: 'The empty state’s text.' },
  ],
  bindings: [
    ...surface('listbox', { spaceX: 'space/xs', spaceY: 'space/xs' }),
    { part: 'empty', property: 'padding-x', by: [], value: 'space/md', override: { id: 'empty-space-x', label: 'Empty padding X', group: 'Empty', token: 'listbox/empty/space-x' } },
    { part: 'empty', property: 'padding-y', by: [], value: 'space/sm', override: { id: 'empty-space-y', label: 'Empty padding Y', group: 'Empty', token: 'listbox/empty/space-y' } },
    { part: 'empty-text', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'empty-foreground', label: 'Empty text', group: 'Color', token: 'listbox/empty/foreground' } },
    { part: 'empty-text', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'empty-style', label: 'Empty text style', group: 'Empty', token: 'listbox/empty/text-style' } },
  ],
  figmaProps: [
    { kind: 'slot', name: 'Items', layer: 'Items', preferred: ['Option'], code: '<Select.Item>… / <Combobox.Item>…' },
    { kind: 'boolean', name: 'Show empty', layers: ['empty'], default: false, code: '<Combobox.Empty>' },
    { kind: 'text', name: 'Empty text', layers: ['empty › text'], default: 'No results.' },
  ],
  docs: {
    summary: 'The list that opens from a Select, Combobox or Autocomplete: a surface of Options.',
    baseUi: 'https://base-ui.com/react/components/select',
    usage: [
      'It takes at least its trigger’s width; long lists scroll inside it.',
      'Group long lists with group labels, like Menu.',
      'Say why a search matched nothing in the empty state (“No fruits found”).',
    ],
    dont: ['Don’t use it for actions; use Menu.'],
    accessibility: ['Renders role="listbox"; the input or trigger keeps focus and points at the highlighted option (aria-activedescendant).'],
  },
}
