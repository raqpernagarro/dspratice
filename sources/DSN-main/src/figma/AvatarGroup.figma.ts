// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=3058-116174
// source=src/components/atoms/Avatar/Avatar.tsx
// component=AvatarGroup
import figma from 'figma'
const instance = figma.selectedInstance
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const size = instance.getEnum('Size', { xxSmall: 'xxs', xSmall: 'xs', Small: 'sm' })
const showLabel = instance.getBoolean('Show label')
const label = instance.getString('Label')

export default {
  example: figma.code`<AvatarGroup
  size="${size}"
  avatars={people}${bool('showButton', instance.getBoolean('Show button'))}${showLabel ? `
  showLabel${str('label', label)}` : ''}
/>`,
  imports: [
    "import { AvatarGroup } from 'ds-ngr'",
  ],
  id: 'avatar-group',
  metadata: { nestable: true, props: {} },
}
