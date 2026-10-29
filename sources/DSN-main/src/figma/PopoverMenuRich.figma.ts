// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8567-27319
// source=src/components/organisms/PopoverMenu/PopoverMenu.tsx
// component=PopoverMenu
import figma from 'figma'

export default {
  example: figma.code`<PopoverMenu
  variant="rich"
  anchorRef={triggerRef}
  title="Filters"
  showSearch
  choiceLists={choiceLists}
/>`,
  imports: [
    "import { PopoverMenu } from 'ds-ngr'",
  ],
  id: 'popover-menu-rich',
  metadata: { nestable: true, props: {} },
}
