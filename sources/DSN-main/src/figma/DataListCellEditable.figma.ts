// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=2311-43294
// source=src/components/atoms/DataListCell/DataListCell.tsx
// component=DataListCell
import figma from 'figma'
const instance = figma.selectedInstance
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const alignment = instance.getEnum('Alignment', { Inline: 'inline', Vertical: 'vertical' })
const variant = instance.getEnum('Variant', { 'With title': 'with-title', 'Just icon': 'just-icon' })
const icon = instance.getBoolean('Show icon') ? swap('Icon') : undefined

export default {
  example: figma.code`<DataListCell
  alignment="${alignment}"
  variant="${variant}"
  title=${q(instance.getString('Title'))}
  description="Value"${icon ? figma.code`
  showIcon
  icon={${icon}}` : ''}
/>`,
  imports: [
    "import { DataListCell } from 'ds-ngr'",
  ],
  id: 'data-list-cell-editable',
  metadata: { nestable: true, props: {} },
}
