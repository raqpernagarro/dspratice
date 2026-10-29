import type { ComponentSpec } from '../../spec/types'

/** The bordered stack of Accordion Items. One size. */
export const accordionSpec: ComponentSpec = {
  name: 'Accordion',
  slug: 'accordion',
  dir: 'accordion',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'Accordion.Root', figma: '', description: 'The frame around the items.' },
    { id: 'items', figma: 'Items', element: 'root', description: 'Slot for the Accordion Items (turn off the first one’s divider).' },
    { id: 'item', figma: 'Items › item', instanceOf: 'Accordion Item', description: 'Accordion Item instances.' },
  ],
  bindings: [
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/lg', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'accordion/radius' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'accordion/border-width' } },
    { part: 'root', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'accordion/border-color' } },
    { part: 'root', property: 'background', by: [], value: 'color/background/neutral/primary', override: { id: 'background', label: 'Background', group: 'Color', token: 'accordion/background' } },
  ],
  figmaProps: [{ kind: 'slot', name: 'Items', layer: 'Items', preferred: ['Accordion Item'], code: '<Accordion.Item>…' }],
  docs: {
    summary: 'A stack of sections that open and close, to keep long pages scannable.',
    baseUi: 'https://base-ui.com/react/components/accordion',
    usage: [
      'Use it for FAQs, settings groups and details the user opens on demand.',
      'By default one item is open at a time; pass multiple to allow several.',
    ],
    dont: ['Don’t use it for navigation or for a single section (use Collapsible).'],
    accessibility: ['Arrow keys move between headings; Home / End jump to the first / last; Enter or Space toggles.'],
  },
}
