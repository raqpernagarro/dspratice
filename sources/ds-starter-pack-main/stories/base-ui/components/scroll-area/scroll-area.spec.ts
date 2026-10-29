import type { ComponentSpec } from '../../spec/types'

/** A scroll container with a slim custom scrollbar (shown while hovering or scrolling). One size. */
export const scrollAreaSpec: ComponentSpec = {
  name: 'Scroll Area',
  slug: 'scroll-area',
  axes: [],
  parts: [
    { id: 'root', baseUi: 'ScrollArea.Root', figma: '', description: 'Fixes the visible size; clips the content.' },
    { id: 'viewport', baseUi: 'ScrollArea.Viewport', figma: 'viewport', description: 'The scrolling box, with the border. Focusable, so keyboard users can scroll it.' },
    { id: 'content', baseUi: 'ScrollArea.Content', parent: 'viewport', figma: 'viewport › Content', description: 'Slot for what scrolls.' },
    { id: 'text', parent: 'content', figma: 'viewport › Content › text', description: 'Paragraphs (in code, any content).' },
    { id: 'scrollbar', baseUi: 'ScrollArea.Scrollbar', figma: 'scrollbar', description: 'The track, along the right edge (a horizontal one goes along the bottom).' },
    { id: 'thumb', baseUi: 'ScrollArea.Thumb', parent: 'scrollbar', figma: 'scrollbar › thumb', description: 'Its length shows how much is visible.' },
  ],
  bindings: [
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/lg', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'scroll-area/radius' } },
    { part: 'viewport', property: 'radius', by: [], value: 'shape/radius/lg', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'scroll-area/radius' } },
    { part: 'viewport', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'scroll-area/border-width' } },
    { part: 'viewport', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'scroll-area/border-color' } },
    { part: 'viewport', property: 'background', by: [], value: 'color/background/neutral/primary', override: { id: 'background', label: 'Background', group: 'Color', token: 'scroll-area/background' } },
    { part: 'content', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Content', token: 'scroll-area/content/space-x' } },
    { part: 'content', property: 'padding-y', by: [], value: 'space/sm', override: { id: 'space-y', label: 'Padding Y', group: 'Content', token: 'scroll-area/content/space-y' } },
    { part: 'content', property: 'gap', by: [], value: 'space/lg', override: { id: 'gap', label: 'Gap', group: 'Content', token: 'scroll-area/content/gap' } },
    { part: 'text', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'foreground', label: 'Text', group: 'Color', token: 'scroll-area/foreground' } },
    { part: 'text', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'text-style', label: 'Text style', group: 'Content', token: 'scroll-area/text-style' } },
    { part: 'scrollbar', property: 'width', by: [], value: 'space/sm', override: { id: 'scrollbar-width', label: 'Scrollbar width', group: 'Scrollbar', token: 'scroll-area/scrollbar/width' } },
    { part: 'scrollbar', property: 'padding-x', by: [], value: 'space/2xs', override: { id: 'scrollbar-space', label: 'Scrollbar inset', group: 'Scrollbar', token: 'scroll-area/scrollbar/space' } },
    { part: 'scrollbar', property: 'padding-y', by: [], value: 'space/2xs', override: { id: 'scrollbar-space', label: 'Scrollbar inset', group: 'Scrollbar', token: 'scroll-area/scrollbar/space' } },
    { part: 'thumb', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'thumb-radius', label: 'Thumb radius', group: 'Scrollbar', token: 'scroll-area/thumb/radius' } },
    { part: 'thumb', property: 'background', by: [], value: 'color/border/neutral/regular', override: { id: 'thumb', label: 'Thumb', group: 'Color', token: 'scroll-area/thumb/background' } },
  ],
  figmaProps: [{ kind: 'slot', name: 'Content', layer: 'viewport › Content', code: 'children' }],
  docs: {
    summary: 'A scrolling region with a slim, styled scrollbar that appears while hovering or scrolling.',
    baseUi: 'https://base-ui.com/react/components/scroll-area',
    usage: ['Use it for panels with a fixed height inside a page (lists, code, terms) where the native scrollbar looks out of place.'],
    dont: ['Don’t wrap a whole page in it; let the page scroll natively.'],
    accessibility: ['The native scroll behaviour is kept: wheel, touch, keyboard (the viewport is focusable) and screen readers work as usual.'],
  },
}
