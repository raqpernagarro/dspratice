// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=236-8414
// source=src/components/atoms/SegmentControl/SegmentControl.tsx
// component=SegmentControl
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
// One Figma selector = one entry of SegmentControl `options`.
const label = instance.getString('Label')
const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const disabled = flag('Disabled')
const option = `{ value: '${value}', label: ${JSON.stringify(label)}${disabled ? ', disabled: true' : ''} }`

export default {
  example: figma.code`<SegmentControl options={[${option}]}${flag('Selected') ? ` defaultValue="${value}"` : ''} />`,
  imports: [
    "import { SegmentControl } from 'ds-ngr'",
  ],
  id: 'segment-control-option',
  metadata: { nestable: true, props: { option, value, selected: flag('Selected') } },
}
