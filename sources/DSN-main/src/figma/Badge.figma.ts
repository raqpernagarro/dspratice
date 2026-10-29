// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=642-18316
// source=src/components/atoms/Badge/Badge.tsx
// component=Badge
import figma from 'figma'
const instance = figma.selectedInstance

const size = instance.getEnum('Size', { Standard: 'sm', Dot: 'dot' })
const variant = instance.getEnum('Variant', {
  Critical: 'critical',
  'Highlight soft': 'highlight-soft',
  'Highlight strong': 'highlight-strong',
  Informative: 'informative',
})
const label = instance.getString('Label')
const count = /^\d+$/.test(label) ? `\n  count={${label}}` : ''

export default {
  example: figma.code`<Badge
  size="${size}"
  variant="${variant}"${size === 'dot' ? '' : count}
/>`,
  imports: [
    "import { Badge } from 'ds-ngr'",
  ],
  id: 'badge',
  metadata: { nestable: true, props: { label } },
}
