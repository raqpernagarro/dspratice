// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8784-10454
// source=src/components/organisms/Drawer/Drawer.tsx
// component=Drawer
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

const variant = instance.getEnum('Variant', { Overlay: 'overlay', 'Stack with content': 'stacked' })
const content = swap('Replace content')

export default {
  example: figma.code`<Drawer
  variant="${variant}"
  open={open}
  onClose={close}${instance.getBoolean('Has header') ? str('title', title) : '\n  showHeader={false}'}${instance.getBoolean('Has bottom bar') ? '\n  showBottomBar' : ''}
>
  ${content ?? 'Content'}
</Drawer>`,
  imports: [
    "import { Drawer } from 'ds-ngr'",
  ],
  id: 'drawer',
  metadata: { nestable: true, props: {} },
}
