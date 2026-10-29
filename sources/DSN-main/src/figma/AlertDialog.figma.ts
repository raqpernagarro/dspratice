// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=4552-110701
// source=src/components/organisms/AlertDialog/AlertDialog.tsx
// component=AlertDialog
import figma from 'figma'
const instance = figma.selectedInstance
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const variant = instance.getEnum('Type', { Default: 'default', Danger: 'danger' })
const message = instance.findInstance('.modalMessage')
const title = message && message.type === 'INSTANCE' ? message.getString('Title') : 'Title'
const body = message && message.type === 'INSTANCE' ? message.getString('Message') : undefined

export default {
  example: figma.code`<AlertDialog
  open={open}${variant === 'danger' ? '\n  variant="danger"' : ''}
  title=${q(title)}${str('message', body)}
  onConfirm={confirm}
  onCancel={close}
/>`,
  imports: [
    "import { AlertDialog } from 'ds-ngr'",
  ],
  id: 'alert-dialog',
  metadata: { nestable: true, props: {} },
}
