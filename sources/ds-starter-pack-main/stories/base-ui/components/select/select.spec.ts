import { bodyStyle, sizes, type Axis, type ComponentSpec } from '../../spec/types'
import { bySize, fieldBorder, fieldText } from '../input/input.spec'

export type SelectSize = 'sm' | 'md' | 'lg'

/*
 * The trigger: a field box (same metrics and colors as Input) showing the value and a caret. The
 * popup is a Listbox. Base UI sets data-popup-open / data-disabled / data-invalid on the trigger and
 * data-placeholder on the value while nothing is selected.
 */
const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [':hover:not([data-disabled]):not([data-popup-open]):not(:focus-visible)', '[data-preview-state="hover"]'] },
    { code: 'focused', figma: 'Focused', css: [':focus-visible', '[data-popup-open]', '[data-preview-state="focused"]'] },
    { code: 'disabled', figma: 'Disabled', css: ['[data-disabled]'] },
  ],
}

const filled: Axis = {
  id: 'filled',
  figma: 'Filled',
  kind: 'state',
  on: 'value',
  values: [
    { code: 'false', figma: 'False', css: ['[data-placeholder]'] },
    { code: 'true', figma: 'True', css: [':not([data-placeholder])'] },
  ],
}

const invalid: Axis = {
  id: 'invalid',
  figma: 'Invalid',
  kind: 'state',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-invalid])'] },
    { code: 'true', figma: 'True', css: ['[data-invalid]'] },
  ],
}

export const selectSpec: ComponentSpec = {
  name: 'Select',
  slug: 'select',
  axes: [sizes(), state, filled, invalid],
  exists: (v) => !(v.state === 'disabled' && v.invalid === 'true'),
  tokenKeys: {
    invalid: (v) => (v.invalid === 'true' ? 'invalid' : 'valid'),
    filled: (v) => (v.filled === 'true' ? 'filled' : 'placeholder'),
  },
  parts: [
    { id: 'root', baseUi: 'Select.Trigger', figma: '', description: 'The field’s box. Opens the Listbox; focus ring while focused or open.' },
    { id: 'value', baseUi: 'Select.Value', figma: 'value', description: 'The selected option’s label, or the placeholder.' },
    { id: 'icon', baseUi: 'Select.Icon', figma: 'icon', description: 'The caret (up/down: the list can open over the trigger).' },
  ],
  bindings: [
    { part: 'root', property: 'height', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'height', label: 'Height', group: 'Container', token: 'select/height/{size}' } },
    { part: 'root', property: 'padding-x', by: ['size'], value: bySize('space/sm', 'space/md', 'space/lg'), override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'select/space-x/{size}' } },
    { part: 'root', property: 'gap', by: ['size'], value: bySize('space/xs', 'space/sm', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'select/gap/{size}' } },
    { part: 'root', property: 'radius', by: ['size'], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'select/radius/{size}' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'select/border-width' } },
    { part: 'root', property: 'background', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/background/interactive/disabled' : 'color/background/neutral/primary'), override: { id: 'background', label: 'Background', group: 'Color', token: 'select/background/{state}' } },
    { part: 'root', property: 'border-color', by: ['invalid', 'state'], value: fieldBorder, override: { id: 'border-color', label: 'Border', group: 'Color', token: 'select/border-color/{invalid}/{state}' } },
    { part: 'root', property: 'shadow', by: ['invalid', 'state'], value: (v) => (v.state !== 'focused' ? 'none' : v.invalid === 'true' ? 'effect/shadow/focus-ring/error' : 'effect/shadow/focus-ring/primary') },
    { part: 'value', property: 'foreground', by: ['filled', 'state'], value: fieldText, override: { id: 'foreground', label: 'Text', group: 'Color', token: 'select/foreground/{filled}/{state}' } },
    { part: 'value', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size), override: { id: 'text-style', label: 'Text style', group: 'Text', token: 'select/text/text-style/{size}' } },
    { part: 'icon', property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm'), override: { id: 'icon-size', label: 'Icon size', group: 'Icon', token: 'select/icon/size/{size}' } },
    { part: 'icon', property: 'foreground', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/secondary'), figmaLayers: ['icon › Vector'], override: { id: 'icon-foreground', label: 'Icon', group: 'Color', token: 'select/icon/foreground/{state}' } },
  ],
  docs: {
    summary: 'Picks one value from a list. A field box (like Input) that opens a Listbox of Options.',
    baseUi: 'https://base-ui.com/react/components/select',
    usage: [
      'Use it for 5–15 options the user doesn’t need to type; for fewer, a Radio Group shows them all; for more, a Combobox lets them search.',
      'Wrap it in Field for a label, description and error; sizes match Input and Button.',
      'Use a placeholder that says what to pick (“Select a country”).',
    ],
    dont: ['Don’t use it for actions; use Menu.', 'Don’t use it when users need to compare options; use Radio Group.'],
    accessibility: [
      'The trigger opens the list with Enter, Space or the arrow keys; typing jumps to a matching option.',
      'The list opens aligned with the selected option over the trigger (macOS-style) unless turned off.',
      'Inside Field, the label and error are linked to the trigger.',
    ],
  },
}
