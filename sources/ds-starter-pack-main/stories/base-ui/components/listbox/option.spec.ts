import { bodyStyle, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

/*
 * One row in a Select, Combobox or Autocomplete list. Base UI sets data-highlighted (pointer or
 * keyboard), data-selected and data-disabled on Select.Item / Combobox.Item / Autocomplete.Item.
 * Same metrics as Menu Item, so menus and lists line up.
 */
const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'highlighted', figma: 'Highlighted', css: ['[data-highlighted]'] },
    { code: 'disabled', figma: 'Disabled', css: ['[data-disabled]'] },
  ],
}

const selected: Axis = {
  id: 'selected',
  figma: 'Selected',
  kind: 'state',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-selected])'] },
    { code: 'true', figma: 'True', css: ['[data-selected]'] },
  ],
}

const text = (v: VariantValues) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary')

export const optionSpec: ComponentSpec = {
  name: 'Option',
  slug: 'option',
  dir: 'listbox',
  axes: [state, selected],
  tokenKeys: { selected: (v) => (v.selected === 'true' ? 'selected' : 'unselected') },
  parts: [
    { id: 'root', baseUi: 'Select.Item / Combobox.Item / Autocomplete.Item', figma: '', description: 'One row of a Listbox.' },
    { id: 'indicator', figma: 'indicator', description: 'A fixed slot for the check, so labels line up (Show indicator; off in Autocomplete).' },
    { id: 'icon', baseUi: 'Select.ItemIndicator / Combobox.ItemIndicator', parent: 'indicator', figma: 'indicator › icon', description: 'The check, only on the selected option.' },
    { id: 'label', baseUi: 'Select.ItemText', figma: 'label', description: 'The option’s text.' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'option/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/sm', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'option/space-y' } },
    { part: 'root', property: 'gap', by: [], value: 'space/sm', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'option/gap' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/sm', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'option/radius' } },
    { part: 'root', property: 'background', by: ['state'], value: (v) => (v.state === 'highlighted' ? 'color/background/interactive/subtle/hover' : 'color/background/interactive/subtle/default'), override: { id: 'background', label: 'Background', group: 'Color', token: 'option/background/{state}' } },
    { part: 'indicator', property: 'size', by: [], value: 'size/xs', override: { id: 'indicator-size', label: 'Indicator size', group: 'Icon', token: 'option/indicator/size' } },
    { part: 'icon', property: 'size', by: [], value: 'size/xs' },
    { part: 'icon', property: 'foreground', by: ['state'], value: text, figmaLayers: ['indicator › icon › Vector'], override: { id: 'indicator-foreground', label: 'Check', group: 'Color', token: 'option/indicator/foreground/{state}' } },
    { part: 'label', property: 'foreground', by: ['state'], value: text, override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'option/label/foreground/{state}' } },
    { part: 'label', property: 'text-style', by: [], value: bodyStyle('md'), override: { id: 'label-style', label: 'Text style', group: 'Label', token: 'option/label/text-style' } },
  ],
  docs: {
    summary: 'A row in a Listbox: the options of a Select, Combobox or Autocomplete.',
    baseUi: 'https://base-ui.com/react/components/select',
    usage: [
      'Keep labels short and distinct; they are what typeahead matches.',
      'Hide the indicator where nothing stays selected (Autocomplete only fills the input).',
    ],
    dont: ['Don’t put interactive content (buttons, links) in an option.'],
    accessibility: [
      'Arrow keys move the highlight; Enter selects; typing jumps to a matching label.',
      'Selected options are announced (aria-selected); disabled ones are skipped by the highlight.',
    ],
  },
}
