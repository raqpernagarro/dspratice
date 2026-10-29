import type { Axis, ComponentSpec, VariantValues } from '../../spec/types'

export type BreadcrumbItemState = 'default' | 'hover' | 'current'

/** States live on the link: the page you're on is aria-current="page" (Figma: Current). */
const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  on: 'link',
  values: [
    { code: 'default', figma: 'Default', css: [':not([aria-current])'] },
    { code: 'hover', figma: 'Hover', css: [':hover:not([aria-current])', '[data-preview-state="hover"]'] },
    { code: 'current', figma: 'Current', css: ['[aria-current="page"]'] },
  ],
}

const current = (v: VariantValues) => v.state === 'current'

/** One step of a Breadcrumb: a link, then a separator (none after the current page). */
export const breadcrumbItemSpec: ComponentSpec = {
  name: 'Breadcrumb Item',
  slug: 'breadcrumb-item',
  dir: 'breadcrumb',
  axes: [state],
  parts: [
    { id: 'root', figma: '', description: 'The list item: the link and the separator after it.' },
    { id: 'link', figma: 'link', description: 'A link to that level. On the current page it’s plain text (aria-current="page").' },
    { id: 'separator', figma: 'separator', description: 'A caret pointing to the next level. Hidden on the current page.' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: [], value: 'space/xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'breadcrumb-item/gap' } },
    { part: 'link', property: 'foreground', by: ['state'], value: (v) => (v.state === 'default' ? 'color/foreground/neutral/secondary' : 'color/foreground/neutral/primary'), override: { id: 'foreground', label: 'Text', group: 'Color', token: 'breadcrumb-item/foreground/{state}' } },
    { part: 'link', property: 'text-style', by: ['state'], value: (v) => (current(v) ? 'Body/SM Strong' : 'Body/SM'), override: { id: 'text-style', label: 'Text style', group: 'Text', token: 'breadcrumb-item/text-style/{state}' } },
    { part: 'separator', property: 'foreground', by: [], value: 'color/foreground/neutral/tertiary', figmaLayers: ['separator › Vector'], override: { id: 'separator-foreground', label: 'Separator', group: 'Icon', token: 'breadcrumb-item/separator/foreground' } },
    { part: 'separator', property: 'size', by: [], value: 'size/2xs', override: { id: 'separator-size', label: 'Separator size', group: 'Icon', token: 'breadcrumb-item/separator/size' } },
  ],
  figmaProps: [{ kind: 'text', name: 'Label', layers: ['link'], default: 'Projects', code: 'children' }],
  docs: {
    summary: 'One level in a Breadcrumb trail.',
    baseUi: '',
    usage: ['Label each level with its page title, shortened if needed.'],
    accessibility: ['The last item is the current page: it isn’t a link, and screen readers hear "current page".'],
  },
}
