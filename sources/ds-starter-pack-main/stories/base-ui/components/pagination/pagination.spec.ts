import { bodyStyle, sizes, type ComponentSpec, type VariantValues } from '../../spec/types'

export type PaginationSize = 'sm' | 'md' | 'lg'

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as PaginationSize]

/** Moves through pages of results. Built from Button and Icon Button. Not part of Base UI. */
export const paginationSpec: ComponentSpec = {
  name: 'Pagination',
  slug: 'pagination',
  axes: [sizes()],
  parts: [
    { id: 'root', figma: '', description: 'A navigation landmark labelled "Pagination".' },
    { id: 'list', figma: 'list', description: 'Previous, the pages, Next, in a row.' },
    { id: 'previous', parent: 'list', figma: 'list › previous', instanceOf: 'Icon Button', description: 'Goes back a page (a ghost Icon Button). Disabled on the first page.' },
    { id: 'page', parent: 'list', figma: ['list › page', 'list › current'], instanceOf: 'Button', description: 'A page number (a ghost Button); the current page is a Secondary Button with aria-current="page".' },
    { id: 'ellipsis', parent: 'list', figma: 'list › ellipsis', description: 'Stands for the pages left out of a long range.' },
    { id: 'next', parent: 'list', figma: 'list › next', instanceOf: 'Icon Button', description: 'Goes forward a page. Disabled on the last page.' },
  ],
  bindings: [
    { part: 'list', property: 'gap', by: [], value: 'space/xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'pagination/gap' } },
    // Page buttons are as wide as they are high, so single digits make squares. Code only: Figma
    // doesn't keep a min-width override on Button instances.
    { part: 'page', property: 'min-width', by: ['size'], on: 'code', value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'page-min-width', label: 'Page width', group: 'Container', token: 'pagination/page/min-width/{size}' } },
    { part: 'ellipsis', property: 'min-width', by: ['size'], on: 'code', value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'ellipsis-width', label: 'Ellipsis width', group: 'Container', token: 'pagination/ellipsis/min-width/{size}' } },
    { part: 'ellipsis', property: 'foreground', by: [], value: 'color/foreground/neutral/tertiary', override: { id: 'ellipsis-foreground', label: 'Ellipsis', group: 'Color', token: 'pagination/ellipsis/foreground' } },
    { part: 'ellipsis', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size), override: { id: 'ellipsis-style', label: 'Ellipsis style', group: 'Text', token: 'pagination/ellipsis/text-style/{size}' } },
  ],
  docs: {
    summary: 'Moves through pages of results: previous and next, the first and last page, and the pages around the current one.',
    baseUi: '',
    usage: ['Use it under long lists and tables that load one page at a time.', 'Keep the current page in the URL, so a page can be shared and the back button works.'],
    dont: ['Don’t use it for steps in a flow, or for content that fits on one page.'],
    accessibility: ['It’s a nav landmark labelled "Pagination". The current page has aria-current="page"; each page button is named "Page 4".', 'Two on one page (above and below a table)? Give each its own aria-label.'],
  },
}
