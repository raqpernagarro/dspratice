// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=409-7293
// source=src/components/molecules/RichTextEditor/RichTextEditor.tsx
// component=RichTextEditor
import figma from 'figma'
const instance = figma.selectedInstance
const nested = (layer: string, prop: string) => {
  const node = instance.findInstance(layer)
  return node && node.type === 'INSTANCE' ? node.getString(prop) : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const fieldLabel = instance.getBoolean('Show label') ? nested('.inputLabel', 'Label') : undefined
const fieldHelp = instance.getBoolean('Show help text') ? nested('.inputHelpText', 'Help text label') : undefined
export default {
  example: figma.code`<RichTextEditor${str('label', fieldLabel)}${str('helperText', fieldHelp)}${instance.getBoolean('Show attachments') ? '\n  attachments={attachments}' : ''}
/>`,
  imports: [
    "import { RichTextEditor } from 'ds-ngr'",
  ],
  id: 'rich-text-editor',
  metadata: { nestable: true, props: {} },
}
