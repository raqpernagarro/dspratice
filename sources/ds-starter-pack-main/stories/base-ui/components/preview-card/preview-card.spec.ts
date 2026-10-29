import type { ComponentSpec } from '../../spec/types'
import { arrowBindings, arrowParts, sideAxis, surface } from '../shared/popup'

export const previewCardSpec: ComponentSpec = {
  name: 'Preview Card',
  slug: 'preview-card',
  axes: [sideAxis],
  parts: [
    { id: 'root', baseUi: 'PreviewCard.Popup', figma: '', description: 'The surface. Opens when a link (PreviewCard.Trigger) is hovered or focused.' },
    ...arrowParts('PreviewCard.Arrow'),
    { id: 'image', figma: 'image', description: 'Optional picture. Its background shows while it loads.' },
    { id: 'title', figma: 'title', description: 'What the link points to.' },
    { id: 'summary', figma: 'summary', description: 'A sentence or two about it.' },
  ],
  bindings: [
    ...surface('preview-card', { spaceX: 'space/sm', spaceY: 'space/sm', gap: 'space/sm' }),
    ...arrowBindings('preview-card'),
    { part: 'image', property: 'background', by: [], value: 'color/background/neutral/tertiary', override: { id: 'image-background', label: 'Image placeholder', group: 'Color', token: 'preview-card/image/background' } },
    { part: 'image', property: 'radius', by: [], value: 'shape/radius/md', override: { id: 'image-radius', label: 'Image radius', group: 'Image', token: 'preview-card/image/radius' } },
    { part: 'title', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'title-foreground', label: 'Title', group: 'Color', token: 'preview-card/title/foreground' } },
    { part: 'title', property: 'text-style', by: [], value: 'Body/MD Strong', override: { id: 'title-style', label: 'Title style', group: 'Text', token: 'preview-card/title/text-style' } },
    { part: 'summary', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'summary-foreground', label: 'Summary', group: 'Color', token: 'preview-card/summary/foreground' } },
    { part: 'summary', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'summary-style', label: 'Summary style', group: 'Text', token: 'preview-card/summary/text-style' } },
  ],
  figmaProps: [
    { kind: 'boolean', name: 'Show arrow', layers: ['arrow'], default: true, code: 'arrow' },
    { kind: 'boolean', name: 'Show image', layers: ['image'], default: true, code: '<PreviewCard.Image>' },
    { kind: 'text', name: 'Title', layers: ['title'], default: 'Typography' },
    { kind: 'text', name: 'Summary', layers: ['summary'], default: 'The art and science of arranging type to make written language clear and appealing.' },
  ],
  docs: {
    summary: 'A preview of a link’s destination, shown while the link is hovered or focused.',
    baseUi: 'https://base-ui.com/react/components/preview-card',
    usage: [
      'Use it on links to people, documents or pages where a glance saves a click.',
      'Keep it read-only: a picture, a title and a short summary.',
    ],
    dont: ['Don’t put actions in it; it closes when the pointer leaves.', 'Don’t use it on buttons; use Tooltip or Popover.'],
    accessibility: [
      'It’s a visual extra: the link must make sense without it.',
      'Opens on keyboard focus too, after a short delay.',
    ],
  },
}
