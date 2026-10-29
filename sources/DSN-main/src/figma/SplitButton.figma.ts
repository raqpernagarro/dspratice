// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=5772-189085
// source=src/components/atoms/ButtonGroup/SplitButton/SplitButton.tsx
// component=SplitButton
import figma from 'figma'
const instance = figma.selectedInstance
const nested = (layer: string, prop: string) => {
  const node = instance.findInstance(layer)
  return node && node.type === 'INSTANCE' ? node.getString(prop) : undefined
}
const size = instance.getEnum('Size', { Medium: 'md', Small: 'sm' })
const label = nested('Button', 'Label') ?? 'Action'

export default {
  example: figma.code`<SplitButton size="${size}" dropdownAriaLabel="More options">
  ${label}
</SplitButton>`,
  imports: [
    "import { SplitButton } from 'ds-ngr'",
  ],
  id: 'split-button',
  metadata: { nestable: true, props: {} },
}
