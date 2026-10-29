// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8246-322090
// source=src/components/molecules/Accordion/Accordion.tsx
// component=Accordion
import figma from 'figma'
const instance = figma.selectedInstance
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const disclosure = instance.getEnum('Disclosure', { Left: 'left', Right: 'right' })
const header = instance.findInstance('Section header')
const title = header && header.type === 'INSTANCE' ? header.getString('Title') : 'Title'

export default {
  example: figma.code`<Accordion
  title=${q(title)}${disclosure === 'right' ? '\n  disclosure="right"' : ''}${instance.getEnum('Border', { True: true, False: false }) ? '\n  bordered' : ''}${instance.getEnum('Open', { True: true, False: false }) ? '\n  defaultExpanded' : ''}
>
  Content
</Accordion>`,
  imports: [
    "import { Accordion } from 'ds-ngr'",
  ],
  id: 'accordion',
  metadata: { nestable: true, props: {} },
}
