import type { Axis, ComponentSpec, VariantValues } from '../../spec/types'

const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [':hover', '[data-preview-state="hover"]'] },
  ],
}

/** A link card in a Navigation Menu panel: title and one line of description. A building block for the panel's Links slot. */
export const navigationMenuLinkSpec: ComponentSpec = {
  name: 'Navigation Menu Link',
  slug: 'navigation-menu-link',
  dir: 'navigation-menu',
  axes: [state],
  parts: [
    { id: 'root', baseUi: 'NavigationMenu.Link', figma: '', description: 'The card: a link to a page.' },
    { id: 'title', figma: 'title', description: 'The page’s name.' },
    { id: 'description', figma: 'description', description: 'One line about the page (Show description).' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/sm', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'navigation-menu-link/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/sm', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'navigation-menu-link/space-y' } },
    { part: 'root', property: 'gap', by: [], value: 'space/xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'navigation-menu-link/gap' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'navigation-menu-link/radius' } },
    { part: 'root', property: 'background', by: ['state'], value: (v: VariantValues) => (v.state === 'hover' ? 'color/background/interactive/subtle/hover' : 'color/background/interactive/subtle/default'), override: { id: 'background', label: 'Background', group: 'Color', token: 'navigation-menu-link/background/{state}' } },
    { part: 'title', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'title-foreground', label: 'Title', group: 'Color', token: 'navigation-menu-link/title/foreground' } },
    { part: 'title', property: 'text-style', by: [], value: 'Body/MD Strong', override: { id: 'title-style', label: 'Title style', group: 'Text', token: 'navigation-menu-link/title/text-style' } },
    { part: 'description', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'description-foreground', label: 'Description', group: 'Color', token: 'navigation-menu-link/description/foreground' } },
    { part: 'description', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'description-style', label: 'Description style', group: 'Text', token: 'navigation-menu-link/description/text-style' } },
  ],
  figmaProps: [
    { kind: 'text', name: 'Title', layers: ['title'], default: 'Quick start', code: 'title' },
    { kind: 'boolean', name: 'Show description', layers: ['description'], default: true, code: 'description' },
    { kind: 'text', name: 'Description', layers: ['description'], default: 'Install and assemble your first component.' },
  ],
  docs: {
    summary: 'A link card in a Navigation Menu panel.',
    baseUi: 'https://base-ui.com/react/components/navigation-menu',
    usage: ['Title the page; describe it in one line.'],
    dont: ['Don’t put buttons in it; the whole card is the link.'],
    accessibility: ['A real link (render your router’s Link); the title is its accessible name, the description is read after it.'],
  },
}
