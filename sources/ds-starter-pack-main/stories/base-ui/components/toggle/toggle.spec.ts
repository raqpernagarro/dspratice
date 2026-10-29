import { sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type ToggleSize = 'sm' | 'md' | 'lg'

const ENABLED = ':not(:disabled):not([data-disabled])'

/** Base UI sets data-pressed while the toggle is on. Figma calls it Selected (State already has Pressed). */
const selected: Axis = {
  id: 'selected',
  figma: 'Selected',
  kind: 'state',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-pressed])'] },
    { code: 'true', figma: 'True', css: ['[data-pressed]'] },
  ],
}

const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [`:hover${ENABLED}`, '[data-preview-state="hover"]'] },
    { code: 'pressed', figma: 'Pressed', css: [`:active${ENABLED}`, '[data-preview-state="pressed"]'] },
    { code: 'disabled', figma: 'Disabled', css: [':disabled', '[data-disabled]'] },
  ],
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as ToggleSize]

function background(v: VariantValues) {
  if (v.state === 'pressed') return 'color/background/interactive/subtle/pressed'
  if (v.selected === 'true') return 'color/background/interactive/subtle/selected'
  return v.state === 'hover' ? 'color/background/interactive/subtle/hover' : 'color/background/interactive/subtle/default'
}

function foreground(v: VariantValues) {
  if (v.state === 'disabled') return 'color/foreground/interactive/disabled'
  if (v.selected === 'true' || v.state !== 'default') return 'color/foreground/neutral/primary'
  return 'color/foreground/neutral/secondary'
}

export const toggleSpec: ComponentSpec = {
  name: 'Toggle',
  slug: 'toggle',
  axes: [selected, sizes(), state],
  tokenKeys: { selected: (v) => (v.selected === 'true' ? 'on' : 'off') },
  parts: [
    { id: 'root', baseUi: 'Toggle', figma: '', description: 'A button that stays pressed while on.' },
    { id: 'icon', figma: 'icon', description: 'Line icon while off, filled icon while on (in code, pass the Phosphor icon; the weight follows the state).' },
  ],
  bindings: [
    { part: 'root', property: 'height', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl'), override: { id: 'size', label: 'Size', group: 'Container', token: 'toggle/size/{size}' } },
    { part: 'root', property: 'min-width', by: ['size'], value: bySize('space/2xl', 'size/lg', 'size/xl') },
    { part: 'root', property: 'radius', by: ['size'], value: 'shape/radius/sm', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'toggle/radius/{size}' } },
    { part: 'root', property: 'background', by: ['selected', 'state'], value: background, override: { id: 'background', label: 'Background', group: 'Color', token: 'toggle/background/{selected}/{state}' } },
    { part: 'root', property: 'foreground', by: ['selected', 'state'], value: foreground, figmaLayers: ['icon › Vector'], override: { id: 'foreground', label: 'Icon', group: 'Color', token: 'toggle/foreground/{selected}/{state}' } },
    { part: 'icon', property: 'size', by: ['size'], value: bySize('size/2xs', 'size/xs', 'size/sm'), override: { id: 'icon-size', label: 'Icon size', group: 'Icon', token: 'toggle/icon/size/{size}' } },
  ],
  docs: {
    summary: 'A two-state button: on or off. Its icon is drawn as a line while off and filled while on.',
    baseUi: 'https://base-ui.com/react/components/toggle',
    usage: ['Use for a single on / off action with an icon (favorite, bold, mute).', 'Group related toggles in a Toggle Group.'],
    dont: ['Don’t use for settings that apply immediately and aren’t actions; use a Switch.'],
    accessibility: ['Renders a button with aria-pressed.', 'Icon-only toggles need an aria-label that names the action (“Favorite”).'],
  },
}
