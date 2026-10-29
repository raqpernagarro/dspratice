// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8515-36008
// source=src/components/atoms/Chip/Chip.tsx
// component=ChipGroup
import figma from 'figma'
const instance = figma.selectedInstance

const chips = instance.findConnectedInstances((node) => node.codeConnectId() === 'chip')
const c0 = chips[0]?.executeTemplate().example
const c1 = chips[1]?.executeTemplate().example
const c2 = chips[2]?.executeTemplate().example
const c3 = chips[3]?.executeTemplate().example
const c4 = chips[4]?.executeTemplate().example

export default {
  example: figma.code`<ChipGroup label="Filters">${c0 ? figma.code`
  ${c0}` : ''}${c1 ? figma.code`
  ${c1}` : ''}${c2 ? figma.code`
  ${c2}` : ''}${c3 ? figma.code`
  ${c3}` : ''}${c4 ? figma.code`
  ${c4}` : ''}
</ChipGroup>`,
  imports: [
    "import { ChipGroup } from 'ds-ngr'",
  ],
  id: 'chip-group',
  metadata: { nestable: true, props: {} },
}
