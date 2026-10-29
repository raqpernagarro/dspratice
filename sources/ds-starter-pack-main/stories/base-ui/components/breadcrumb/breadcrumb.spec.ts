import type { ComponentSpec } from '../../spec/types'

/** Where the page sits in the site's hierarchy, as a trail of links. Not part of Base UI. */
export const breadcrumbSpec: ComponentSpec = {
  name: 'Breadcrumb',
  slug: 'breadcrumb',
  axes: [],
  parts: [
    { id: 'root', figma: '', description: 'A navigation landmark labelled "Breadcrumb".' },
    { id: 'list', figma: 'Items', description: 'The ordered list of Breadcrumb Items.' },
  ],
  bindings: [{ part: 'list', property: 'gap', by: [], value: 'space/xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'breadcrumb/gap' } }],
  figmaProps: [{ kind: 'slot', name: 'Items', layer: 'Items', preferred: ['Breadcrumb Item'], code: '<Breadcrumb.Item>…' }],
  docs: {
    summary: 'Shows where the page sits in the site’s hierarchy, with a link to each level above it.',
    baseUi: '',
    usage: ['Start at the top level (often Home) and end with the current page.', 'Use it in deep hierarchies (three levels or more), above the page title.'],
    dont: ['Don’t use it for steps in a flow; that’s a stepper.', 'Don’t replace the main navigation with it.'],
    accessibility: ['It’s a nav landmark with an ordered list, so screen readers announce how many levels there are.'],
  },
}
