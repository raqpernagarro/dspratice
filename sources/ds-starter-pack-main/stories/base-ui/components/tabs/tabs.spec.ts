import { sizes, type ComponentSpec } from '../../spec/types'

/**
 * The list of Tabs, the indicator behind the selected one (a folder tab joined to the panel) and the
 * panel. The size goes to the tabs; the panel is the same in every size.
 */
export const tabsSpec: ComponentSpec = {
  name: 'Tabs',
  slug: 'tabs',
  dir: 'tabs',
  axes: [sizes()],
  parts: [
    { id: 'root', baseUi: 'Tabs.Root', figma: '', description: 'List above panel; the list overlaps the panel’s top border by its width.' },
    { id: 'list', baseUi: 'Tabs.List', figma: 'List', description: 'Slot for the Tabs.' },
    { id: 'tab', figma: 'List › tab', instanceOf: 'Tab', description: 'Tab instances.' },
    { id: 'indicator', baseUi: 'Tabs.Indicator', parent: 'list', figma: [], description: 'Code only: slides behind the selected tab (surface, border on three sides, top corners rounded). In Figma the selected Tab draws it.' },
    { id: 'panel', baseUi: 'Tabs.Panel', figma: 'Panel', description: 'Slot for the selected tab’s content.' },
    { id: 'text', figma: 'Panel › text', element: 'panel', description: 'The panel’s text (in code, any content).' },
  ],
  bindings: [
    { part: 'list', property: 'gap', by: [], value: 'space/xs', override: { id: 'gap', label: 'Gap', group: 'List', token: 'tabs/gap' } },
    { part: 'indicator', property: 'radius-top', by: [], on: 'code', value: 'shape/radius/md', override: { id: 'indicator-radius', label: 'Indicator radius', group: 'Indicator', token: 'tabs/indicator/radius' } },
    { part: 'indicator', property: 'border-top-width', by: [], on: 'code', value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'tabs/border-width' } },
    { part: 'indicator', property: 'border-left-width', by: [], on: 'code', value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'tabs/border-width' } },
    { part: 'indicator', property: 'border-right-width', by: [], on: 'code', value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'tabs/border-width' } },
    { part: 'indicator', property: 'border-color', by: [], on: 'code', value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'tabs/border-color' } },
    { part: 'indicator', property: 'background', by: [], on: 'code', value: 'color/background/neutral/primary', override: { id: 'background', label: 'Surface', group: 'Color', token: 'tabs/background' } },
    { part: 'panel', property: 'padding-x', by: [], value: 'space/lg', override: { id: 'panel-space-x', label: 'Panel padding X', group: 'Panel', token: 'tabs/panel/space-x' } },
    { part: 'panel', property: 'padding-y', by: [], value: 'space/lg', override: { id: 'panel-space-y', label: 'Panel padding Y', group: 'Panel', token: 'tabs/panel/space-y' } },
    { part: 'panel', property: 'radius', by: [], value: 'shape/radius/lg', override: { id: 'panel-radius', label: 'Panel radius', group: 'Panel', token: 'tabs/panel/radius' } },
    { part: 'panel', property: 'border-width', by: [], value: 'size/border/regular', override: { id: 'border-width', label: 'Border width', group: 'Container', token: 'tabs/border-width' } },
    { part: 'panel', property: 'border-color', by: [], value: 'color/border/neutral/subtle', override: { id: 'border-color', label: 'Border', group: 'Color', token: 'tabs/border-color' } },
    { part: 'panel', property: 'background', by: [], value: 'color/background/neutral/primary', override: { id: 'background', label: 'Surface', group: 'Color', token: 'tabs/background' } },
    { part: 'text', property: 'foreground', by: [], value: 'color/foreground/neutral/primary', override: { id: 'panel-foreground', label: 'Panel text', group: 'Color', token: 'tabs/panel/foreground' } },
    { part: 'text', property: 'text-style', by: [], value: 'Body/MD', override: { id: 'panel-style', label: 'Panel text style', group: 'Panel', token: 'tabs/panel/text-style' } },
  ],
  figmaProps: [
    { kind: 'slot', name: 'List', layer: 'List', preferred: ['Tab'], code: '<Tabs.Tab>…' },
    { kind: 'slot', name: 'Panel', layer: 'Panel', preferred: ['Field', 'Button', 'Scroll Area'], code: '<Tabs.Panel>' },
  ],
  docs: {
    summary: 'Switches between views of related content, one panel at a time.',
    baseUi: 'https://base-ui.com/react/components/tabs',
    usage: [
      'Use tabs for peer views of the same thing (an item’s Overview, Activity, Settings).',
      'Keep the number of tabs small (2–6); the selected tab joins its panel.',
      'Match the size to the surrounding controls.',
    ],
    dont: ['Don’t use tabs for steps in a sequence; use a stepper or a form.', 'Don’t nest tabs.'],
    accessibility: [
      'Renders a tablist; each tab controls its panel (aria-controls), and the panel is labelled by its tab.',
      'Arrow keys move focus along the list; selection follows focus unless activateOnFocus is off.',
    ],
  },
}
