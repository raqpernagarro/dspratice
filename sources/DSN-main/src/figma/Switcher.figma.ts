// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=204-18242
// source=src/components/atoms/Switcher/Switcher.tsx
// component=Switcher
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const size = instance.getEnum('Size', { Medium: 'md', Small: 'sm' })
const showLabel = instance.getBoolean('Show label')
const showIcon = instance.getBoolean('Show icon')
const icon = showIcon ? swap('Icon') : undefined

export default {
  example: figma.code`<Switcher
  checked={${flag('Selected') ? 'true' : 'false'}}
  onChange={setChecked}
  size="${size}"${bool('disabled', flag('Disabled'))}${showLabel ? `
  showLabel${str('label', instance.getString('Label'))}` : ''}${icon ? figma.code`
  showIcon
  icon={${icon}}` : ''}
  aria-label="Toggle setting"
/>`,
  imports: [
    "import { Switcher } from 'ds-ngr'",
  ],
  id: 'switcher',
  metadata: { nestable: true, props: {} },
}
