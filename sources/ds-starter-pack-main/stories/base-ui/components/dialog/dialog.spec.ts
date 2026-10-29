import type { Binding, ComponentSpec, FigmaProp, Part } from '../../spec/types'
import { surface } from '../shared/popup'

/** Anatomy shared by Dialog and Alert Dialog (same parts, prefixed Dialog.* / AlertDialog.*). */
export function dialogParts(ns: string): Part[] {
  return [
    { id: 'root', baseUi: `${ns}.Popup`, figma: '', description: 'The surface, centred over the page.' },
    { id: 'backdrop', baseUi: `${ns}.Backdrop`, figma: [], portal: true, description: 'Dims the page behind (code only; in Figma, place the dialog over an overlay yourself).' },
    { id: 'header', figma: 'header', description: 'Title and description.' },
    { id: 'title', baseUi: `${ns}.Title`, parent: 'header', figma: 'header › title', description: 'Names the dialog; announced when it opens.' },
    { id: 'description', baseUi: `${ns}.Description`, parent: 'header', figma: 'header › description', description: 'What the dialog is about, or what the action will do (Show description).' },
    { id: 'body', figma: 'Body', description: 'Slot for the content between header and actions: a form, a list (Show body).' },
    { id: 'actions', figma: 'Actions', description: 'Slot for the buttons, at the end; the primary action last.' },
    { id: 'action', baseUi: `${ns}.Close`, parent: 'actions', figma: 'Actions › action', instanceOf: 'Button', description: 'Button instances (a Close renders one).' },
    { id: 'close', baseUi: `${ns}.Close`, figma: 'close', instanceOf: 'Icon Button', description: 'A ghost Icon Button with a cross in the top corner (Show close; showClose in code).' },
  ]
}

/** Figma properties shared by Dialog, Alert Dialog and Drawer. */
export function dialogProps(title: string, description: string, ns: string, close: boolean): FigmaProp[] {
  return [
    { kind: 'text', name: 'Title', layers: ['header › title'], default: title, code: `<${ns}.Title>` },
    { kind: 'boolean', name: 'Show description', layers: ['header › description'], default: true, code: `<${ns}.Description>` },
    { kind: 'text', name: 'Description', layers: ['header › description'], default: description },
    { kind: 'boolean', name: 'Show close', layers: ['close'], default: close, code: 'showClose' },
    { kind: 'boolean', name: 'Show body', layers: ['Body'], default: false, code: `<${ns}.Body>` },
    { kind: 'slot', name: 'Body', layer: 'Body', preferred: ['Field', 'Fieldset', 'Scroll Area', 'Separator'], code: `<${ns}.Body>` },
    { kind: 'slot', name: 'Actions', layer: 'Actions', preferred: ['Button'], code: `<${ns}.Actions>` },
  ]
}

export function dialogBindings(slug: string): Binding[] {
  return [
    ...surface(slug, { spaceX: 'space/lg', spaceY: 'space/lg', gap: 'space/lg', background: 'color/background/surface/high', shadow: 'effect/shadow/elevation/high' }),
    { part: 'backdrop', property: 'background', by: [], value: 'color/background/overlay/regular', on: 'code', override: { id: 'backdrop', label: 'Backdrop', group: 'Color', token: `${slug}/backdrop` } },
    { part: 'header', property: 'gap', by: [], value: 'space/xs', override: { id: 'header-gap', label: 'Title gap', group: 'Text', token: `${slug}/header/gap` } },
    { part: 'title', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'title-foreground', label: 'Title', group: 'Color', token: `${slug}/title/foreground` } },
    { part: 'title', property: 'text-style', by: [], value: 'Body/LG Strong', override: { id: 'title-style', label: 'Title style', group: 'Text', token: `${slug}/title/text-style` } },
    { part: 'description', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'description-foreground', label: 'Description', group: 'Color', token: `${slug}/description/foreground` } },
    { part: 'description', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'description-style', label: 'Description style', group: 'Text', token: `${slug}/description/text-style` } },
    { part: 'body', property: 'gap', by: [], value: 'space/md', override: { id: 'body-gap', label: 'Body gap', group: 'Container', token: `${slug}/body/gap` } },
    { part: 'actions', property: 'gap', by: [], value: 'space/md', override: { id: 'actions-gap', label: 'Actions gap', group: 'Container', token: `${slug}/actions/gap` } },
  ]
}

export const dialogSpec: ComponentSpec = {
  name: 'Dialog',
  slug: 'dialog',
  axes: [],
  parts: dialogParts('Dialog'),
  bindings: dialogBindings('dialog'),
  figmaProps: dialogProps('Notifications', 'You are all caught up. Good job!', 'Dialog', true),
  docs: {
    summary: 'A window over the page for a focused task: a form, details, a decision. The page behind is inert until it closes.',
    baseUi: 'https://base-ui.com/react/components/dialog',
    usage: [
      'Give it a title that says what the task is; put the primary action last in the actions row.',
      'Close it with a Close button, Escape or a click on the backdrop.',
      'For a confirmation the user must answer, use Alert Dialog.',
    ],
    dont: ['Don’t open a dialog from a dialog.', 'Don’t use it for information the user may want to keep looking at while working; use Popover or a page.'],
    accessibility: [
      'Focus moves into the dialog and is trapped there; it returns to the trigger on close.',
      'The title and description label and describe it (role="dialog", aria-modal).',
    ],
  },
}
