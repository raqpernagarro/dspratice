import { bodyStyle, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

/** A Menu.Trigger inside a Menubar. Base UI sets data-popup-open while its menu is open. */
const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [':hover:not([data-disabled]):not([data-popup-open])', '[data-preview-state="hover"]'] },
    { code: 'open', figma: 'Open', css: ['[data-popup-open]'] },
    { code: 'disabled', figma: 'Disabled', css: ['[data-disabled]'] },
  ],
}

const background = (v: VariantValues) =>
  v.state === 'hover' ? 'color/background/interactive/subtle/hover' : v.state === 'open' ? 'color/background/interactive/subtle/selected' : 'color/background/interactive/subtle/default'

export const menubarItemSpec: ComponentSpec = {
  name: 'Menubar Item',
  slug: 'menubar-item',
  dir: 'menubar',
  axes: [state],
  parts: [
    { id: 'root', baseUi: 'Menu.Trigger', figma: '', description: 'Opens its Menu. Arrow keys move along the bar; once a menu is open, hovering the next item opens its menu.' },
    { id: 'label', figma: 'label', element: 'root', description: 'The text (the trigger’s own text in code).' },
  ],
  bindings: [
    { part: 'root', property: 'height', by: [], value: 'size/md', override: { id: 'height', label: 'Height', group: 'Container', token: 'menubar-item/height' } },
    { part: 'root', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'menubar-item/space-x' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/sm', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'menubar-item/radius' } },
    { part: 'root', property: 'background', by: ['state'], value: background, override: { id: 'background', label: 'Background', group: 'Color', token: 'menubar-item/background/{state}' } },
    { part: 'label', property: 'foreground', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary'), override: { id: 'foreground', label: 'Label', group: 'Color', token: 'menubar-item/foreground/{state}' } },
    { part: 'label', property: 'text-style', by: [], value: bodyStyle('md'), override: { id: 'text-style', label: 'Text style', group: 'Label', token: 'menubar-item/text-style' } },
  ],
  docs: {
    summary: 'One entry of a Menubar: a trigger that opens a Menu.',
    baseUi: 'https://base-ui.com/react/components/menubar',
    usage: ['Label it with a noun for what its menu holds (File, Edit, View).'],
    dont: ['Don’t make an item act on its own; every item opens a menu.'],
    accessibility: ['Left/Right move between items; Down or Enter opens the menu.'],
  },
}
