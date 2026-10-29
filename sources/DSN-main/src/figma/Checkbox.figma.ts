// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8441-154815
// source=src/components/atoms/Checkbox/Checkbox.tsx
// component=Checkbox
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const showLabel = instance.getBoolean('Show label')
const leading = instance.getBoolean('Show leading icon') ? swap('Leading icon') : undefined
const trailing = instance.getBoolean('Show trailing icon') ? swap('Trailing icon') : undefined

const size = instance.getEnum('Size', { Medium: 'md', Small: 'sm' })

export default {
  example: figma.code`<Checkbox${size === 'sm' ? '\n  size="sm"' : ''}${bool('checked', flag('Selected'))}${showLabel ? str('label', instance.getString('Label')) : `\n  showLabel={false}${str('aria-label', instance.getString('Label'))}`}${instance.getBoolean('Show description') ? `\n  showDescription${str('description', instance.getString('Description'))}` : ''}${instance.getBoolean('Show description right') ? `\n  showDescriptionRight${str('descriptionRight', instance.getString('Description right'))}` : ''}${leading ? figma.code`
  showLeadingIcon
  leadingIcon={${leading}}` : ''}${trailing ? figma.code`
  showTrailingIcon
  trailingIcon={${trailing}}` : ''}${instance.getBoolean('Show avatar') ? '\n  showAvatar\n  avatarProps={{ name: \'Ana Costa\' }}' : ''}${instance.getBoolean('Show badge') ? '\n  showBadge\n  badgeCount={3}' : ''}${instance.getBoolean('Show tag') ? '\n  showTag\n  tagLabel="New"' : ''}${bool('showButtons', instance.getBoolean('Show buttons'))}${bool('showSwitcherRight', instance.getBoolean('Show switcher right'))}${instance.getBoolean('Show content') ? '' : '\n  showContent={false}'}${bool('disabled', flag('Disabled'))}
/>`,
  imports: [
    "import { Checkbox } from 'ds-ngr'",
  ],
  id: 'checkbox',
  metadata: { nestable: true, props: { label: instance.getString('Label') } },
}
