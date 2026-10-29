import type { Axis, ComponentSpec, FigmaProp, VariantValues } from '../../spec/types'

export type CardType = 'outline' | 'elevated'

const type: Axis = {
  id: 'type',
  figma: 'Type',
  kind: 'prop',
  values: [
    { code: 'outline', figma: 'Outline' },
    { code: 'elevated', figma: 'Elevated' },
  ],
}

const elevated = (v: VariantValues) => v.type === 'elevated'

const figmaProps: FigmaProp[] = [
  { kind: 'text', name: 'Title', layers: ['header › title'], default: 'Starter plan', code: 'title' },
  { kind: 'boolean', name: 'Show description', layers: ['header › description'], default: true, code: 'description' },
  { kind: 'text', name: 'Description', layers: ['header › description'], default: 'For small teams getting started.' },
  { kind: 'slot', name: 'Body', layer: 'Body', code: 'children' },
  { kind: 'boolean', name: 'Show footer', layers: ['Footer'], default: true, code: 'footer' },
  { kind: 'slot', name: 'Footer', layer: 'Footer', preferred: ['Button'], code: 'footer' },
]

/** A surface grouping related content: a title, a body and actions. Not part of Base UI. */
export const cardSpec: ComponentSpec = {
  name: 'Card',
  slug: 'card',
  axes: [type],
  parts: [
    { id: 'root', figma: '', description: 'The surface. Outline: a border on the page. Elevated: lifted with a shadow.' },
    { id: 'header', figma: 'header', description: 'Title and description, stacked.' },
    { id: 'title', parent: 'header', figma: 'header › title', description: 'What the card is about. A heading when you pass headingLevel.' },
    { id: 'description', parent: 'header', figma: 'header › description', description: 'One line of context (Show description).' },
    { id: 'body', figma: 'Body', description: 'Any content (children).' },
    { id: 'footer', figma: 'Footer', description: 'Actions, right-aligned (Show footer).' },
  ],
  bindings: [
    { part: 'root', property: 'background', by: ['type'], value: (v) => (elevated(v) ? 'color/background/surface/medium' : 'color/background/surface/low'), override: { id: 'background', label: 'Background', group: 'Color', token: 'card/background/{type}' } },
    { part: 'root', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'card/border-color' } },
    { part: 'root', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'card/border-width' } },
    { part: 'root', property: 'radius', by: [], value: 'shape/radius/lg', override: { id: 'radius', label: 'Radius', group: 'Container', token: 'card/radius' } },
    { part: 'root', property: 'shadow', by: ['type'], value: 'effect/shadow/elevation/low', exists: elevated },
    { part: 'root', property: 'padding-x', by: [], value: 'space/xl', override: { id: 'space-x', label: 'Padding X', group: 'Container', token: 'card/space-x' } },
    { part: 'root', property: 'padding-y', by: [], value: 'space/xl', override: { id: 'space-y', label: 'Padding Y', group: 'Container', token: 'card/space-y' } },
    { part: 'root', property: 'gap', by: [], value: 'space/lg', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'card/gap' } },
    { part: 'header', property: 'gap', by: [], value: 'space/xs', override: { id: 'header-gap', label: 'Header gap', group: 'Container', token: 'card/header/gap' } },
    { part: 'title', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'title-foreground', label: 'Title', group: 'Color', token: 'card/title/foreground' } },
    { part: 'title', property: 'text-style', by: [], value: 'Body/LG Strong', override: { id: 'title-style', label: 'Title style', group: 'Text', token: 'card/title/text-style' } },
    { part: 'description', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'description-foreground', label: 'Description', group: 'Color', token: 'card/description/foreground' } },
    { part: 'description', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'description-style', label: 'Description style', group: 'Text', token: 'card/description/text-style' } },
    { part: 'body', property: 'foreground', by: [], on: 'code', value: 'color/foreground/neutral/primary', override: { id: 'body-foreground', label: 'Body', group: 'Color', token: 'card/body/foreground' } },
    { part: 'body', property: 'text-style', by: [], on: 'code', value: 'Body/MD', override: { id: 'body-style', label: 'Body style', group: 'Text', token: 'card/body/text-style' } },
    { part: 'footer', property: 'gap', by: [], value: 'space/sm', override: { id: 'footer-gap', label: 'Actions gap', group: 'Container', token: 'card/footer/gap' } },
  ],
  figmaProps,
  docs: {
    summary: 'A surface that groups related content (a plan, a project, a person) with an optional title and actions.',
    baseUi: '',
    usage: ['Use Outline on plain pages and Elevated where cards sit on a busy or tinted background.', 'Keep one primary action per card, in the footer.'],
    dont: ['Don’t nest cards in cards.', 'Don’t make the whole card a link and also put buttons in it.'],
    accessibility: ['Pass headingLevel so the title fits the page’s heading order (a list of cards under an h2 takes headingLevel={3}).'],
  },
}
