import { bodyStyle, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type NavigationMenuItemType = 'link' | 'trigger'

const type: Axis = {
  id: 'type',
  figma: 'Type',
  kind: 'prop',
  values: [
    { code: 'link', figma: 'Link' },
    { code: 'trigger', figma: 'Trigger' },
  ],
}

const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [':hover', '[data-preview-state="hover"]'] },
  ],
}

/** The current page (NavigationMenu.Link: data-active) or an open trigger (data-popup-open). */
const active: Axis = {
  id: 'active',
  figma: 'Active',
  kind: 'state',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-active]):not([data-popup-open])'] },
    { code: 'true', figma: 'True', css: ['[data-active]', '[data-popup-open]'] },
  ],
}

function background(v: VariantValues) {
  if (v.state === 'hover') return 'color/background/interactive/subtle/hover'
  return v.active === 'true' ? 'color/background/interactive/subtle/selected' : 'color/background/interactive/subtle/default'
}

export const navigationMenuItemSpec: ComponentSpec = {
  name: 'Navigation Menu Item',
  slug: 'navigation-menu-item',
  dir: 'navigation-menu',
  axes: [type, state, active],
  tokenKeys: { active: (v) => (v.active === 'true' ? 'active' : 'inactive') },
  parts: [
    { id: 'root', baseUi: 'NavigationMenu.Link / NavigationMenu.Trigger', figma: '', description: 'A link to a page, or a trigger that opens a panel of links.' },
    { id: 'icon', figma: 'icon', description: 'Optional (Show icon). A line icon while inactive, filled while active (current page or open panel).' },
    { id: 'label', figma: 'label', description: 'The item’s text.' },
    { id: 'caret', baseUi: 'NavigationMenu.Icon', figma: 'caret', description: 'Triggers only. Turns over while the panel is open.' },
  ],
  bindings: [
    { part: 'root', property: 'height', by: [], value: 'size/lg', override: { id: 'height', label: 'Height', group: 'Container', token: 'navigation-menu-item/height' } },
    { part: 'root', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'navigation-menu-item/space-x' } },
    { part: 'root', property: 'gap', by: [], value: 'space/xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'navigation-menu-item/gap' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'navigation-menu-item/radius' } },
    { part: 'root', property: 'background', by: ['active', 'state'], value: background, override: { id: 'background', label: 'Background', group: 'Color', token: 'navigation-menu-item/background/{active}/{state}' } },
    { part: 'icon', property: 'size', by: [], value: 'size/xs', override: { id: 'icon-size', label: 'Icon size', group: 'Icon', token: 'navigation-menu-item/icon/size' } },
    { part: 'icon', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', figmaLayers: ['icon › Vector'], override: { id: 'icon-foreground', label: 'Icon', group: 'Color', token: 'navigation-menu-item/icon/foreground' } },
    { part: 'label', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'navigation-menu-item/label/foreground' } },
    { part: 'label', property: 'text-style', by: [], value: bodyStyle('md'), override: { id: 'label-style', label: 'Text style', group: 'Label', token: 'navigation-menu-item/label/text-style' } },
    { part: 'caret', property: 'size', by: [], value: 'size/2xs', override: { id: 'caret-size', label: 'Caret size', group: 'Icon', token: 'navigation-menu-item/caret/size' } },
    { part: 'caret', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', figmaLayers: ['caret › Vector'], override: { id: 'caret-foreground', label: 'Caret', group: 'Color', token: 'navigation-menu-item/caret/foreground' } },
  ],
  docs: {
    summary: 'An entry of a Navigation Menu: a link to a page, or a trigger that opens a panel of links.',
    baseUi: 'https://base-ui.com/react/components/navigation-menu',
    usage: [
      'Mark the current page’s link active: its icon fills and it gets the selected background.',
      'Use a trigger for a section with several pages; its panel lists them with a line of description each.',
    ],
    dont: ['Don’t put actions (Log out, Share) in navigation; use Menu.'],
    accessibility: [
      'The active link gets aria-current="page".',
      'Triggers open their panel on hover, Enter or Space; Escape closes it and returns focus.',
    ],
  },
}
