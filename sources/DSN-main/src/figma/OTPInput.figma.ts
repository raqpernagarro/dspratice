// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8572-19405
// source=src/components/atoms/OTPInput/OTPInput.tsx
// component=OTPInput
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
const status = instance.getEnum('State', {
  Empty: 'idle',
  'Partially filled': 'idle',
  Verifying: 'verifying',
  Correct: 'correct',
  Error: 'error',
})

export default {
  example: figma.code`<OTPInput
  length={6}${str('label', fieldLabel)}${status === 'error' ? str('errorMessage', fieldHelp) : str('helperText', fieldHelp)}${status === 'idle' ? '' : `\n  status="${status}"`}${bool('disabled', flag('Disabled'))}
/>`,
  imports: [
    "import { OTPInput } from 'ds-ngr'",
  ],
  id: 'otp-input',
  metadata: { nestable: true, props: {} },
}
