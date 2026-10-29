import type { ComponentSpec } from '../../spec/types'
import { arrowBindings, arrowParts, surface } from '../shared/popup'

/** The bar and, below it, an open panel of links (portalled in code). One size. */
export const navigationMenuSpec: ComponentSpec = {
  name: 'Navigation Menu',
  slug: 'navigation-menu',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'NavigationMenu.Root', figma: '', description: 'The bar and its panel (in code, the panel is portalled and placed under its trigger).' },
    { id: 'list', baseUi: 'NavigationMenu.List', figma: 'List', description: 'Slot for the bar’s items.' },
    { id: 'item', figma: 'List › item', instanceOf: 'Navigation Menu Item', description: 'Navigation Menu Item instances.' },
    { id: 'popup', baseUi: 'NavigationMenu.Popup', figma: 'popup', portal: true, description: 'The panel’s surface (Show panel). Resizes to the open trigger’s content.' },
    { id: 'content', baseUi: 'NavigationMenu.Content', parent: 'popup', figma: 'popup', description: 'The open trigger’s links. Holds the panel’s padding (Base UI sizes the popup from it); in Figma it is the popup frame itself.' },
    { id: 'links', figma: 'popup › Links', element: 'content', description: 'Slot for the panel’s links (in code, the Content’s children).' },
    { id: 'link', figma: 'popup › Links › link', instanceOf: 'Navigation Menu Link', description: 'Navigation Menu Link instances.' },
    ...arrowParts('NavigationMenu.Arrow', 'popup'),
  ],
  bindings: [
    { part: 'root', property: 'gap', by: [], value: 'space/sm', on: 'figma' },
    { part: 'list', property: 'gap', by: [], value: 'space/2xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'navigation-menu/gap' } },
    { part: 'content', property: 'padding-x', by: [], value: 'space/sm', override: { id: 'popup-space-x', label: 'Padding X', group: 'Panel', token: 'navigation-menu/popup/space-x' } },
    { part: 'content', property: 'padding-y', by: [], value: 'space/sm', override: { id: 'popup-space-y', label: 'Padding Y', group: 'Panel', token: 'navigation-menu/popup/space-y' } },
    ...surface('navigation-menu', { part: 'popup', prefix: 'navigation-menu/popup', spaceX: null, spaceY: null }).map((b) => ({ ...b, override: b.override && { ...b.override, id: `popup-${b.override.id}`, group: b.override.group === 'Color' ? 'Color' : 'Panel' } })),
    ...arrowBindings('navigation-menu', { prefix: 'navigation-menu/popup' }).map((b) => ({ ...b, override: b.override && { ...b.override, id: `popup-${b.override.id}`, group: b.override.group === 'Color' ? 'Color' : 'Panel' } })),
  ],
  figmaProps: [
    { kind: 'slot', name: 'List', layer: 'List', preferred: ['Navigation Menu Item'], code: '<NavigationMenu.Item>…' },
    { kind: 'boolean', name: 'Show panel', layers: ['popup'], default: true, code: '<NavigationMenu.Content>' },
    { kind: 'slot', name: 'Links', layer: 'popup › Links', preferred: ['Navigation Menu Link'], code: '<NavigationMenu.Card>…' },
  ],
  docs: {
    summary: 'Site navigation: a row of links and triggers whose panels list a section’s pages.',
    baseUi: 'https://base-ui.com/react/components/navigation-menu',
    usage: [
      'Use it for a site’s or app’s main sections; mark the current page’s link active.',
      'In a panel, give each link a title and one line of description.',
      'Keep the bar short (up to ~6 items); the panel is where depth goes.',
    ],
    dont: ['Don’t use it for commands; use Menu or Menubar.'],
    accessibility: [
      'Renders a <nav> with a list; links are real links (render your router’s Link).',
      'Panels open on hover and on Enter / Space; arrow keys move between items.',
    ],
  },
}
