import type { ComponentSpec } from '../../spec/types'
import { arrowBindings, arrowParts, sideAxis, surface } from '../shared/popup'

/** One size (overlays aren't sized): a single component. */
export const popoverSpec: ComponentSpec = {
  name: 'Popover',
  slug: 'popover',
  axes: [sideAxis],
  parts: [
    { id: 'root', baseUi: 'Popover.Popup', figma: '', description: 'The surface. Opens from a trigger (usually a Button) and stays until dismissed.' },
    ...arrowParts('Popover.Arrow'),
    { id: 'title', baseUi: 'Popover.Title', figma: 'title', description: 'Names the popover; announced when it opens.' },
    { id: 'description', baseUi: 'Popover.Description', figma: 'description', description: 'Supporting text.' },
    { id: 'content', figma: 'Content', element: 'root', description: 'Slot for anything else (a form, a list); off by default (in code, more children).' },
  ],
  bindings: [
    ...surface('popover', { gap: 'space/xs' }),
    ...arrowBindings('popover'),
    { part: 'title', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'title-foreground', label: 'Title', group: 'Color', token: 'popover/title/foreground' } },
    { part: 'title', property: 'text-style', by: [], value: 'Body/MD Strong', override: { id: 'title-style', label: 'Title style', group: 'Text', token: 'popover/title/text-style' } },
    { part: 'description', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'description-foreground', label: 'Description', group: 'Color', token: 'popover/description/foreground' } },
    { part: 'description', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'description-style', label: 'Description style', group: 'Text', token: 'popover/description/text-style' } },
  ],
  figmaProps: [
    { kind: 'boolean', name: 'Show arrow', layers: ['arrow'], default: true, code: 'arrow' },
    { kind: 'boolean', name: 'Show title', layers: ['title'], default: true, code: '<Popover.Title>' },
    { kind: 'text', name: 'Title', layers: ['title'], default: 'Notifications' },
    { kind: 'boolean', name: 'Show description', layers: ['description'], default: true, code: '<Popover.Description>' },
    { kind: 'text', name: 'Description', layers: ['description'], default: 'You are all caught up. Good job!' },
    { kind: 'boolean', name: 'Show content', layers: ['Content'], default: false },
    { kind: 'slot', name: 'Content', layer: 'Content', preferred: ['Button', 'Field', 'Separator'], code: 'children' },
  ],
  docs: {
    summary: 'A floating panel anchored to a trigger, for extra information or controls that don’t need a full dialog.',
    baseUi: 'https://base-ui.com/react/components/popover',
    usage: [
      'Open it from a Button; it stays until the user clicks outside, presses Escape or uses a close control.',
      'Give it a title, so it’s announced with a name.',
      'Keep it small: a few lines of text, or a short form.',
    ],
    dont: ['Don’t use it for hints on hover; use Tooltip.', 'Don’t put a long flow in it; use Dialog.'],
    accessibility: [
      'Focus moves into the popover when it opens and back to the trigger when it closes.',
      'The title and description label and describe the popup.',
    ],
  },
}
