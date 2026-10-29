// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8586-53892
// source=src/components/atoms/UploadArea/UploadArea.tsx
// component=UploadArea
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const nested = (layer: string, prop: string) => {
  const node = instance.findInstance(layer)
  return node && node.type === 'INSTANCE' ? node.getString(prop) : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const fieldLabel = instance.getBoolean('Show label') ? nested('.inputLabel', 'Label') : undefined
const fieldHelp = instance.getBoolean('Show help text') ? nested('.inputHelpText', 'Help text label') : undefined
export default {
  example: figma.code`<UploadArea${str('label', fieldLabel)}${str('helperText', fieldHelp)}${bool('disabled', flag('Disabled'))}
  onFilesSelected={handleFiles}
/>`,
  imports: [
    "import { UploadArea } from 'ds-ngr'",
  ],
  id: 'upload-area',
  metadata: { nestable: true, props: {} },
}
