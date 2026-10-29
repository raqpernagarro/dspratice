// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8620-54668
// source=src/components/organisms/Navbar/Navbar.tsx
// component=Navbar
import figma from 'figma'
const instance = figma.selectedInstance
const text = (layer: string) => {
  const node = instance.findText(layer)
  return node && node.type === 'TEXT' ? node.textContent : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const variant = instance.getEnum('Mode', { Title: 'title', Breadcrumbs: 'breadcrumbs' })
const showDescription = instance.getBoolean('Show description')

export default {
  example: figma.code`<Navbar${variant === 'breadcrumbs' ? '\n  variant="breadcrumbs"\n  breadcrumbItems={breadcrumbs}' : str('title', text('Title'))}${showDescription ? `\n  showDescription${str('description', text('Description'))}` : ''}
  rightActions={actions}
/>`,
  imports: [
    "import { Navbar } from 'ds-ngr'",
  ],
  id: 'navbar',
  metadata: { nestable: true, props: {} },
}
