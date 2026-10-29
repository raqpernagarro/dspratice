// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=1229-16497
// source=src/components/organisms/Modal/Modal.tsx
// component=Modal
import figma from 'figma'
const instance = figma.selectedInstance
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const header = instance.findInstance('Section header')
const title = header && header.type === 'INSTANCE' ? header.getString('Title') : 'Title'

const content = instance.getSlot('modalContent')

export default {
  example: figma.code`<Modal
  open={open}
  onClose={close}
  title=${q(title)}${instance.getBoolean('Has bottom bar') ? '\n  showBottomBar' : ''}
>
  ${content ?? 'Content'}
</Modal>`,
  imports: [
    "import { Modal } from 'ds-ngr'",
  ],
  id: 'modal',
  metadata: { nestable: true, props: {} },
}
