// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=6006-357608
// source=src/components/atoms/Separator/Separator.tsx
// component=Separator
import figma from 'figma'
const instance = figma.selectedInstance

const direction = instance.getEnum('Direction', { Vertical: 'vertical', Horizontal: 'horizontal' })

export default {
  example: figma.code`<Separator direction="${direction}" />`,
  imports: [
    "import { Separator } from 'ds-ngr'",
  ],
  id: 'separator',
  metadata: { nestable: true, props: {} },
}
