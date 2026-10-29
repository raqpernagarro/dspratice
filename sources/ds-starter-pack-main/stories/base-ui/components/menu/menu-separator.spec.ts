import type { ComponentSpec } from '../../spec/types'

/** Divides groups of Menu Items. A building block for the Menu's Items slot. */
export const menuSeparatorSpec: ComponentSpec = {
  name: 'Menu Separator',
  slug: 'menu-separator',
  dir: 'menu',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'Menu.Separator', figma: '', description: 'Its padding keeps the line inset from the popup’s edges.' },
    { id: 'line', figma: 'line', element: 'root', description: 'The line itself (the content box in code).' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Inset', group: 'Container', token: 'menu-separator/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/xs', override: { id: 'space-y', label: 'Spacing', group: 'Container', token: 'menu-separator/space-y' } },
    { part: 'line', property: 'height', by: [], value: 'size/border/regular', override: { id: 'width', label: 'Line width', group: 'Line', token: 'menu-separator/width' } },
    { part: 'line', property: 'background', by: [], value: 'color/border/neutral/subtle', override: { id: 'color', label: 'Line', group: 'Color', token: 'menu-separator/color' } },
  ],
  docs: {
    summary: 'A line between groups of items in a Menu.',
    baseUi: 'https://base-ui.com/react/components/menu',
    usage: ['Put it between groups, not at the start or end of a menu.'],
    dont: ['Don’t separate every item.'],
    accessibility: ['Renders role="separator"; screen readers skip it while moving through items.'],
  },
}
