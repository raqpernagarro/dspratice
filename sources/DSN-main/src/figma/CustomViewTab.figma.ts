// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=132-7427
// source=src/components/atoms/CustomViewTab/CustomViewTab.tsx
// component=CustomViewTab
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
// One Figma tab = one entry of CustomViewTab `tabs`.
const label = instance.getString('Label')
const icon = instance.getBoolean('Show icon') ? swap('Icon') : undefined
const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export default {
  example: figma.code`<CustomViewTab
  tabs={[
    {
      value: '${value}',
      label: ${JSON.stringify(label)}${icon ? figma.code`,
      showLeadingIcon: true,
      leadingIcon: ${icon}` : ''}
    },
  ]}${flag('Selected') ? `\n  defaultValue="${value}"` : ''}
/>`,
  imports: [
    "import { CustomViewTab } from 'ds-ngr'",
  ],
  id: 'custom-view-tab',
  metadata: { nestable: true, props: { label } },
}
