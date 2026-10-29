// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=345-20068
// source=src/components/atoms/SectionHeader/SectionHeader.tsx
// component=SectionHeader
import figma from 'figma'
const instance = figma.selectedInstance
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const child = (layer: string) => {
  const node = instance.findInstance(layer)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const size = instance.getEnum('Size', { xSmall: 'xsmall', Small: 'small', Medium: 'medium', Large: 'large' })
const title = instance.getString('Title')
const description = instance.getBoolean('Show description') ? instance.getString('Description') : undefined
// Figma's leading/trailing toggles collapse into SectionHeader's two control slots.
const leading =
  (instance.getBoolean('Disclosure left') && child('disclosureLeft')) ||
  (instance.getBoolean('Checkbox') && child('Checkbox')) ||
  (instance.getBoolean('Show avatar') && child('Avatar group')) ||
  (instance.getBoolean('Show leading icon') && swap('Leading icon')) ||
  undefined
const trailing =
  (instance.getBoolean('Show switcher right') && child('Switcher')) ||
  (instance.getBoolean('Show buttons right') && child('Button group / Inline')) ||
  (instance.getBoolean('Disclosure right') && child('disclosureRight')) ||
  (instance.getBoolean('Show trailing icon') && swap('Trailing icon')) ||
  undefined

export default {
  example: figma.code`<SectionHeader
  title=${q(title)}${str('description', description)}
  size="${size}"${leading ? figma.code`
  leadingControl={${leading}}` : ''}${trailing ? figma.code`
  trailingControl={${trailing}}` : ''}
/>`,
  imports: [
    "import { SectionHeader } from 'ds-ngr'",
  ],
  id: 'section-header',
  metadata: { nestable: true, props: { title, description, size } },
}
