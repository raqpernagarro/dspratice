// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=4095-182336
// source=src/components/molecules/Breadcrumbs/Breadcrumbs.tsx
// component=Breadcrumbs
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
// A single crumb is an entry of Breadcrumbs `items`, not a component of its own.
const label = instance.getString('Title')
const variant = instance.getEnum('Variant', { Current: 'current', Previous: 'previous', Ellipsis: 'ellipsis' })
const disabled = flag('Disabled')
const disclosure = instance.getBoolean('Disclosure')
const item = `{ label: ${JSON.stringify(label)}, variant: '${variant}'${disabled ? ', disabled: true' : ''}${disclosure ? ', showDisclosure: true' : ''} }`

export default {
  example: figma.code`<Breadcrumbs items={[${item}]} />`,
  imports: [
    "import { Breadcrumbs } from 'ds-ngr'",
  ],
  id: 'breadcrumb-item',
  metadata: { nestable: true, props: { label, item } },
}
