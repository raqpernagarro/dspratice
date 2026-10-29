import type { ComponentSpec } from '../../spec/types'

/**
 * A bordered strip of controls: Toggles and Icon Buttons in groups, split by vertical Separators.
 * The controls are the design system's own (their tokens style them); the toolbar adds the strip.
 */
export const toolbarSpec: ComponentSpec = {
  name: 'Toolbar',
  slug: 'toolbar',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'Toolbar.Root', figma: '', description: 'The strip. One tab stop; arrow keys move between its controls.' },
    { id: 'items', figma: 'Items', element: 'root', description: 'Slot for the controls: Toggles, Icon Buttons, Separators (in code, the toolbar’s children).' },
    { id: 'group', baseUi: 'Toolbar.Group', figma: 'Items › group', description: 'Related controls (a Toggle Group for exclusive choices).' },
    { id: 'toggle', figma: 'Items › group › toggle', instanceOf: 'Toggle', description: 'Toggle instances (Toolbar.Button render={<Toggle />}).' },
    { id: 'button', figma: 'Items › group › button', instanceOf: 'Icon Button', description: 'Icon Button instances (Toolbar.Button render={<IconButton />}).' },
    { id: 'separator', baseUi: 'Toolbar.Separator', figma: 'Items › separator', instanceOf: 'Separator', description: 'Vertical Separator instances between groups.' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/2xs', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'toolbar/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/2xs', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'toolbar/space-y' } },
    { part: 'root', property: 'gap', by: [], figmaLayers: ['Items'], value: 'space/xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'toolbar/gap' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'toolbar/radius' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'toolbar/border-width' } },
    { part: 'root', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'toolbar/border-color' } },
    { part: 'root', property: 'background', by: [], value: 'color/background/neutral/primary', override: { id: 'background', label: 'Background', group: 'Color', token: 'toolbar/background' } },
    { part: 'group', property: 'gap', by: [], value: 'space/2xs', override: { id: 'group-gap', label: 'Group gap', group: 'Container', token: 'toolbar/group/gap' } },
  ],
  figmaProps: [{ kind: 'slot', name: 'Items', layer: 'Items', preferred: ['Toggle', 'Icon Button', 'Separator', 'Toggle Group'], code: 'children' }],
  docs: {
    summary: 'Groups the controls of an editor or a view (formatting, alignment, zoom) in one strip.',
    baseUi: 'https://base-ui.com/react/components/toolbar',
    usage: [
      'Use Toggles for on/off formatting and a Toggle Group for one-of choices (alignment).',
      'Give icon-only controls a Tooltip and an aria-label.',
      'Separate groups with a separator; keep the order stable.',
    ],
    dont: ['Don’t use it for navigation or a single action.'],
    accessibility: ['Renders role="toolbar": one tab stop, arrow keys move between controls.'],
  },
}
