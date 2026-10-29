import type { ComponentSpec, FigmaProp } from '../../spec/types'

const figmaProps: FigmaProp[] = [
  { kind: 'boolean', name: 'Show icon', layers: ['icon'], default: true, code: 'icon' },
  { kind: 'text', name: 'Title', layers: ['text › title'], default: 'No projects yet', code: 'title' },
  { kind: 'boolean', name: 'Show description', layers: ['text › description'], default: true, code: 'description' },
  { kind: 'text', name: 'Description', layers: ['text › description'], default: 'Create a project to start designing with the system.' },
  { kind: 'slot', name: 'Actions', layer: 'Actions', preferred: ['Button'], code: 'actions' },
]

/** What a view shows when it has nothing to show yet. Not part of Base UI. */
export const emptyStateSpec: ComponentSpec = {
  name: 'Empty State',
  slug: 'empty-state',
  axes: [],
  parts: [
    { id: 'root', figma: '', description: 'Centered column: icon, text, actions.' },
    { id: 'icon', figma: 'icon', description: 'A soft circle with an icon that hints at what belongs here (Show icon).' },
    { id: 'glyph', parent: 'icon', figma: 'icon › glyph', description: 'The icon itself.' },
    { id: 'text', figma: 'text', description: 'Title and description.' },
    { id: 'title', parent: 'text', figma: 'text › title', description: 'What’s missing, in a few words. A heading when you pass headingLevel.' },
    { id: 'description', parent: 'text', figma: 'text › description', description: 'Why it’s empty and what to do next (Show description).' },
    { id: 'actions', figma: 'Actions', description: 'The way out: usually one primary Button.' },
  ],
  bindings: [
    { part: 'root', property: 'padding-x', by: [], value: 'space/2xl', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'empty-state/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/3xl', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'empty-state/space-y' } },
    { part: 'root', property: 'gap', by: [], value: 'space/lg', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'empty-state/gap' } },
    { part: 'icon', property: 'size', by: [], value: 'size/xl', override: { id: 'icon-size', label: 'Icon circle', group: 'Icon', token: 'empty-state/icon/size' } },
    { part: 'icon', property: 'radius', by: [], value: 'shape/radius/full', override: { id: 'icon-radius', label: 'Icon radius', group: 'Icon', token: 'empty-state/icon/radius' } },
    { part: 'icon', property: 'background', by: [], value: 'color/background/neutral/tertiary', override: { id: 'icon-background', label: 'Icon background', group: 'Icon', token: 'empty-state/icon/background' } },
    { part: 'glyph', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', figmaLayers: ['icon › glyph › Vector'], override: { id: 'icon-foreground', label: 'Icon', group: 'Icon', token: 'empty-state/icon/foreground' } },
    { part: 'glyph', property: 'size', by: [], value: 'size/sm', override: { id: 'glyph-size', label: 'Icon size', group: 'Icon', token: 'empty-state/glyph/size' } },
    { part: 'text', property: 'gap', by: [], value: 'space/xs', override: { id: 'text-gap', label: 'Text gap', group: 'Container', token: 'empty-state/text/gap' } },
    { part: 'title', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'title-foreground', label: 'Title', group: 'Color', token: 'empty-state/title/foreground' } },
    { part: 'title', property: 'text-style', by: [], value: 'Body/LG Strong', override: { id: 'title-style', label: 'Title style', group: 'Text', token: 'empty-state/title/text-style' } },
    { part: 'description', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'description-foreground', label: 'Description', group: 'Color', token: 'empty-state/description/foreground' } },
    { part: 'description', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'description-style', label: 'Description style', group: 'Text', token: 'empty-state/description/text-style' } },
    { part: 'actions', property: 'gap', by: [], value: 'space/sm', override: { id: 'actions-gap', label: 'Actions gap', group: 'Container', token: 'empty-state/actions/gap' } },
  ],
  figmaProps,
  docs: {
    summary: 'What a list, table or page shows when it has nothing in it yet, with a way forward.',
    baseUi: '',
    usage: ['Say what’s missing and what to do about it; offer that action as a Button.', 'For "no search results", suggest changing the search instead of creating something.'],
    dont: ['Don’t leave a view blank: an empty table with only headers looks broken.', 'Don’t use it for errors; say what went wrong and how to retry.'],
    accessibility: ['The icon is decorative (hidden from screen readers). Pass headingLevel when the title should be part of the page’s headings.'],
  },
}
