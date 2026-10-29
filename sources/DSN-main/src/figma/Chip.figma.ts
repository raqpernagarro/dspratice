// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=1544-19006
// source=src/components/atoms/Chip/Chip.tsx
// component=Chip
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
const showLeading = instance.getBoolean('Show leading icon')
const showTrailing = instance.getBoolean('Show trailing icon')
const leading = showLeading ? swap('Leading icon') : undefined
const trailing = showTrailing ? swap('Trailing icon') : undefined

export default {
  example: figma.code`<Chip
  label=${q(label)}
  size="${size}"${leading ? figma.code`
  leadingIcon={${leading}}` : ''}${showLeading ? '' : '\n  showLeadingIcon={false}'}${trailing ? figma.code`
  trailingIcon={${trailing}}` : ''}${showTrailing ? '' : '\n  showTrailingIcon={false}'}${instance.getBoolean('Show label') ? '' : '\n  showLabel={false}'}${instance.getBoolean('Show avatar') ? '\n  showAvatar\n  avatars={people}' : ''}${bool('selected', flag('Selected'))}${bool('disabled', flag('Disabled'))}
  onClick={toggle}
/>`,
  imports: [
    "import { Chip } from 'ds-ngr'",
  ],
  id: 'chip',
  metadata: { nestable: true, props: { label } },
}
