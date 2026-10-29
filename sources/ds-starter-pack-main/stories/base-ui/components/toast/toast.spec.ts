import type { Axis, ComponentSpec, VariantValues } from '../../spec/types'

export type ToastType = 'neutral' | 'success' | 'warning' | 'error'

/** Base UI sets data-type from the toast's type (toastManager.add({ type })); no type is neutral. */
const type: Axis = {
  id: 'type',
  figma: 'Type',
  kind: 'state',
  values: [
    { code: 'neutral', figma: 'Neutral', css: [':not([data-type])', '[data-type="neutral"]'] },
    { code: 'success', figma: 'Success', css: ['[data-type="success"]'] },
    { code: 'warning', figma: 'Warning', css: ['[data-type="warning"]'] },
    { code: 'error', figma: 'Error', css: ['[data-type="error"]'] },
  ],
}

const ICON_COLOR: Record<ToastType, string> = {
  neutral: 'color/foreground/neutral/secondary',
  success: 'color/foreground/success',
  warning: 'color/foreground/warning',
  error: 'color/foreground/error',
}
import { surface } from '../shared/popup'

/** Each type takes its status colors: the subtle background and the matching border. Neutral is a plain surface. */
const BACKGROUND: Record<ToastType, string> = {
  neutral: 'color/background/surface/medium',
  success: 'color/background/success/subtle',
  warning: 'color/background/warning/subtle',
  error: 'color/background/error/subtle',
}
const BORDER: Record<ToastType, string> = {
  neutral: 'color/border/neutral/subtle',
  success: 'color/border/success',
  warning: 'color/border/warning',
  error: 'color/border/error',
}

/** One toast. Toasts stack in a Toast.Viewport in a corner of the screen. One size. */
export const toastSpec: ComponentSpec = {
  name: 'Toast',
  slug: 'toast',
  axes: [type],
  parts: [
    { id: 'root', baseUi: 'Toast.Root', figma: '', description: 'The surface. Swipe it away, or it times out (5 s by default).' },
    { id: 'content', baseUi: 'Toast.Content', figma: 'content', description: 'Text and close button, side by side.' },
    { id: 'icon', parent: 'content', figma: 'content › icon', description: 'Shows the type: info, check, warning or cross (Show icon).' },
    { id: 'text', parent: 'content', figma: 'content › text', description: 'Title and description.' },
    { id: 'title', baseUi: 'Toast.Title', parent: 'text', figma: 'content › text › title', description: 'What happened, in a few words.' },
    { id: 'description', baseUi: 'Toast.Description', parent: 'text', figma: 'content › text › description', description: 'Details, or what to do next.' },
    { id: 'close', baseUi: 'Toast.Close', parent: 'content', figma: 'content › close', instanceOf: 'Button', description: 'Dismisses it (a Button).' },
  ],
  bindings: [
    ...surface('toast', { spaceX: null, spaceY: null }).filter((b) => b.property !== 'background' && b.property !== 'border-color'),
    { part: 'root', property: 'background', by: ['type'], value: (v: VariantValues) => BACKGROUND[v.type as ToastType], override: { id: 'background', label: 'Background', group: 'Color', token: 'toast/background/{type}' } },
    { part: 'root', property: 'border-color', by: ['type'], value: (v: VariantValues) => BORDER[v.type as ToastType], override: { id: 'border-color', label: 'Border', group: 'Color', token: 'toast/border-color/{type}' } },
    { part: 'content', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'toast/space-x' } },
    { part: 'content', property: 'padding-y', by: [], value: 'space/md', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'toast/space-y' } },
    { part: 'content', property: 'gap', by: [], value: 'space/lg', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'toast/gap' } },
    { part: 'icon', property: 'size', by: [], value: 'size/xs', override: { id: 'icon-size', label: 'Icon size', group: 'Icon', token: 'toast/icon/size' } },
    { part: 'icon', property: 'foreground', by: ['type'], value: (v: VariantValues) => ICON_COLOR[v.type as ToastType], figmaLayers: ['content › icon › Vector'], override: { id: 'icon-foreground', label: 'Icon', group: 'Color', token: 'toast/icon/foreground/{type}' } },
    { part: 'text', property: 'gap', by: [], value: 'space/xs', override: { id: 'text-gap', label: 'Title gap', group: 'Text', token: 'toast/text/gap' } },
    { part: 'title', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'title-foreground', label: 'Title', group: 'Color', token: 'toast/title/foreground' } },
    { part: 'title', property: 'text-style', by: [], value: 'Body/MD Strong', override: { id: 'title-style', label: 'Title style', group: 'Text', token: 'toast/title/text-style' } },
    { part: 'description', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'description-foreground', label: 'Description', group: 'Color', token: 'toast/description/foreground' } },
    { part: 'description', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'description-style', label: 'Description style', group: 'Text', token: 'toast/description/text-style' } },
  ],
  figmaProps: [
    { kind: 'boolean', name: 'Show icon', layers: ['content › icon'], default: true, code: 'icon' },
    { kind: 'text', name: 'Title', layers: ['content › text › title'], default: 'Message sent', code: 'title' },
    { kind: 'boolean', name: 'Show description', layers: ['content › text › description'], default: true, code: 'description' },
    { kind: 'text', name: 'Description', layers: ['content › text › description'], default: 'Your message is on its way.' },
    { kind: 'boolean', name: 'Show close', layers: ['content › close'], default: true, code: 'Toast.Close' },
    { kind: 'expose', name: 'Close', layer: 'content › close' },
  ],
  docs: {
    summary: 'A brief message about something that just happened, shown in a corner without interrupting.',
    baseUi: 'https://base-ui.com/react/components/toast',
    usage: [
      'Confirm a completed action (“Message sent”), ideally with a way to undo it.',
      'Pick the type that matches the outcome: neutral, success, warning or error (toastManager.add({ type })).',
      'Keep the title to a few words; add a description only when it helps.',
      'Create toasts with the toast manager (Toast.useToastManager().add({ title, description })).',
    ],
    dont: ['Don’t put information the user must act on in a toast; it disappears. Use Alert Dialog or an inline message.'],
    accessibility: [
      'Toasts are announced politely by screen readers as they appear.',
      'Timers pause while the pointer is over the toasts or focus is inside; F6 moves focus to them.',
    ],
  },
}
