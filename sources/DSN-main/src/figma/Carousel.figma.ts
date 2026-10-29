// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=9650-333831
// source=src/components/molecules/Carousel/Carousel.tsx
// component=Carousel
import figma from 'figma'
const instance = figma.selectedInstance
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const shape = instance.getEnum('Shape', { Rectangle: 'rectangle', Rounded: 'rounded' })
const index = instance.getEnum('Position', { First: 0, Middle: 3, Last: 7 })

export default {
  example: figma.code`<Carousel
  label="Product photos"${shape === 'rounded' ? '\n  shape="rounded"' : ''}${index ? `\n  defaultIndex={${index}}` : ''}${instance.getBoolean('Show counter') ? '' : '\n  showCounter={false}'}${bool('showDots', instance.getBoolean('Show dots'))}${bool('showThumbnails', instance.getBoolean('Show thumbnails'))}
>
  {photos.map((photo) => (
    <CarouselSlide key={photo.src} thumbnailSrc={photo.src}>
      <img src={photo.src} alt={photo.alt} />
    </CarouselSlide>
  ))}
</Carousel>`,
  imports: [
    "import { Carousel } from 'ds-ngr'",
    "import { CarouselSlide } from 'ds-ngr'",
  ],
  id: 'carousel',
  metadata: { nestable: true, props: {} },
}
