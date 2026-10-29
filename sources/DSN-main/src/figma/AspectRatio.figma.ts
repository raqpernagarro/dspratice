// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=9647-51145
// source=src/components/atoms/AspectRatio/AspectRatio.tsx
// component=AspectRatio
import figma from 'figma'
const instance = figma.selectedInstance

const ratio = instance.getEnum('Ratio', {
  '1:1': '1:1',
  '4:3': '4:3',
  '3:2': '3:2',
  '16:9': '16:9',
  '21:9': '21:9',
  '3:4': '3:4',
  '9:16': '9:16',
})
const shape = instance.getEnum('Shape', { Rectangle: 'rectangle', Rounded: 'rounded', Ellipse: 'ellipse' })
const content = instance.getSlot('Content')

export default {
  example: figma.code`<AspectRatio ratio="${ratio}" shape="${shape}">
  ${content ?? '<img src={imageUrl} alt="" />'}
</AspectRatio>`,
  imports: [
    "import { AspectRatio } from 'ds-ngr'",
  ],
  id: 'aspect-ratio',
  metadata: { nestable: true, props: {} },
}
