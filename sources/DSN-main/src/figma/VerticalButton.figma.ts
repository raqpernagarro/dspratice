// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=107-87
// source=src/components/atoms/Button/VerticalButton.tsx
// component=VerticalButton
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const variant = instance.getEnum('Variant', { Primary: 'primary', Secondary: 'secondary', Ghost: 'ghost' })
const size = instance.getEnum('Size', { Medium: 'md', Small: 'sm' })
const label = instance.getString('Label')
const icon = swap('Icon')

export default {
  example: figma.code`<VerticalButton
  variant="${variant}"
  size="${size}"${icon ? figma.code`
  icon={${icon}}` : ''}${bool('badge', instance.getBoolean('Badge'))}${bool('disabled', flag('Disabled'))}${bool('loading', flag('Loading'))}${instance.getBoolean('Show label') ? '' : '\n  showLabel={false}'}
>
  ${label}
</VerticalButton>`,
  imports: [
    "import { VerticalButton } from 'ds-ngr'",
  ],
  id: 'vertical-button',
  metadata: { nestable: true, props: { label } },
}
