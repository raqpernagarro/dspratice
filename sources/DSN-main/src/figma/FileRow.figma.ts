// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=4540-121392
// source=src/components/atoms/Attachment/FileRow/FileRow.tsx
// component=FileRow
import figma from 'figma'
const instance = figma.selectedInstance
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const state = instance.getEnum('State', { Default: 'default', Hover: 'hover', Uploading: 'uploading' })

export default {
  example: figma.code`<FileRow
  fileName=${q(instance.getString('File name'))}
  fileType=${q(instance.getString('Type'))}
  fileSize=${q(instance.getString('Size'))}${state === 'uploading' ? '\n  state="uploading"\n  uploadProgress={40}' : ''}
/>`,
  imports: [
    "import { FileRow } from 'ds-ngr'",
  ],
  id: 'file-row',
  metadata: { nestable: true, props: {} },
}
