// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8821-61808
// source=src/components/atoms/Stat/Stat.tsx
// component=Stat
import figma from 'figma'
const instance = figma.selectedInstance
const text = (layer: string) => {
  const node = instance.findText(layer)
  return node && node.type === 'TEXT' ? node.textContent : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const variant = instance.getEnum('Variant', { Default: 'default', Card: 'card' })
const title = text('Title') ?? 'Title'
const value = text('1234') ?? '0'

export default {
  example: figma.code`<Stat
  title=${q(title)}
  value=${q(value)}${variant === 'card' ? '\n  variant="card"' : ''}
/>`,
  imports: [
    "import { Stat } from 'ds-ngr'",
  ],
  id: 'stat',
  metadata: { nestable: true, props: {} },
}
