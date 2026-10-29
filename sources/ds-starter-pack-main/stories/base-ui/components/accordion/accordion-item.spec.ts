import { bodyStyle, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

/** Open on the item (data-open); hover / disabled on its trigger (Base UI sets data-disabled there). */
const open: Axis = {
  id: 'open',
  figma: 'Open',
  kind: 'state',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-open])'] },
    { code: 'true', figma: 'True', css: ['[data-open]'] },
  ],
}

const state: Axis = {
  id: 'state',
  figma: 'State',
  kind: 'state',
  on: 'trigger',
  values: [
    { code: 'default', figma: 'Default' },
    { code: 'hover', figma: 'Hover', css: [':hover:not([data-disabled])', '[data-preview-state="hover"]'] },
    { code: 'disabled', figma: 'Disabled', css: ['[data-disabled]'] },
  ],
}

const text = (v: VariantValues) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary')

export const accordionItemSpec: ComponentSpec = {
  name: 'Accordion Item',
  slug: 'accordion-item',
  dir: 'accordion',
  axes: [open, state],
  tokenKeys: { open: (v) => (v.open === 'true' ? 'open' : 'closed') },
  parts: [
    { id: 'root', baseUi: 'Accordion.Item', figma: '', description: 'One section. A line separates it from the one above (not on the first).' },
    { id: 'divider', figma: 'divider', element: 'root', description: 'The line above the item (its top border in code; Show divider in Figma, off for the first item).' },
    { id: 'trigger', baseUi: 'Accordion.Header › Accordion.Trigger', figma: 'trigger', description: 'The heading button that opens and closes the panel.' },
    { id: 'label', figma: 'trigger › label', element: 'trigger', description: 'The heading text.' },
    { id: 'icon', parent: 'trigger', figma: 'trigger › icon', description: 'A plus that turns into a cross while open.' },
    { id: 'panel', baseUi: 'Accordion.Panel', figma: 'Panel', description: 'The content; its height animates open and closed.' },
    { id: 'content', parent: 'panel', figma: 'Panel', description: 'Slot for the content. In code it holds the padding inside the animating panel.' },
    { id: 'text', figma: 'Panel › text', element: 'content', description: 'The content’s text (in code, any content).' },
  ],
  bindings: [
    { part: 'root', property: 'border-top-width', by: [], on: 'code', value: 'size/border/regular', override: { id: 'divider-width', label: 'Divider width', group: 'Container', token: 'accordion-item/divider/width' } },
    { part: 'root', property: 'border-color', by: [], on: 'code', value: 'color/border/neutral/subtle', override: { id: 'divider', label: 'Divider', group: 'Color', token: 'accordion-item/divider/color' } },
    { part: 'divider', property: 'height', by: [], on: 'figma', value: 'size/border/regular', override: { id: 'divider-width', label: 'Divider width', group: 'Container', token: 'accordion-item/divider/width' } },
    { part: 'divider', property: 'background', by: [], on: 'figma', value: 'color/border/neutral/subtle', override: { id: 'divider', label: 'Divider', group: 'Color', token: 'accordion-item/divider/color' } },
    { part: 'trigger', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Trigger', token: 'accordion-item/trigger/space-x' } },
    { part: 'trigger', property: 'padding-y', by: [], value: 'space/sm', override: { id: 'space-y', label: 'Padding Y', group: 'Trigger', token: 'accordion-item/trigger/space-y' } },
    { part: 'trigger', property: 'gap', by: [], value: 'space/lg', override: { id: 'gap', label: 'Gap', group: 'Trigger', token: 'accordion-item/trigger/gap' } },
    { part: 'trigger', property: 'background', by: ['state'], value: (v) => (v.state === 'hover' ? 'color/background/interactive/subtle/hover' : 'color/background/interactive/subtle/default'), override: { id: 'trigger-background', label: 'Trigger', group: 'Color', token: 'accordion-item/trigger/background/{state}' } },
    { part: 'label', property: 'foreground', by: ['state'], value: text, override: { id: 'label-foreground', label: 'Heading', group: 'Color', token: 'accordion-item/label/foreground/{state}' } },
    { part: 'label', property: 'text-style', by: [], value: bodyStyle('md'), override: { id: 'label-style', label: 'Heading style', group: 'Trigger', token: 'accordion-item/label/text-style' } },
    { part: 'icon', property: 'size', by: [], value: 'size/xs', override: { id: 'icon-size', label: 'Icon size', group: 'Trigger', token: 'accordion-item/icon/size' } },
    { part: 'icon', property: 'foreground', by: ['state'], value: text, figmaLayers: ['trigger › icon › Vector'], override: { id: 'icon-foreground', label: 'Icon', group: 'Color', token: 'accordion-item/icon/foreground/{state}' } },
    { part: 'content', property: 'padding-x', by: [], value: 'space/md', override: { id: 'panel-space-x', label: 'Panel padding X', group: 'Panel', token: 'accordion-item/panel/space-x' } },
    { part: 'content', property: 'padding-y', by: [], value: 'space/sm', override: { id: 'panel-space-y', label: 'Panel padding Y', group: 'Panel', token: 'accordion-item/panel/space-y' } },
    { part: 'text', property: 'foreground', by: [], value: 'color/foreground/neutral/secondary', override: { id: 'panel-foreground', label: 'Panel text', group: 'Color', token: 'accordion-item/panel/foreground' } },
    { part: 'text', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'panel-style', label: 'Panel text style', group: 'Panel', token: 'accordion-item/panel/text-style' } },
  ],
  figmaProps: [
    { kind: 'text', name: 'Title', layers: ['trigger › label'], default: 'What is Base UI?', code: 'title' },
    { kind: 'boolean', name: 'Show divider', layers: ['divider'], default: true },
    { kind: 'slot', name: 'Panel', layer: 'Panel', code: 'children' },
  ],
  docs: {
    summary: 'One section of an Accordion: a heading that opens and closes its content.',
    baseUi: 'https://base-ui.com/react/components/accordion',
    usage: ['Write headings that tell the user what’s inside (questions work well for FAQs).'],
    dont: ['Don’t hide content the user needs to complete the task in a closed item.'],
    accessibility: ['The trigger is a button inside a heading (Accordion.Header renders an h3); aria-expanded reflects the state.'],
  },
}
