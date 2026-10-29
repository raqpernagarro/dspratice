// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=1229-16495
// source=src/components/molecules/PopoverWrapper/PopoverWrapper.tsx
// component=PopoverWrapper
import figma from 'figma'
const instance = figma.selectedInstance
const child = (layer: string) => {
  const node = instance.findInstance(layer)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const header = instance.getBoolean('Has header') ? child('Section header') : undefined
const bottomBar = instance.getBoolean('Has bottom bar') ? child('Toolbar') : undefined
const content = instance.getSlot('slot')

export default {
  example: figma.code`<PopoverWrapper
  anchorRef={triggerRef}${header ? figma.code`
  header={${header}}` : ''}
  content={<>${content ?? 'Content'}</>}${bottomBar ? figma.code`
  bottomBar={${bottomBar}}` : ''}
/>`,
  imports: [
    "import { PopoverWrapper } from 'ds-ngr'",
  ],
  id: 'popover-wrapper',
  metadata: { nestable: true, props: {} },
}
