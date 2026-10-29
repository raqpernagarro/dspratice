// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8572-15962
// source=src/components/molecules/ChoiceList/ChoiceList.tsx
// component=ChoiceList
import figma from 'figma'
const instance = figma.selectedInstance

const variant = instance.getEnum('Variant', { Default: 'default', Switchers: 'switchers', Checkbox: 'checkbox', Radio: 'radio' })
const labels = instance
  .findConnectedInstances((node) => ['menu-cell', 'checkbox', 'radio'].includes(node.codeConnectId() ?? ''), { traverseInstances: true })
  .map((node) => (node.type === 'INSTANCE' ? (node.executeTemplate().metadata?.props?.label as string) : ''))
  .filter(Boolean)
const kind = variant === 'checkbox' ? 'checkbox-cell' : variant === 'radio' ? 'radio-cell' : 'menu-cell'
const items = labels.map((label, i) => `{ id: 'item-${i + 1}', kind: '${kind}', props: { label: ${JSON.stringify(label)} } }`)

export default {
  example: figma.code`<ChoiceList${variant === 'default' ? '' : `\n  variant="${variant}"`}
  sections={[
    {
      id: 'options',
      title: 'Options',
      items: [
        ${items.join(',\n        ')}
      ],
    },
  ]}
  showSectionHeaders={false}
/>`,
  imports: [
    "import { ChoiceList } from 'ds-ngr'",
  ],
  id: 'choice-list',
  metadata: { nestable: true, props: {} },
}
