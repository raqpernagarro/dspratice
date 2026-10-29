// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=4016-242608
// source=src/components/atoms/SkeletonLoading/SkeletonLoading.tsx
// component=SkeletonLoading
import figma from 'figma'
const instance = figma.selectedInstance

const type = instance.getEnum('Type', { Pill: 'pill', Avatar: 'avatar', Image: 'image', Card: 'card' })

export default {
  example: figma.code`<SkeletonLoading type="${type}" />`,
  imports: [
    "import { SkeletonLoading } from 'ds-ngr'",
  ],
  id: 'skeleton-loading',
  metadata: { nestable: true, props: {} },
}
