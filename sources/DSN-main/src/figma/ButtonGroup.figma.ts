// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=947-10906
// source=src/components/atoms/ButtonGroup/ButtonGroup.tsx
// component=ButtonGroup
import figma from 'figma'
const instance = figma.selectedInstance

const size = instance.getEnum('Size', { Medium: 'md', Small: 'sm' })
const spaceBetween = instance.getEnum('Space between', { True: true, False: false })
// Amount (2 / 3 / 4+) is just the number of children in code.
const buttons = instance.findConnectedInstances((node) => node.codeConnectId() === 'button')
const b0 = buttons[0]?.executeTemplate().example
const b1 = buttons[1]?.executeTemplate().example
const b2 = buttons[2]?.executeTemplate().example
const b3 = buttons[3]?.executeTemplate().example
const b4 = buttons[4]?.executeTemplate().example

export default {
  example: figma.code`<ButtonGroup size="${size}"${spaceBetween ? ' spaceBetween' : ''}>${b0 ? figma.code`
  ${b0}` : ''}${b1 ? figma.code`
  ${b1}` : ''}${b2 ? figma.code`
  ${b2}` : ''}${b3 ? figma.code`
  ${b3}` : ''}${b4 ? figma.code`
  ${b4}` : ''}
</ButtonGroup>`,
  imports: [
    "import { ButtonGroup } from 'ds-ngr'",
  ],
  id: 'button-group',
  metadata: { nestable: true, props: {} },
}
