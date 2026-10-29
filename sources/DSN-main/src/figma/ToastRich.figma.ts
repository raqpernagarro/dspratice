// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=2911-73678
// source=src/components/molecules/Toast/Toast.tsx
// component=Toast
import figma from 'figma'
const instance = figma.selectedInstance
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const severity = instance.getEnum('Severity', { Default: 'default', Success: 'success', Warning: 'warning', Error: 'error' })
const title = instance.getBoolean('Show title') ? instance.getString('Title') : ''
const description = instance.getBoolean('Show description') ? instance.getString('Description') : undefined
const icon = instance.getBoolean('Show leading icon') ? swap('Leading icon') : undefined
const content = instance.getBoolean('Show content') ? swap('Content') : undefined

export default {
  example: figma.code`<Toast
  variant="rich"
  severity="${severity}"
  title=${q(title)}${str('description', description)}${icon ? figma.code`
  icon={${icon}}` : ''}${content ? figma.code`
  content={${content}}` : ''}${bool('dismissible', instance.getBoolean('Dismiss button'))}
/>`,
  imports: [
    "import { Toast } from 'ds-ngr'",
  ],
  id: 'toast-rich',
  metadata: { nestable: true, props: {} },
}
