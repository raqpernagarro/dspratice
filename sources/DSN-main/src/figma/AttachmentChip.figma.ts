// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=4533-107444
// source=src/components/atoms/Attachment/AttachmentChip/AttachmentChip.tsx
// component=AttachmentChip
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const size = instance.getEnum('Size', { Medium: 'md', Small: 'sm' })

export default {
  example: figma.code`<AttachmentChip
  fileName=${q(instance.getString('Label'))}
  fileSize=${q(instance.getString('Metadata'))}${size === 'sm' ? '\n  size="sm"' : ''}${bool('disabled', flag('Disabled'))}${bool('loading', flag('Loading'))}
/>`,
  imports: [
    "import { AttachmentChip } from 'ds-ngr'",
  ],
  id: 'attachment-chip',
  metadata: { nestable: true, props: { fileName: instance.getString('Label') } },
}
