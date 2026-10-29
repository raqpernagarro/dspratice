import type { ComponentSpec } from '../../spec/types'

/** The bar: Menubar Items on a light strip. One size. */
export const menubarSpec: ComponentSpec = {
  name: 'Menubar',
  slug: 'menubar',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'Menubar', figma: '', description: 'The bar holding the menus’ triggers.' },
    { id: 'items', figma: 'Items', element: 'root', description: 'Slot for the Menubar Items (in code, the bar’s children).' },
    { id: 'item', figma: 'Items › item', instanceOf: 'Menubar Item', description: 'Menubar Item instances; each opens a Menu.' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/2xs', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'menubar/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/2xs', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'menubar/space-y' } },
    { part: 'root', property: 'gap', by: [], figmaLayers: ['Items'], value: 'space/2xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'menubar/gap' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'menubar/radius' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'menubar/border-width' } },
    { part: 'root', property: 'background', by: [], value: 'color/background/neutral/secondary', override: { id: 'background', label: 'Background', group: 'Color', token: 'menubar/background' } },
    { part: 'root', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'menubar/border-color' } },
  ],
  figmaProps: [{ kind: 'slot', name: 'Items', layer: 'Items', preferred: ['Menubar Item'], code: 'children' }],
  docs: {
    summary: 'A row of menus, like a desktop app’s File / Edit / View bar.',
    baseUi: 'https://base-ui.com/react/components/menubar',
    usage: [
      'Use it in tool-like apps (editors) with many commands grouped by topic.',
      'The menus are ordinary Menus: items, checkbox and radio items, submenus.',
    ],
    dont: ['Don’t use it for site navigation; use Navigation Menu.'],
    accessibility: [
      'Renders role="menubar": one tab stop; arrow keys move between items.',
      'Once a menu is open, moving to the next item opens its menu.',
    ],
  },
}
