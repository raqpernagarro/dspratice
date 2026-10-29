import { bodyStyle, sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type TabsSize = 'sm' | 'md' | 'lg'

/** Base UI sets data-active on the selected tab (Figma: Selected). */
const selected: Axis = {
  id: 'selected',
  figma: 'Selected',
  kind: 'state',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-active])'] },
    { code: 'true', figma: 'True', css: ['[data-active]'] },
  ],
}

const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [':hover:not([data-disabled])', '[data-preview-state="hover"]'] },
    { code: 'disabled', figma: 'Disabled', css: ['[data-disabled]'] },
  ],
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as TabsSize]

function text(v: VariantValues) {
  if (v.state === 'disabled') return 'color/foreground/interactive/disabled'
  return v.selected === 'true' || v.state === 'hover' ? 'color/foreground/neutral/primary' : 'color/foreground/neutral/secondary'
}

export const tabSpec: ComponentSpec = {
  name: 'Tab',
  slug: 'tab',
  dir: 'tabs',
  axes: [sizes(), selected, state],
  tokenKeys: { selected: (v) => (v.selected === 'true' ? 'selected' : 'unselected') },
  parts: [
    { id: 'root', baseUi: 'Tabs.Tab', figma: '', description: 'One tab. In Figma the selected one draws the indicator (surface, border on three sides); in code Tabs.Indicator slides behind it.' },
    { id: 'label', figma: 'label', element: 'root', description: 'The text (the tab’s own text in code).' },
  ],
  bindings: [
    { part: 'root', property: 'height', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'height', label: 'Height', group: 'Container', token: 'tab/height/{size}' } },
    { part: 'root', property: 'padding-x', by: ['size'], value: bySize('space/sm', 'space/md', 'space/md'), override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'tab/space-x/{size}' } },
    // Figma only: the selected tab draws the indicator (in code, Tabs.Indicator slides behind it).
    { part: 'root', property: 'background', by: ['selected'], on: 'figma', value: (v) => (v.selected === 'true' ? 'color/background/neutral/primary' : 'colors/transparent') },
    { part: 'root', property: 'border-color', by: ['selected'], on: 'figma', value: (v) => (v.selected === 'true' ? 'color/border/neutral/subtle' : 'colors/transparent') },
    { part: 'root', property: 'border-top-width', by: [], on: 'figma', value: 'size/border/regular' },
    { part: 'root', property: 'border-left-width', by: [], on: 'figma', value: 'size/border/regular' },
    { part: 'root', property: 'border-right-width', by: [], on: 'figma', value: 'size/border/regular' },
    { part: 'root', property: 'radius-top', by: [], on: 'figma', value: 'shape/radius/md' },
    { part: 'label', property: 'foreground', by: ['selected', 'state'], value: text, override: { id: 'foreground', label: 'Label', group: 'Color', token: 'tab/foreground/{selected}/{state}' } },
    { part: 'label', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size), override: { id: 'text-style', label: 'Text style', group: 'Label', token: 'tab/text-style/{size}' } },
  ],
  figmaProps: [{ kind: 'text', name: 'Label', layers: ['label'], default: 'Overview', code: 'children' }],
  docs: {
    summary: 'One tab of a Tabs list.',
    baseUi: 'https://base-ui.com/react/components/tabs',
    usage: ['Label tabs with one or two words; keep them parallel (Overview, Projects, Account).'],
    dont: ['Don’t disable a tab to hide content the user can’t reach; explain why instead.'],
    accessibility: ['Arrow keys move between tabs; Home / End jump to the first / last.'],
  },
}
