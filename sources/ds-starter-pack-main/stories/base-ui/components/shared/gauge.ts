/** Progress and Meter: a label and value over a track holding an indicator. */
import type { Axis, Binding, FigmaProp, Part } from '../../spec/types'

/** Steps of the value, so designers pick one instead of resizing the indicator (value prop in code). */
export const valueAxis: Axis = {
  id: 'value',
  figma: 'Value',
  kind: 'prop',
  layout: true,
  values: ['0', '25', '50', '75', '100'].map((x) => ({ code: x, figma: `${x}%` })),
}

export function gaugeProps(label: string): FigmaProp[] {
  return [
    { kind: 'boolean', name: 'Show label', layers: ['header › label'], default: true, code: 'label' },
    { kind: 'text', name: 'Label', layers: ['header › label'], default: label },
    { kind: 'boolean', name: 'Show value', layers: ['header › value'], default: true, code: 'showValue' },
  ]
}

export function gaugeParts(ns: string): Part[] {
  return [
    { id: 'root', baseUi: `${ns}.Root`, figma: '', description: 'Header above the track.' },
    { id: 'header', figma: 'header', description: 'Label and value, at either end.' },
    { id: 'label', baseUi: `${ns}.Label`, parent: 'header', figma: 'header › label', description: 'What is measured.' },
    { id: 'value', baseUi: `${ns}.Value`, parent: 'header', figma: 'header › value', description: 'The formatted value (a percentage by default).' },
    { id: 'track', baseUi: `${ns}.Track`, figma: 'track', description: 'The full range.' },
    { id: 'indicator', baseUi: `${ns}.Indicator`, parent: 'track', figma: 'track › indicator', description: 'The filled part, as wide as the value.' },
  ]
}

export function gaugeBindings(slug: string, trackHeight: string): Binding[] {
  return [
    { part: 'root', property: 'gap', by: [], value: 'space/sm', override: { id: 'gap', label: 'Gap', group: 'Container', token: `${slug}/gap` } },
    { part: 'label', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'label-foreground', label: 'Label', group: 'Color', token: `${slug}/label/foreground` } },
    { part: 'label', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'label-style', label: 'Label style', group: 'Text', token: `${slug}/label/text-style` } },
    { part: 'value', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'value-foreground', label: 'Value', group: 'Color', token: `${slug}/value/foreground` } },
    { part: 'value', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'value-style', label: 'Value style', group: 'Text', token: `${slug}/value/text-style` } },
    { part: 'track', property: 'height', by: [], value: trackHeight, override: { id: 'track-height', label: 'Track height', group: 'Track', token: `${slug}/track/height` } },
    { part: 'track', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'track-radius', label: 'Track radius', group: 'Track', token: `${slug}/track/radius` } },
    { part: 'track', property: 'background', by: [], value: 'color/border/neutral/subtle', override: { id: 'track', label: 'Track', group: 'Color', token: `${slug}/track/background` } },
    { part: 'indicator', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'track-radius', label: 'Track radius', group: 'Track', token: `${slug}/track/radius` } },
    { part: 'indicator', property: 'background', by: [], value: 'color/background/accent/default', override: { id: 'indicator', label: 'Indicator', group: 'Color', token: `${slug}/indicator/background` } },
  ]
}
