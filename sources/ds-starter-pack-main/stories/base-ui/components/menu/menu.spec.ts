import type { ComponentSpec } from '../../spec/types'

/** The popup. One size (overlays aren't sized), so it is a single component, not a set. */
export const menuSpec: ComponentSpec = {
  name: 'Menu',
  slug: 'menu',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'Menu.Popup', figma: '', description: 'The surface: background, border, radius and elevation. Opens from a Button (Menu.Trigger).' },
    { id: 'items', figma: 'Items', element: 'root', description: 'Slot for the menu’s content: Menu Items, Menu Group Labels and Menu Separators (in code, the popup’s children).' },
    { id: 'item', figma: 'Items › item', instanceOf: 'Menu Item', description: 'Menu Item instances.' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/xs', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'menu/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/xs', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'menu/space-y' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/lg', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'menu/radius' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'menu/border-width' } },
    { part: 'root', property: 'background', by: [], value: 'color/background/surface/medium', override: { id: 'background', label: 'Background', group: 'Color', token: 'menu/background' } },
    { part: 'root', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'menu/border-color' } },
    { part: 'root', property: 'shadow', by: [], value: 'effect/shadow/elevation/medium' },
  ],
  figmaProps: [{ kind: 'slot', name: 'Items', layer: 'Items', preferred: ['Menu Item', 'Menu Group Label', 'Menu Separator'], code: 'children' }],
  docs: {
    summary: 'A list of actions or options that opens from a button. Built from Menu Items, Menu Group Labels and Menu Separators.',
    baseUi: 'https://base-ui.com/react/components/menu',
    usage: [
      'Open it from a Button (Menu.Trigger renders one, with a caret).',
      'Group related items under a group label; separate groups with a separator.',
      'Keep labels short and start them with a verb.',
    ],
    dont: ['Don’t use a menu for navigation between pages; use Navigation Menu.', 'Don’t use it to pick a form value; use Select.'],
    accessibility: [
      'The trigger opens it with Enter, Space or Arrow Down; Escape closes it and returns focus to the trigger.',
      'Focus is trapped while open; the popup is announced as a menu.',
    ],
  },
}
