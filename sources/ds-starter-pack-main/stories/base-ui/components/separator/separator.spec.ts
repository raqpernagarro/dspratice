import type { Axis, ComponentSpec } from '../../spec/types'

/** Base UI sets data-orientation. The thickness is the height of a horizontal line, the width of a vertical one. */
const orientation: Axis = {
  id: 'orientation',
  figma: 'Orientation',
  kind: 'state',
  layout: true,
  values: [
    { code: 'horizontal', figma: 'Horizontal', css: ['[data-orientation="horizontal"]'] },
    { code: 'vertical', figma: 'Vertical', css: ['[data-orientation="vertical"]'] },
  ],
}

/** A line between groups of content: horizontal between blocks, vertical inside rows and toolbars. */
export const separatorSpec: ComponentSpec = {
  name: 'Separator',
  slug: 'separator',
  axes: [orientation],
  parts: [{ id: 'root', baseUi: 'Separator', figma: '', description: 'The line. Stretches along its container (a vertical one to the row’s height).' }],
  bindings: [
    { part: 'root', property: 'height', by: ['orientation'], exists: (v) => v.orientation === 'horizontal', value: 'size/border/regular', override: { id: 'thickness', label: 'Thickness', group: 'Line', token: 'separator/thickness' } },
    { part: 'root', property: 'width', by: ['orientation'], exists: (v) => v.orientation === 'vertical', value: 'size/border/regular', override: { id: 'thickness', label: 'Thickness', group: 'Line', token: 'separator/thickness' } },
    { part: 'root', property: 'background', by: [], value: 'color/border/neutral/subtle', override: { id: 'color', label: 'Line', group: 'Color', token: 'separator/color' } },
  ],
  docs: {
    summary: 'A thin line that separates groups of content, horizontally or vertically.',
    baseUi: 'https://base-ui.com/react/components/separator',
    usage: ['Separate groups that spacing alone doesn’t set apart (toolbar groups, link lists).', 'Set orientation="vertical" inside rows.'],
    dont: ['Don’t use it as decoration between every item; whitespace usually does the job.'],
    accessibility: ['Renders role="separator" with aria-orientation; screen readers announce it between groups.'],
  },
}
