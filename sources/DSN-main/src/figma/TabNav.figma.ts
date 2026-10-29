// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=132-8663
// source=src/components/atoms/Tab/TabNav.tsx
// component=TabNav
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
// One Figma tab = one entry of TabNav `items`.
const label = instance.getString('Label')
const current = flag('Selected')
const leading = instance.getBoolean('Show leading icon') ? swap('Leading icon') : undefined
const trailing = instance.getBoolean('Show trailing icon') ? swap('Trailing icon') : undefined

export default {
  example: figma.code`<TabNav
  aria-label="Sections"
  items={[
    {
      label: ${JSON.stringify(label)},
      href: '#'${current ? ',\n      current: true' : ''}${leading ? figma.code`,
      showLeadingIcon: true,
      leadingIcon: ${leading}` : ''}${trailing ? figma.code`,
      showTrailingIcon: true,
      trailingIcon: ${trailing}` : ''}
    },
  ]}
/>`,
  imports: [
    "import { TabNav } from 'ds-ngr'",
  ],
  id: 'tab-nav-item',
  metadata: { nestable: true, props: { label } },
}
