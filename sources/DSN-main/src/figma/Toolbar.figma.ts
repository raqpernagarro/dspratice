// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=725-48320
// source=src/components/molecules/Toolbar/Toolbar.tsx
// component=Toolbar
import figma from 'figma'
const instance = figma.selectedInstance

const size = instance.getEnum('Size', { Large: 'lg', Medium: 'md', Small: 'sm' })
const left = instance.getSlot('Left stack')
const right = instance.getSlot('Right stack')

export default {
  example: figma.code`<Toolbar
  size="${size}"${left ? figma.code`
  leftActions={<>${left}</>}` : ''}${right ? figma.code`
  rightActions={<>${right}</>}` : ''}
/>`,
  imports: [
    "import { Toolbar } from 'ds-ngr'",
  ],
  id: 'toolbar',
  metadata: { nestable: true, props: {} },
}
