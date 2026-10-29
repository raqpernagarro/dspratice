// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8570-51697
// source=src/components/atoms/ProgressRing/ProgressRing.tsx
// component=ProgressRing
import figma from 'figma'
const instance = figma.selectedInstance

const size = instance.getEnum('Size', { Small: 'sm', Large: 'lg', xLarge: 'xl', xxLarge: 'xxl' })

export default {
  example: figma.code`<ProgressRing size="${size}" label="Loading" />`,
  imports: [
    "import { ProgressRing } from 'ds-ngr'",
  ],
  id: 'progress-ring',
  metadata: { nestable: true, props: {} },
}
