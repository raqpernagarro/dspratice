// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=184-9584
// source=src/components/atoms/Tag/Tag.tsx
// component=Tag
import figma from 'figma'
const instance = figma.selectedInstance
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const variant = instance.getEnum('Variant', {
  Neutral: 'neutral',
  Error: 'error',
  Warning: 'warning',
  Success: 'success',
  Highlight: 'highlight',
})
const label = instance.getString('Label')
const leading = instance.getBoolean('Show leading icon') ? swap('Leading icon') : undefined
const trailing = instance.getBoolean('Show trailing icon') ? swap('Trailing icon') : undefined

export default {
  example: figma.code`<Tag
  label=${q(label)}
  variant="${variant}"${leading ? figma.code`
  showLeadingIcon
  leadingIcon={${leading}}` : ''}${trailing ? figma.code`
  showTrailingIcon
  trailingIcon={${trailing}}` : ''}${bool('disclosure', instance.getBoolean('Disclosure'))}
/>`,
  imports: [
    "import { Tag } from 'ds-ngr'",
  ],
  id: 'tag',
  metadata: { nestable: true, props: { label, variant } },
}
