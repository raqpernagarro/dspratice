// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8949-22777
// source=src/components/organisms/Card/Card.tsx
// component=Card
import figma from 'figma'
const instance = figma.selectedInstance
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const header = instance.findInstance('Section header')
const title = header && header.type === 'INSTANCE' ? header.getString('Title') : 'Title'

const variant = instance.getEnum('Variant', {
  'Header and bottom bar': 'both',
  'Just header': 'header',
  'Just bottom bar': 'bottom',
  'Just content': 'content',
})
const showHeader = variant === 'both' || variant === 'header'
const showBottomBar = variant === 'both' || variant === 'bottom'
const content = swap('Swap content')

export default {
  example: figma.code`<Card${showHeader ? str('title', title) : '\n  showHeader={false}'}${showBottomBar ? '\n  showBottomBar' : ''}>
  ${content ?? 'Content'}
</Card>`,
  imports: [
    "import { Card } from 'ds-ngr'",
  ],
  id: 'card',
  metadata: { nestable: true, props: {} },
}
