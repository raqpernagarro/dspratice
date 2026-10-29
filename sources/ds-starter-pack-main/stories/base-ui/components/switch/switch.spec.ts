import { bodyStyle, labelledControlStates, sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type SwitchSize = 'sm' | 'md' | 'lg'

/** Checked lives on Switch.Root (the track). */
const checked: Axis = {
  id: 'checked',
  figma: 'Checked',
  kind: 'state',
  on: 'control',
  values: [
    { code: 'false', figma: 'False', css: ['[data-unchecked]'] },
    { code: 'true', figma: 'True', css: ['[data-checked]'] },
  ],
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as SwitchSize]

function track(role: 'bg' | 'border', v: VariantValues) {
  if (v.state === 'disabled') return role === 'bg' ? 'color/background/interactive/disabled' : 'color/border/interactive/disabled'
  if (v.checked === 'true') return `color/background/accent/${v.state}`
  return role === 'bg' ? 'color/background/neutral/primary' : `color/border/interactive/${v.state}`
}

/** Off: a dark thumb on a light track (Base UI's look); on: an on-accent thumb on the accent track. */
function thumb(v: VariantValues) {
  if (v.state === 'disabled') return 'color/foreground/neutral/tertiary'
  return v.checked === 'true' ? 'color/foreground/on-accent/primary' : `color/border/interactive/${v.state}`
}

export const switchSpec: ComponentSpec = {
  name: 'Switch',
  slug: 'switch',
  axes: [checked, sizes(), labelledControlStates('switch')],
  tokenKeys: { checked: (v) => (v.checked === 'true' ? 'on' : 'off') },
  parts: [
    { id: 'root', figma: '', description: 'The <label> wrapping the switch and its text.' },
    { id: 'control', baseUi: 'Switch.Root', figma: 'control', description: 'The track. Its height follows the thumb (padding + thumb + border).' },
    { id: 'thumb', baseUi: 'Switch.Thumb', parent: 'control', figma: 'control › thumb', description: 'Slides to the end of the track while on.' },
    { id: 'label', figma: 'label', description: 'The text. Optional (Show label).' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: ['size'], value: bySize('space/xs', 'space/sm', 'space/sm'), override: { id: 'gap', label: 'Gap', group: 'Container', token: 'switch/gap/{size}' } },
    { part: 'control', property: 'width', by: ['size'], value: bySize('size/md', 'size/lg', 'size/xl'), override: { id: 'track-width', label: 'Track width', group: 'Track', token: 'switch/track/width/{size}' } },
    { part: 'control', property: 'padding-x', by: [], value: 'space/2xs', override: { id: 'track-space-x', label: 'Track padding X', group: 'Track', token: 'switch/track/space-x' } },
    { part: 'control', property: 'padding-y', by: [], value: 'space/2xs', override: { id: 'track-space-y', label: 'Track padding Y', group: 'Track', token: 'switch/track/space-y' } },
    { part: 'control', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'track-radius', label: 'Track radius', group: 'Track', token: 'switch/track/radius' } },
    { part: 'control', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Track', token: 'switch/track/border-width' } },
    { part: 'control', property: 'background', by: ['checked', 'state'], value: (v) => track('bg', v), override: { id: 'track-background', label: 'Track', group: 'Color', token: 'switch/track/background/{checked}/{state}' } },
    { part: 'control', property: 'border-color', by: ['checked', 'state'], value: (v) => track('border', v), override: { id: 'track-border', label: 'Track border', group: 'Color', token: 'switch/track/border-color/{checked}/{state}' } },
    { part: 'thumb', property: 'size', by: ['size'], value: bySize('space/md', 'size/2xs', 'size/xs'), override: { id: 'thumb-size', label: 'Thumb size', group: 'Thumb', token: 'switch/thumb/size/{size}' } },
    { part: 'thumb', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'thumb-radius', label: 'Thumb radius', group: 'Thumb', token: 'switch/thumb/radius' } },
    { part: 'thumb', property: 'background', by: ['checked', 'state'], value: thumb, override: { id: 'thumb-background', label: 'Thumb', group: 'Color', token: 'switch/thumb/background/{checked}/{state}' } },
    { part: 'label', property: 'foreground', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary'), override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'switch/label/foreground/{state}' } },
    { part: 'label', property: 'text-style', by: ['size'], value: (v) => bodyStyle(v.size), override: { id: 'label-style', label: 'Text style', group: 'Label', token: 'switch/label/text-style/{size}' } },
  ],
  docs: {
    summary: 'Turns a setting on or off, with immediate effect.',
    baseUi: 'https://base-ui.com/react/components/switch',
    usage: ['Use for settings that apply right away (notifications, dark mode).', 'Label the setting, not the action: “Notifications”, not “Turn on notifications”.'],
    dont: ['Don’t use a switch in a form that needs a submit; use a Checkbox.'],
    accessibility: ['Renders role="switch" with aria-checked; Space toggles it.', 'The wrapping <label> names it; without visible text, pass aria-label.'],
  },
}
