// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=242-8752
// source=src/components/atoms/SegmentControl/SegmentControl.tsx
// component=SegmentControl
import figma from 'figma'
const instance = figma.selectedInstance

const options: string[] = []
let selected: string | undefined
for (const node of instance.findConnectedInstances((n) => n.codeConnectId() === 'segment-control-option')) {
  if (node.type !== 'INSTANCE') continue
  const props = node.executeTemplate().metadata?.props ?? {}
  options.push(props.option as string)
  if (props.selected) selected = props.value as string
}

export default {
  example: figma.code`<SegmentControl
  options={[
    ${options.join(',\n    ')},
  ]}${selected ? `\n  defaultValue="${selected}"` : ''}
/>`,
  imports: [
    "import { SegmentControl } from 'ds-ngr'",
  ],
  id: 'segment-control',
  metadata: { nestable: true, props: {} },
}
