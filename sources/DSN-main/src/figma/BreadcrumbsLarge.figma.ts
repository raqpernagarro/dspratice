// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=4097-184354
// source=src/components/molecules/Breadcrumbs/Breadcrumbs.tsx
// component=Breadcrumbs
import figma from 'figma'
const instance = figma.selectedInstance

const labels = instance
  .findConnectedInstances((node) => node.codeConnectId() === 'button' || node.codeConnectId() === 'breadcrumb-item')
  .map((node) => (node.type === 'INSTANCE' ? (node.executeTemplate().metadata?.props?.label as string) : ''))
  .filter(Boolean)
const items = labels.map((label, i) => (i === labels.length - 1 ? `{ label: ${JSON.stringify(label)} }` : `{ label: ${JSON.stringify(label)}, href: '#' }`))

export default {
  example: figma.code`<Breadcrumbs
  size="lg"
  items={[${items.join(', ')}]}
/>`,
  imports: [
    "import { Breadcrumbs } from 'ds-ngr'",
  ],
  id: 'breadcrumbs-large',
  metadata: { nestable: true, props: {} },
}
