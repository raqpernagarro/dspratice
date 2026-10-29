import { bodyStyle, interactionStates, type Axis, type ComponentSpec, type VariantValues } from '../../spec/types'

/** Open on the trigger (data-panel-open); interaction states on the trigger. */
const open: Axis = {
  id: 'open',
  figma: 'Open',
  kind: 'state',
  on: 'trigger',
  values: [
    { code: 'false', figma: 'False', css: [':not([data-panel-open])'] },
    { code: 'true', figma: 'True', css: ['[data-panel-open]'] },
  ],
}

const state: Axis = { ...interactionStates(), on: 'trigger' }

function background(v: VariantValues) {
  if (v.state === 'hover') return 'color/background/interactive/subtle/hover'
  if (v.state === 'pressed') return 'color/background/interactive/subtle/pressed'
  return 'color/background/neutral/primary'
}

const text = (v: VariantValues) => (v.state === 'disabled' ? 'color/foreground/interactive/disabled' : 'color/foreground/neutral/primary')

export const collapsibleSpec: ComponentSpec = {
  name: 'Collapsible',
  slug: 'collapsible',
  axes: [open, state],
  tokenKeys: { open: (v) => (v.open === 'true' ? 'open' : 'closed') },
  parts: [
    { id: 'root', baseUi: 'Collapsible.Root', figma: '', description: 'Trigger above panel.' },
    { id: 'trigger', baseUi: 'Collapsible.Trigger', figma: 'trigger', description: 'Opens and closes the panel; looks like a secondary button.' },
    { id: 'label', figma: 'trigger › label', element: 'trigger', description: 'The trigger’s text.' },
    { id: 'icon', parent: 'trigger', figma: 'trigger › icon', description: 'A caret that turns down while open.' },
    { id: 'panel', baseUi: 'Collapsible.Panel', figma: 'Panel', description: 'The content; its height animates open and closed.' },
    { id: 'content', parent: 'panel', figma: 'Panel', description: 'Slot for the content. In code it holds the padding and gap inside the animating panel.' },
    { id: 'text', figma: 'Panel › text', element: 'content', description: 'The content’s text (in code, any content).' },
  ],
  bindings: [
    { part: 'root', property: 'gap', by: [], value: 'space/xs', override: { id: 'gap', label: 'Gap', group: 'Container', token: 'collapsible/gap' } },
    { part: 'trigger', property: 'height', by: [], value: 'size/lg', override: { id: 'height', label: 'Height', group: 'Trigger', token: 'collapsible/trigger/height' } },
    { part: 'trigger', property: 'padding-x', by: [], value: 'space/md', override: { id: 'space-x', label: 'Padding X', group: 'Trigger', token: 'collapsible/trigger/space-x' } },
    { part: 'trigger', property: 'gap', by: [], value: 'space/sm', override: { id: 'trigger-gap', label: 'Trigger gap', group: 'Trigger', token: 'collapsible/trigger/gap' } },
    { part: 'trigger', property: 'radius', by: [], value: 'shape/radius/md', override: { id: 'radius', label: 'Radius', group: 'Trigger', token: 'collapsible/trigger/radius' } },
    { part: 'trigger', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Trigger', token: 'collapsible/trigger/border-width' } },
    { part: 'trigger', property: 'background', by: ['state'], value: background, override: { id: 'background', label: 'Trigger', group: 'Color', token: 'collapsible/trigger/background/{state}' } },
    { part: 'trigger', property: 'border-color', by: ['state'], value: (v) => (v.state === 'disabled' ? 'color/border/interactive/disabled' : 'color/border/interactive/default'), override: { id: 'border-color', label: 'Trigger border', group: 'Color', token: 'collapsible/trigger/border-color/{state}' } },
    { part: 'label', property: 'foreground', by: ['state'], value: text, override: { id: 'label-foreground', label: 'Label', group: 'Color', token: 'collapsible/label/foreground/{state}' } },
    { part: 'label', property: 'text-style', by: [], value: bodyStyle('md'), override: { id: 'label-style', label: 'Label style', group: 'Trigger', token: 'collapsible/label/text-style' } },
    { part: 'icon', property: 'size', by: [], value: 'size/xs', override: { id: 'icon-size', label: 'Icon size', group: 'Trigger', token: 'collapsible/icon/size' } },
    { part: 'icon', property: 'foreground', by: ['state'], value: text, figmaLayers: ['trigger › icon › Vector'], override: { id: 'icon-foreground', label: 'Icon', group: 'Color', token: 'collapsible/icon/foreground/{state}' } },
    { part: 'content', property: 'padding-x', by: [], value: 'space/md', override: { id: 'panel-space-x', label: 'Panel padding X', group: 'Panel', token: 'collapsible/panel/space-x' } },
    { part: 'content', property: 'padding-y', by: [], value: 'space/sm', override: { id: 'panel-space-y', label: 'Panel padding Y', group: 'Panel', token: 'collapsible/panel/space-y' } },
    { part: 'content', property: 'gap', by: [], value: 'space/sm', override: { id: 'panel-gap', label: 'Panel gap', group: 'Panel', token: 'collapsible/panel/gap' } },
    { part: 'text', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'panel-foreground', label: 'Panel text', group: 'Color', token: 'collapsible/panel/foreground' } },
    { part: 'text', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'panel-style', label: 'Panel text style', group: 'Panel', token: 'collapsible/panel/text-style' } },
  ],
  figmaProps: [
    { kind: 'text', name: 'Label', layers: ['trigger › label'], default: 'Recovery keys', code: 'label' },
    { kind: 'slot', name: 'Panel', layer: 'Panel', code: 'children' },
  ],
  docs: {
    summary: 'A single section that shows or hides its content.',
    baseUi: 'https://base-ui.com/react/components/collapsible',
    usage: ['Use it for optional details (advanced settings, recovery keys) that would clutter the view.', 'For several sections, use Accordion.'],
    dont: ['Don’t hide required fields in it.'],
    accessibility: ['The trigger is a button with aria-expanded; the panel stays in the page’s find-in-page results while closed (hidden="until-found").'],
  },
}
