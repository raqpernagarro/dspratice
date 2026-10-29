// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=4529-112526
// source=src/components/atoms/Attachment/AttachmentCard/AttachmentCard.tsx
// component=AttachmentCard
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const variant = instance.getEnum('Variant', { Picture: 'picture', File: 'file' })
const position = instance.getEnum('Description position', { Inside: 'inside', Outside: 'outside' })
const hasMetadata = instance.getBoolean('Has metadata')

export default {
  example: figma.code`<AttachmentCard
  variant="${variant}"
  descriptionPosition="${position}"
  title=${q(instance.getString('Title'))}${hasMetadata ? `\n  hasMetadata${str('metaData', instance.getString('Metadata'))}` : ''}${bool('showDescription', instance.getBoolean('Show description'))}${bool('showActionOnHover', instance.getBoolean('Show button on hover'))}${bool('loading', flag('Loading'))}${variant === 'picture' ? '\n  imageSrc={imageUrl}' : ''}
/>`,
  imports: [
    "import { AttachmentCard } from 'ds-ngr'",
  ],
  id: 'attachment-card',
  metadata: { nestable: true, props: {} },
}
