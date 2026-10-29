// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=1613-49241
// source=src/components/atoms/NumberInput/NumberInput.tsx
// component=NumberInput
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const nested = (layer: string, prop: string) => {
  const node = instance.findInstance(layer)
  return node && node.type === 'INSTANCE' ? node.getString(prop) : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const fieldLabel = instance.getBoolean('Show label') ? nested('.inputLabel', 'Label') : undefined
const fieldHelp = instance.getBoolean('Show help text') ? nested('.inputHelpText', 'Help text label') : undefined
const state = instance.getEnum('State', { Empty: 'empty', Hover: 'empty', Active: 'filled', Filled: 'filled', Focused: 'empty', Error: 'error' })
const value = instance.getString('Value')
const icon = instance.getBoolean('Show icon') ? swap('Icon') : undefined
const numeric = /^-?\d+(\.\d+)?$/.test(value)

export default {
  example: figma.code`<NumberInput${str('label', fieldLabel)}${state === 'error' ? `\n  error${str('errorMessage', fieldHelp)}` : str('helperText', fieldHelp)}${bool('disabled', flag('Disabled'))}${numeric && state !== 'empty' ? `\n  defaultValue={${value}}` : str('placeholder', value)}${icon ? figma.code`
  leadingIcon={${icon}}` : ''}
/>`,
  imports: [
    "import { NumberInput } from 'ds-ngr'",
  ],
  id: 'number-input',
  metadata: { nestable: true, props: {} },
}
