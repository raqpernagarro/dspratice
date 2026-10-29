// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8113-185712
// source=src/components/molecules/SidebarMenuSelector/SidebarMenuSelector.tsx
// component=SidebarMenuSelector
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const icon = instance.getBoolean('Show icon') ? swap('Icon') : undefined

export default {
  example: figma.code`<SidebarMenuSelector
  variant="icon"
  label="Inbox"${icon ? figma.code`
  showIcon
  icon={${icon}}` : ''}${instance.getBoolean('Show avatar') ? '\n  showAvatar\n  avatarProps={{ name: \'Ana Costa\' }}' : ''}${instance.getBoolean('Show badge') ? '\n  showBadge\n  badgeCount={3}' : ''}${bool('selected', flag('Selected'))}${bool('disabled', flag('Disabled'))}
/>`,
  imports: [
    "import { SidebarMenuSelector } from 'ds-ngr'",
  ],
  id: 'sidebar-menu-selector-icon',
  metadata: { nestable: true, props: {} },
}
