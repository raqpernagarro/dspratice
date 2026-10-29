// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=111-5684
// source=src/components/atoms/Avatar/Avatar.tsx
// component=Avatar
import figma from 'figma'
const instance = figma.selectedInstance
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const size = instance.getEnum('Size', {
  xxSmall: 'xxs',
  xSmall: 'xs',
  Small: 'sm',
  Medium: 'md',
  Large: 'lg',
  xLarge: 'xl',
  xxLarge: 'xxl',
})
const variant = instance.getEnum('Variant', { Organization: 'organization', Profile: 'profile' })
const fill = instance.getEnum('Fill', { Initials: 'initials', Picture: 'picture', Icon: 'icon' })
const initials = instance.getString('Initials')

export default {
  example: figma.code`<Avatar
  size="${size}"
  variant="${variant}"
  fill="${fill}"${fill === 'initials' ? str('initials', initials) : ''}${fill === 'picture' ? '\n  src={imageUrl}' : ''}
  name="Ana Costa"
/>`,
  imports: [
    "import { Avatar } from 'ds-ngr'",
  ],
  id: 'avatar',
  metadata: { nestable: true, props: { initials } },
}
