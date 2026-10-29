import { bodyStyle, sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'
import { bySize, fieldBorder, fieldText } from '../input/input.spec'

export type ComboboxSize = 'sm' | 'md' | 'lg'

/*
 * A field box (same metrics and colors as Input) holding the text input, a clear button (while
 * there's a value) and the trigger. The popup is a Listbox.
 */
const VALUE = '.ds-combobox__value'

const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [`:hover:not(:has(> ${VALUE}[data-disabled])):not(:focus-within)`, '[data-preview-state="hover"]'] },
    { code: 'focused', figma: 'Focused', css: [':focus-within', '[data-preview-state="focused"]'] },
    { code: 'disabled', figma: 'Disabled', css: [`:has(> ${VALUE}[data-disabled])`] },
  ],
}

const filled: Axis = {
  id: 'filled',
  figma: 'Filled',
  kind: 'state',
  on: 'value',
  values: [
    { code: 'false', figma: 'False', css: [':placeholder-shown'] },
    { code: 'true', figma: 'True', css: [':not(:placeholder-shown)'] },
  ],
}

const invalid: Axis = {
  id: 'invalid',
  figma: 'Invalid',
  kind: 'state',
  on: 'value',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-invalid])'] },
    { code: 'true', figma: 'True', css: ['[data-invalid]'] },
  ],
}

const iconColor = (v: VariantValues) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/secondary')

export const comboboxSpec: ComponentSpec = {
  name: 'Combobox',
  slug: 'combobox',
  axes: [sizes(), state, filled, invalid],
  exists: (v) => !(v.state === 'disabled' && v.invalid === 'true'),
  tokenKeys: {
    invalid: (v) => (v.invalid === 'true' ? 'invalid' : 'valid'),
    filled: (v) => (v.filled === 'true' ? 'filled' : 'placeholder'),
  },
  parts: [
    { id: 'root', baseUi: 'Combobox.InputGroup', figma: '', description: 'The field’s box: surface, border, padding and focus ring.' },
    { id: 'value', baseUi: 'Combobox.Input', figma: 'value', description: 'The text the user types to filter; the selected label once chosen.' },
    { id: 'clear', baseUi: 'Combobox.Clear', figma: 'clear', description: 'Clears the value. Only there while there is one.' },
    { id: 'trigger', baseUi: 'Combobox.Trigger', figma: 'trigger', description: 'Opens the list without typing.' },
  ],
  bindings: [
    { part: 'root', property: 'height', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'height', label: 'Height', group: 'Container', token: 'combobox/height/{size}' } },
    { part: 'root', property: 'padding-x', by: ['size'], value: bySize('space/sm', 'space/md', 'space/lg'), override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'combobox/space-x/{size}' } },
    { part: 'root', property: 'gap', by: ['size'], value: bySize('space/xs', 'space/sm', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'combobox/gap/{size}' } },
    { part: 'root', property: 'radius', by: ['size'], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'combobox/radius/{size}' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'combobox/border-width' } },
    { part: 'root', property: 'background', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/background/interactive/disabled' : 'color/background/neutral/primary'), override: { id: 'background', label: 'Background', group: 'Color', token: 'combobox/background/{state}' } },
    { part: 'root', property: 'border-color', by: ['invalid', 'state'], value: fieldBorder, override: { id: 'border-color', label: 'Border', group: 'Color', token: 'combobox/border-color/{invalid}/{state}' } },
    { part: 'root', property: 'shadow', by: ['invalid', 'state'], value: (v) => (v.state !== 'focused' ? 'none' : v.invalid === 'true' ? 'effect/shadow/focus-ring/error' : 'effect/shadow/focus-ring/primary') },
    { part: 'value', property: 'foreground', by: ['filled', 'state'], value: fieldText, override: { id: 'foreground', label: 'Text', group: 'Color', token: 'combobox/foreground/{filled}/{state}' } },
    { part: 'value', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size), override: { id: 'text-style', label: 'Text style', group: 'Text', token: 'combobox/text/text-style/{size}' } },
    { part: 'clear', property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm'), override: { id: 'clear-size', label: 'Clear size', group: 'Icon', token: 'combobox/clear/size/{size}' } },
    { part: 'clear', property: 'foreground', by: ['state'], value: iconColor, figmaLayers: ['clear › Vector'], override: { id: 'clear-foreground', label: 'Clear', group: 'Color', token: 'combobox/clear/foreground/{state}' } },
    { part: 'trigger', property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm'), override: { id: 'trigger-size', label: 'Trigger size', group: 'Icon', token: 'combobox/trigger/size/{size}' } },
    { part: 'trigger', property: 'foreground', by: ['state'], value: iconColor, figmaLayers: ['trigger › Vector'], override: { id: 'trigger-foreground', label: 'Trigger', group: 'Color', token: 'combobox/trigger/foreground/{state}' } },
  ],
  docs: {
    summary: 'A text field that filters a list as the user types, then picks one of its options.',
    baseUi: 'https://base-ui.com/react/components/combobox',
    usage: [
      'Use it for long lists (countries, people, tags) where typing is faster than scrolling.',
      'Only values from the list are accepted; for free text with suggestions, use Autocomplete.',
      'Wrap it in Field; sizes match Input and Button.',
    ],
    dont: ['Don’t use it for a handful of options; use Select or Radio Group.'],
    accessibility: [
      'Typing filters; arrow keys move through the matches; Enter picks; Escape closes, then clears.',
      'The input keeps focus and points at the highlighted option (aria-activedescendant).',
      'The clear and trigger buttons need aria-labels (“Clear selection”, “Open list”).',
    ],
  },
}
