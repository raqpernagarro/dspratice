import type { ComponentSpec } from '../../spec/types'
import { arrowBindings, arrowParts, sideAxis, surface } from '../shared/popup'

export const tooltipSpec: ComponentSpec = {
  name: 'Tooltip',
  slug: 'tooltip',
  axes: [sideAxis],
  parts: [
    { id: 'root', baseUi: 'Tooltip.Popup', figma: '', description: 'The surface, with a short label. Shows on hover or keyboard focus of its trigger.' },
    ...arrowParts('Tooltip.Arrow'),
    { id: 'label', figma: 'label', element: 'root', description: 'The text (the popup’s own text in code).' },
  ],
  bindings: [
    ...surface('tooltip', { spaceX: 'space/sm', spaceY: 'space/xs' }),
    ...arrowBindings('tooltip'),
    { part: 'label', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'foreground', label: 'Text', group: 'Color', token: 'tooltip/foreground' } },
    { part: 'label', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'text-style', label: 'Text style', group: 'Text', token: 'tooltip/text-style' } },
  ],
  figmaProps: [
    { kind: 'boolean', name: 'Show arrow', layers: ['arrow'], default: true, code: 'arrow' },
    { kind: 'text', name: 'Label', layers: ['label'], default: 'Bold', code: 'children' },
  ],
  docs: {
    summary: 'A short label that appears when a control is hovered or focused, usually to name an icon button.',
    baseUi: 'https://base-ui.com/react/components/tooltip',
    usage: [
      'Name icon-only controls (Bold, Share) and show their keyboard shortcut.',
      'Keep it to a few words, with no interactive content.',
      'Wrap a group of triggers in Tooltip.Provider so moving between them shows the next tooltip at once.',
    ],
    dont: ['Don’t put essential information only in a tooltip; touch users can’t hover.', 'Don’t put links or buttons in it; use Popover.'],
    accessibility: [
      'Shows on keyboard focus as well as hover; Escape hides it.',
      'The trigger still needs its own accessible name (aria-label); the tooltip repeats it visually.',
    ],
  },
}
