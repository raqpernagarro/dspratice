// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8412-66648
// source=src/components/atoms/Button/ToggleButton.tsx
// component=ToggleButton
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const size = instance.getEnum('Size', { Medium: 'md', Small: 'sm' })
const label = instance.getString('Label')
const showLabel = instance.getBoolean('Show label')
const showIcon = instance.getBoolean('Show leading icon')
const icon = showIcon ? swap('Leading icon') : undefined

export default {
  example: figma.code`<ToggleButton
  size="${size}"${icon ? figma.code`
  leadingIcon={${icon}}` : ''}${showIcon ? '' : '\n  showLeadingIcon={false}'}
  label=${q(label)}${bool('showLabel', showLabel)}${bool('selected', flag('Selected'))}${bool('disabled', flag('Disabled'))}
/>`,
  imports: [
    "import { ToggleButton } from 'ds-ngr'",
  ],
  id: 'toggle-button',
  metadata: { nestable: true, props: { label } },
}
