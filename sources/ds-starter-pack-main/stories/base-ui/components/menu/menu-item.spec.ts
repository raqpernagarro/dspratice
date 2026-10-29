import { bodyStyle, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type MenuItemType = 'default' | 'checkbox' | 'radio' | 'submenu'

const type: Axis = {
  id: 'type',
  figma: 'Type',
  kind: 'prop',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'checkbox', figma: 'Checkbox' },
    { code: 'radio', figma: 'Radio' },
    { code: 'submenu', figma: 'Submenu' },
  ],
}

/** Base UI sets data-highlighted (pointer or keyboard), data-popup-open (open submenu), data-disabled. */
const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'highlighted', figma: 'Highlighted', css: ['[data-highlighted]', '[data-popup-open]'] },
    { code: 'disabled', figma: 'Disabled', css: ['[data-disabled]'] },
  ],
}

const checked: Axis = {
  id: 'checked',
  figma: 'Checked',
  kind: 'state',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-checked])'] },
    { code: 'true', figma: 'True', css: ['[data-checked]'] },
  ],
}

const text = (v: VariantValues) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary')

export const menuItemSpec: ComponentSpec = {
  name: 'Menu Item',
  slug: 'menu-item',
  dir: 'menu',
  axes: [type, state, checked],
  // Checked only exists for checkbox and radio items.
  exists: (v) => v.checked === 'false' || v.type === 'checkbox' || v.type === 'radio',
  tokenKeys: { checked: (v) => (v.checked === 'true' ? 'checked' : 'unchecked') },
  parts: [
    { id: 'root', baseUi: 'Menu.Item', figma: '', description: 'One row. Menu.CheckboxItem, Menu.RadioItem and Menu.SubmenuTrigger share its look.' },
    { id: 'indicator', figma: 'indicator', description: 'Checkbox and radio items: a fixed slot, so labels line up whether checked or not.' },
    { id: 'icon', baseUi: 'Menu.CheckboxItemIndicator / Menu.RadioItemIndicator', parent: 'indicator', figma: 'indicator › icon', description: 'Check (checkbox) or dot (radio), only while checked.' },
    { id: 'label', figma: 'label', description: 'The item’s text.' },
    { id: 'caret', figma: 'caret', description: 'Submenu triggers: points to the submenu.' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'menu-item/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/sm', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'menu-item/space-y' } },
    { part: 'root', property: 'gap', by: [], value: 'space/sm', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'menu-item/gap' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/sm', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'menu-item/radius' } },
    { part: 'root', property: 'background', by: ['state'], value: (v) => (v.state === 'highlighted' ? 'color/background/interactive/subtle/hover' : 'color/background/interactive/subtle/default'), override: { id: 'background', label: 'Background', group: 'Color', token: 'menu-item/background/{state}' } },
    { part: 'indicator', property: 'size', by: [], value: 'size/xs', override: { id: 'indicator-size', label: 'Indicator size', group: 'Icon', token: 'menu-item/indicator/size' } },
    { part: 'icon', property: 'size', by: ['type'], value: (v) => (v.type === 'radio' ? 'space/sm' : 'size/xs') },
    { part: 'icon', property: 'foreground', by: ['state'], value: text, figmaLayers: ['indicator › icon › Vector'], override: { id: 'indicator-foreground', label: 'Check', group: 'Color', token: 'menu-item/indicator/foreground/{state}' } },
    { part: 'label', property: 'foreground', by: ['state'], value: text, override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'menu-item/label/foreground/{state}' } },
    { part: 'label', property: 'text-style', by: [], value: bodyStyle('md'), override: { id: 'label-style', label: 'Text style', group: 'Label', token: 'menu-item/label/text-style' } },
    { part: 'caret', property: 'size', by: [], value: 'size/xs', override: { id: 'caret-size', label: 'Caret size', group: 'Icon', token: 'menu-item/caret/size' } },
    { part: 'caret', property: 'foreground', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/secondary'), figmaLayers: ['caret › Vector'], override: { id: 'caret-foreground', label: 'Caret', group: 'Color', token: 'menu-item/caret/foreground/{state}' } },
  ],
  docs: {
    summary: 'A row in a Menu: an action, a checkbox or radio option, or the trigger of a submenu.',
    baseUi: 'https://base-ui.com/react/components/menu',
    usage: [
      'Use Checkbox items for independent toggles, Radio items (in a Menu.RadioGroup) for one choice of several.',
      'Use a Submenu item to group related actions; keep nesting to one level.',
    ],
    dont: ['Don’t mix checkbox / radio items with plain actions without a separator or group label between them.'],
    accessibility: [
      'Arrow keys move the highlight; Enter or Space activates; typing jumps to the matching label.',
      'Checkbox and radio items announce their checked state (menuitemcheckbox / menuitemradio).',
    ],
  },
}
