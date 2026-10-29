// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=2884-87110
// source=src/components/molecules/Toast/Toast.tsx
// component=Toast
import figma from 'figma'
const instance = figma.selectedInstance
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const nested = (layer: string, prop: string) => {
  const node = instance.findInstance(layer)
  return node && node.type === 'INSTANCE' ? node.getString(prop) : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const severity = instance.getEnum('Severity', { Default: 'default', Success: 'success', Warning: 'warning', Error: 'error' })
const title = instance.getBoolean('Show title') ? instance.getString('Title') : ''
const description = instance.getBoolean('Show description') ? instance.getString('Description') : undefined
const icon = instance.getBoolean('Show leading icon') ? swap('Leading icon') : undefined
const actionLabel = instance.getBoolean('Show action') ? nested('Action', 'Label') : undefined

export default {
  example: figma.code`<Toast
  variant="inline"
  severity="${severity}"
  title=${q(title)}${str('description', description)}${icon ? figma.code`
  icon={${icon}}` : ''}${str('actionLabel', actionLabel)}${bool('dismissible', instance.getBoolean('Dismiss button'))}
/>`,
  imports: [
    "import { Toast } from 'ds-ngr'",
  ],
  id: 'toast-inline',
  metadata: { nestable: true, props: {} },
}
