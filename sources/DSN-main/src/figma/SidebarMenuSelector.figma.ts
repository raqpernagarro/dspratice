// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=126-6836
// source=src/components/molecules/SidebarMenuSelector/SidebarMenuSelector.tsx
// component=SidebarMenuSelector
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const showIcon = instance.getBoolean('Show icon')
const icon = showIcon ? swap('Icon') : undefined

export default {
  example: figma.code`<SidebarMenuSelector
  label=${q(instance.getString('Label'))}${icon ? figma.code`
  showIcon
  icon={${icon}}` : ''}${instance.getBoolean('Avatar') ? '\n  showAvatar\n  avatarProps={{ name: \'Ana Costa\' }}' : ''}${instance.getBoolean('Badge') ? '\n  showBadge\n  badgeCount={3}' : ''}${bool('showDisclosure', instance.getBoolean('Disclosure'))}${bool('showRightButton', instance.getBoolean('Right button'))}${bool('selected', flag('Selected'))}${bool('disabled', flag('Disabled'))}
/>`,
  imports: [
    "import { SidebarMenuSelector } from 'ds-ngr'",
  ],
  id: 'sidebar-menu-selector',
  metadata: { nestable: true, props: { label: instance.getString('Label') } },
}
