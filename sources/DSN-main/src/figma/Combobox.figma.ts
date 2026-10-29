// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8822-61813
// source=src/components/atoms/Combobox/Combobox.tsx
// component=Combobox
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
const state = instance.getEnum('State', { Filled: 'filled', Error: 'error', Hover: 'empty', Focused: 'empty', Active: 'open', Empty: 'empty' })
const value = instance.getString('Value')

export default {
  example: figma.code`<Combobox${str('label', fieldLabel)}${state === 'error' ? `\n  error${str('errorMessage', fieldHelp)}` : str('helperText', fieldHelp)}${bool('disabled', flag('Disabled'))}${str('placeholder', value)}
  options={options}${bool('showClearButton', instance.getBoolean('Show clear button'))}${state === 'open' ? '\n  defaultOpen' : ''}
/>`,
  imports: [
    "import { Combobox } from 'ds-ngr'",
  ],
  id: 'combobox',
  metadata: { nestable: true, props: {} },
}
