// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8515-41820
// source=src/components/molecules/ChipField/ChipField.tsx
// component=ChipField
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
  example: figma.code`<ChipField${str('label', fieldLabel)}${str('helperText', fieldHelp)}
  options={options}
/>`,
  imports: [
    "import { ChipField } from 'ds-ngr'",
  ],
  id: 'chip-field',
  metadata: { nestable: true, props: {} },
}
