import { sizes, type ComponentSpec } from '../../spec/types'

export const toggleGroupSpec: ComponentSpec = {
  name: 'Toggle Group',
  slug: 'toggle-group',
  axes: [sizes()],
  parts: [
    { id: 'root', baseUi: 'ToggleGroup', figma: '', description: 'A bordered row of toggles. One or several can be on (multiple).' },
    { id: 'items', figma: 'Items', element: 'root', description: 'Slot for the toggles (in code, the children of the group).' },
    { id: 'toggle', figma: 'Items › toggle', instanceOf: 'Toggle', description: 'Toggle instances of the same size.' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/2xs', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'toggle-group/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/2xs', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'toggle-group/space-y' } },
    { part: 'root', property: 'gap', by: [], figmaLayers: ['Items'], value: 'space/2xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'toggle-group/gap' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'toggle-group/radius' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'toggle-group/border-width' } },
    { part: 'root', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'toggle-group/border-color' } },
    { part: 'root', property: 'background', by: [], value: 'color/background/neutral/primary', override: { id: 'background', label: 'Background', group: 'Color', token: 'toggle-group/background' } },
  ],
  figmaProps: [
    { kind: 'slot', name: 'Items', layer: 'Items', preferred: ['Toggle'], code: 'children' },
  ],
  docs: {
    summary: 'A set of toggles for related options, such as text alignment or formatting.',
    baseUi: 'https://base-ui.com/react/components/toggle-group',
    usage: ['Use for 2–5 related options shown as icons.', 'Pick single (one on at a time, like alignment) or multiple (like bold / italic).'],
    dont: ['Don’t mix unrelated actions in one group; use a Toolbar.'],
    accessibility: ['Arrow keys move between toggles; each announces its pressed state.', 'Give every icon toggle an aria-label.'],
  },
}
