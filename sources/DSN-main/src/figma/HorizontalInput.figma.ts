// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=5190-212002
// source=src/components/molecules/HorizontalInput/HorizontalInput.tsx
// component=HorizontalInput
import figma from 'figma'
const instance = figma.selectedInstance
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const showDescription = instance.getBoolean('Show description')
const showIcon = instance.getBoolean('Show icon')
const icon = showIcon ? swap('Icon') : undefined
const control = swap('Change input type')

export default {
  example: figma.code`<HorizontalInput
  label=${q(instance.getString('Label'))}${showDescription ? `
  showDescription${str('description', instance.getString('Description'))}` : ''}${icon ? figma.code`
  showIcon
  iconSlot={${icon}}` : ''}${instance.getEnum('State', { Default: false, Error: true }) ? '\n  error' : ''}
>
  ${control ?? ''}
</HorizontalInput>`,
  imports: [
    "import { HorizontalInput } from 'ds-ngr'",
  ],
  id: 'horizontal-input',
  metadata: { nestable: true, props: {} },
}
