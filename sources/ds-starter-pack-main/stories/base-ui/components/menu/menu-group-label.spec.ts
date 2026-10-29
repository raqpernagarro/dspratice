import type { ComponentSpec } from '../../spec/types'

/** Names a group of Menu Items. A building block for the Menu's Items slot. */
export const menuGroupLabelSpec: ComponentSpec = {
  name: 'Menu Group Label',
  slug: 'menu-group-label',
  dir: 'menu',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'Menu.GroupLabel', figma: '', description: 'The label row; inset like the items.' },
    { id: 'text', figma: 'text', element: 'root', description: 'The label’s text.' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'menu-group-label/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/xs', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'menu-group-label/space-y' } },
    { part: 'text', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'foreground', label: 'Text', group: 'Color', token: 'menu-group-label/foreground' } },
    { part: 'text', property: 'text-style', by: [], value: 'Caption/MD', override: { id: 'text-style', label: 'Text style', group: 'Text', token: 'menu-group-label/text-style' } },
  ],
  figmaProps: [{ kind: 'text', name: 'Label', layers: ['text'], default: 'Library', code: 'children' }],
  docs: {
    summary: 'Names a group of items in a Menu (or Context Menu, Menubar menu).',
    baseUi: 'https://base-ui.com/react/components/menu',
    usage: ['Use it inside a Menu.Group; one or two words.'],
    dont: ['Don’t use it as a clickable item.'],
    accessibility: ['Labels its Menu.Group (aria-labelledby).'],
  },
}
