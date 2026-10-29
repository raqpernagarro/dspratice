// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=19-574
// source=src/components/atoms/Button/Button.tsx
// component=Button
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
const variant = instance.getEnum('Variant', { Primary: 'primary', Secondary: 'secondary', Ghost: 'ghost', Plain: 'plain' })
const size = instance.getEnum('Size', { Medium: 'md', Small: 'sm' })
const label = instance.getString('Label')
const showLabel = instance.getBoolean('Show label')
const leading = instance.getBoolean('Show leading icon') ? swap('Leading icon') : undefined
const trailing = instance.getBoolean('Show trailing icon') ? swap('Trailing icon') : undefined
const shortcut = instance.getBoolean('Shortcut')
let shortcutLabel: string | undefined
if (shortcut) {
  const node = instance.findConnectedInstance('shortcut')
  if (node && node.type === 'INSTANCE') shortcutLabel = node.executeTemplate().metadata?.props?.label as string | undefined
}

export default {
  example: figma.code`<Button
  variant="${variant}"
  size="${size}"${bool('disabled', flag('Disabled'))}${bool('loading', flag('Loading'))}${bool('destructive', flag('Destructive'))}${leading ? figma.code`
  showLeadingIcon
  leadingIcon={${leading}}` : ''}${trailing ? figma.code`
  showTrailingIcon
  trailingIcon={${trailing}}` : ''}${shortcut ? `
  shortcut${str('shortcutLabel', shortcutLabel)}` : ''}${showLabel ? `
>
  ${label}
</Button>` : `
  showLabel={false}
  aria-label=${q(label)}
/>`}`,
  imports: [
    "import { Button } from 'ds-ngr'",
  ],
  id: 'button',
  metadata: { nestable: true, props: { label } },
}
