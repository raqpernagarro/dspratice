import { sizes, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

export type SliderSize = 'sm' | 'md' | 'lg'
type State = 'default' | 'hover' | 'focused' | 'disabled'

/** Slider.Control sets data-focused (a thumb has focus), data-dragging, data-disabled. */
const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [':hover:not([data-disabled]):not([data-focused])', '[data-preview-state="hover"]'] },
    { code: 'focused', figma: 'Focused', css: ['[data-focused]', '[data-dragging]', '[data-preview-state="focused"]'] },
    { code: 'disabled', figma: 'Disabled', css: ['[data-disabled]'] },
  ],
}

const bySize = (sm: string, md: string, lg: string) => (v: VariantValues) => ({ sm, md, lg })[v.size as SliderSize]
const s = (v: VariantValues) => v.state as State

export const sliderSpec: ComponentSpec = {
  name: 'Slider',
  slug: 'slider',
  axes: [sizes(), state],
  parts: [
    { id: 'root', baseUi: 'Slider.Control', figma: '', description: 'The pointer area: its vertical padding makes the slider easy to grab.' },
    { id: 'track', baseUi: 'Slider.Track', figma: 'track', description: 'The full range.' },
    { id: 'indicator', baseUi: 'Slider.Indicator', parent: 'track', figma: 'track › indicator', description: 'The selected part of the range.' },
    { id: 'thumb', baseUi: 'Slider.Thumb', parent: 'track', figma: 'track › thumb', description: 'Drag it, or focus it and use the arrow keys. A range has two.' },
  ],
  bindings: [
    { part: 'root', property: 'padding-y', by: ['size'], value: bySize('space/sm', 'space/md', 'space/md'), override: { id: 'space-y', label: 'Hit area', group: 'Container', token: 'slider/space-y/{size}' } },
    { part: 'track', property: 'height', by: ['size'], value: bySize('space/2xs', 'space/xs', 'space/sm'), override: { id: 'track-height', label: 'Track height', group: 'Track', token: 'slider/track/height/{size}' } },
    { part: 'track', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'track-radius', label: 'Track radius', group: 'Track', token: 'slider/track/radius' } },
    { part: 'track', property: 'background', by: [], value: 'color/border/neutral/subtle', override: { id: 'track', label: 'Track', group: 'Color', token: 'slider/track/background' } },
    { part: 'indicator', property: 'background', by: ['state'], value: (v) => (s(v) === 'disabled' ? 'color/border/interactive/disabled' : s(v) === 'hover' ? 'color/background/accent/hover' : 'color/background/accent/default'), override: { id: 'indicator', label: 'Range', group: 'Color', token: 'slider/indicator/background/{state}' } },
    { part: 'indicator', property: 'radius', by: [], value: 'shape/radius/full' },
    { part: 'thumb', property: 'size', by: ['size'], value: bySize('space/md', 'size/xs', 'size/sm'), override: { id: 'thumb-size', label: 'Thumb size', group: 'Thumb', token: 'slider/thumb/size/{size}' } },
    { part: 'thumb', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'thumb-radius', label: 'Thumb radius', group: 'Thumb', token: 'slider/thumb/radius' } },
    { part: 'thumb', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'thumb-border-width', label: 'Thumb border', group: 'Thumb', token: 'slider/thumb/border-width' } },
    { part: 'thumb', property: 'background', by: [], value: 'color/background/neutral/primary', override: { id: 'thumb', label: 'Thumb', group: 'Color', token: 'slider/thumb/background' } },
    { part: 'thumb', property: 'border-color', by: ['state'], value: (v) => (s(v) === 'focused' ? 'color/border/interactive/selected' : `color/border/interactive/${s(v)}`), override: { id: 'thumb-border', label: 'Thumb border', group: 'Color', token: 'slider/thumb/border-color/{state}' } },
    { part: 'thumb', property: 'shadow', by: ['state'], value: (v) => (s(v) === 'focused' ? 'effect/shadow/focus-ring/primary' : 'none') },
  ],
  docs: {
    summary: 'Picks a value, or a range, by dragging along a track.',
    baseUi: 'https://base-ui.com/react/components/slider',
    usage: ['Use when the exact value matters less than its position (volume, price range).', 'Pass an array value for a range: one thumb per value.', 'Show the value next to it when users need the number.'],
    dont: ['Don’t use for precise numbers; use Number Field (or both together).'],
    accessibility: ['Each thumb is a focusable input with role slider; arrows step, Page Up / Down step 10×, Home / End jump.', 'Label each thumb (aria-label or getAriaLabel), e.g. “Minimum price”.'],
  },
}
