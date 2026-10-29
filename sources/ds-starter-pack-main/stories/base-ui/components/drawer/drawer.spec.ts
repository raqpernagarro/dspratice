import type { Axis, ComponentSpec } from '../../spec/types'
import { dialogParts, dialogProps } from '../dialog/dialog.spec'

export type DrawerSide = 'right' | 'left' | 'bottom'

/** The screen edge the panel is docked to (data-side on the popup). Border and rounded corners face the page. */
const side: Axis = {
  id: 'side',
  figma: 'Side',
  kind: 'prop',
  layout: true,
  values: [
    { code: 'right', figma: 'Right' },
    { code: 'left', figma: 'Left' },
    { code: 'bottom', figma: 'Bottom' },
  ],
}

/** A panel docked to an edge of the screen: right (default), left or bottom. Swipe it away, or press Escape. */
export const drawerSpec: ComponentSpec = {
  name: 'Drawer',
  slug: 'drawer',
  axes: [side],
  parts: [
    ...dialogParts('Drawer').map((p) => (p.id === 'root' ? { ...p, description: 'The panel, docked to an edge (full height at the sides, content height at the bottom).' } : p)),
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/2xl', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'drawer/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/2xl', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'drawer/space-y' } },
    { part: 'root', property: 'gap', by: [], value: 'space/2xl', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'drawer/gap' } },
    // The corners and border facing the page (one set per side).
    { part: 'root', property: 'radius-left', by: ['side'], exists: (v) => v.side === 'right', value: 'shape/radius/lg', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'drawer/radius' } },
    { part: 'root', property: 'radius-right', by: ['side'], exists: (v) => v.side === 'left', value: 'shape/radius/lg', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'drawer/radius' } },
    { part: 'root', property: 'radius-top', by: ['side'], exists: (v) => v.side === 'bottom', value: 'shape/radius/lg', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'drawer/radius' } },
    { part: 'root', property: 'border-left-width', by: ['side'], exists: (v) => v.side === 'right', value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'drawer/border-width' } },
    { part: 'root', property: 'border-right-width', by: ['side'], exists: (v) => v.side === 'left', value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'drawer/border-width' } },
    { part: 'root', property: 'border-top-width', by: ['side'], exists: (v) => v.side === 'bottom', value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'drawer/border-width' } },
    { part: 'root', property: 'background', by: [], value: 'color/background/surface/high', override: { id: 'background', label: 'Background', group: 'Color', token: 'drawer/background' } },
    { part: 'root', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'drawer/border-color' } },
    { part: 'root', property: 'shadow', by: [], value: 'effect/shadow/elevation/high' },
    { part: 'backdrop', property: 'background', by: [], value: 'color/background/overlay/regular', on: 'code', override: { id: 'backdrop', label: 'Backdrop', group: 'Color', token: 'drawer/backdrop' } },
    { part: 'header', property: 'gap', by: [], value: 'space/xs', override: { id: 'header-gap', label: 'Title gap', group: 'Text', token: 'drawer/header/gap' } },
    { part: 'title', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'title-foreground', label: 'Title', group: 'Color', token: 'drawer/title/foreground' } },
    { part: 'title', property: 'text-style', by: [], value: 'Body/LG Strong', override: { id: 'title-style', label: 'Title style', group: 'Text', token: 'drawer/title/text-style' } },
    { part: 'description', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'description-foreground', label: 'Description', group: 'Color', token: 'drawer/description/foreground' } },
    { part: 'description', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'description-style', label: 'Description style', group: 'Text', token: 'drawer/description/text-style' } },
    { part: 'body', property: 'gap', by: [], value: 'space/md', override: { id: 'body-gap', label: 'Body gap', group: 'Container', token: 'drawer/body/gap' } },
    { part: 'actions', property: 'gap', by: [], value: 'space/md', override: { id: 'actions-gap', label: 'Actions gap', group: 'Container', token: 'drawer/actions/gap' } },
  ],
  figmaProps: dialogProps('Filters', 'Narrow the list down. Swipe it away or press Escape to close.', 'Drawer', true),
  docs: {
    summary: 'A panel that slides in from the edge of the screen, for secondary tasks and details without leaving the page.',
    baseUi: 'https://base-ui.com/react/components/drawer',
    usage: [
      'Use it for filters, settings or an item’s details next to the list it came from.',
      'Give it a title; close it with a Close button, Escape, a swipe or a click on the backdrop.',
    ],
    dont: ['Don’t stack drawers.', 'Don’t use it for short confirmations; use Alert Dialog.'],
    accessibility: [
      'Behaves like a dialog: focus is trapped inside and returns to the trigger on close.',
      'Swiping is an extra: every way to close it also works from the keyboard.',
    ],
  },
}
