import type { Axis, ComponentSpec, VariantValues } from '../../spec/types'

export type BadgeType = 'neutral' | 'info' | 'success' | 'warning' | 'error'
export type BadgeSize = 'sm' | 'md'

const type: Axis = {
  id: 'type',
  figma: 'Type',
  kind: 'prop',
  values: [
    { code: 'neutral', figma: 'Neutral' },
    { code: 'info', figma: 'Info' },
    { code: 'success', figma: 'Success' },
    { code: 'warning', figma: 'Warning' },
    { code: 'error', figma: 'Error' },
  ],
}

/** Two sizes: a badge sits next to text, so it's smaller than the controls' sm / md / lg. */
const size: Axis = {
  id: 'size',
  figma: 'Size',
  kind: 'prop',
  values: [
    { code: 'sm', figma: 'Small' },
    { code: 'md', figma: 'Medium' },
  ],
}

/** Each status type takes its subtle background and border; Neutral is a quiet grey. */
const BACKGROUND: Record<BadgeType, string> = {
  neutral: 'color/background/neutral/tertiary',
  info: 'color/background/info/subtle',
  success: 'color/background/success/subtle',
  warning: 'color/background/warning/subtle',
  error: 'color/background/error/subtle',
}
const BORDER: Record<BadgeType, string> = {
  neutral: 'color/border/neutral/subtle',
  info: 'color/border/info',
  success: 'color/border/success',
  warning: 'color/border/warning',
  error: 'color/border/error',
}
const FOREGROUND: Record<BadgeType, string> = {
  neutral: 'color/foreground/neutral/secondary',
  info: 'color/foreground/info',
  success: 'color/foreground/success',
  warning: 'color/foreground/warning',
  error: 'color/foreground/error',
}
const bySize = (sm: string, md: string) => (v: VariantValues) => ({ sm, md })[v.size as BadgeSize]

/** A short status or count label. Not part of Base UI: built on the same tokens. */
export const badgeSpec: ComponentSpec = {
  name: 'Badge',
  slug: 'badge',
  axes: [type, size],
  parts: [
    { id: 'root', figma: '', description: 'The pill. Holds the background, border and padding.' },
    { id: 'label', figma: 'label', element: 'root', description: 'The text (the badge’s own text in code).' },
  ],
  bindings: [
    { part: 'root', property: 'background', by: ['type'], value: (v) => BACKGROUND[v.type as BadgeType], override: { id: 'background', label: 'Background', group: 'Color', token: 'badge/background/{type}' } },
    { part: 'root', property: 'border-color', by: ['type'], value: (v) => BORDER[v.type as BadgeType], override: { id: 'border-color', label: 'Border', group: 'Color', token: 'badge/border-color/{type}' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'badge/border-width' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'badge/radius' } },
    { part: 'root', property: 'height', by: ['size'], value: bySize('size/sm', 'space/2xl'), override: { id: 'height', label: 'Height', group: 'Container', token: 'badge/height/{size}' } },
    { part: 'root', property: 'padding-x', by: ['size'], value: bySize('space/sm', 'space/md'), override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'badge/space-x/{size}' } },
    { part: 'label', property: 'foreground', by: ['type'], value: (v) => FOREGROUND[v.type as BadgeType], override: { id: 'foreground', label: 'Text', group: 'Color', token: 'badge/foreground/{type}' } },
    { part: 'label', property: 'text-style', by: ['size'], value: bySize('Caption/MD', 'Body/SM Strong'), override: { id: 'text-style', label: 'Text style', group: 'Text', token: 'badge/text-style/{size}' } },
  ],
  figmaProps: [{ kind: 'text', name: 'Label', layers: ['label'], default: 'Badge', code: 'children' }],
  docs: {
    summary: 'A short label for a status, a category or a count, next to the thing it describes.',
    baseUi: '',
    usage: ['Use the status types for states (Success = done, Warning = needs attention, Error = failed, Info = neutral news).', 'Keep it to one or two words.'],
    dont: ['Don’t make it clickable; use a Button or Toggle.', 'Don’t rely on color alone: the word must say the status.'],
    accessibility: ['It’s plain text: screen readers read the label. Add context in the label when the status alone is unclear ("Build failed", not "Failed").'],
  },
}
