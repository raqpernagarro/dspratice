// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8448-53918
// source=src/components/organisms/PopoverMenu/PopoverMenu.tsx
// component=PopoverMenu
import figma from 'figma'
const instance = figma.selectedInstance
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
export default {
  example: figma.code`<PopoverMenu
  variant="simple"
  anchorRef={triggerRef}
  simpleItems={items}${bool('showHeader', instance.getBoolean('Show header'))}${bool('showBottomBar', instance.getBoolean('Show bottom bar'))}
/>`,
  imports: [
    "import { PopoverMenu } from 'ds-ngr'",
  ],
  id: 'popover-menu-simple',
  metadata: { nestable: true, props: {} },
}
