// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=409-9847
// source=src/components/atoms/Select/Select.tsx
// component=Select
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
const state = instance.getEnum('State', { Default: 'empty', Hover: 'empty', Pressed: 'open', Focused: 'empty', Error: 'error' })
const value = instance.getString('Value')
const leading = instance.getBoolean('Show leading icon') ? swap('Leading icon') : undefined
// Show avatar / Show remove button / Show tag have no Select equivalent.

export default {
  example: figma.code`<Select${str('label', fieldLabel)}${state === 'error' ? `\n  error${str('errorMessage', fieldHelp)}` : str('helperText', fieldHelp)}${bool('disabled', flag('Disabled'))}${str('placeholder', value)}
  options={options}${leading ? figma.code`
  leadingIcon={${leading}}` : ''}${state === 'open' ? '\n  defaultOpen' : ''}
/>`,
  imports: [
    "import { Select } from 'ds-ngr'",
  ],
  id: 'select',
  metadata: { nestable: true, props: {} },
}
