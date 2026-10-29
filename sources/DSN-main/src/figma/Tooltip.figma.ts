// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=1017-7179
// source=src/components/molecules/Tooltip/Tooltip.tsx
// component=Tooltip
import figma from 'figma'
const instance = figma.selectedInstance
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
export default {
  example: figma.code`<Tooltip content=${q(instance.getString('Description'))}>
  <Button variant="secondary">Hover me</Button>
</Tooltip>`,
  imports: [
    "import { Tooltip } from 'ds-ngr'",
    "import { Button } from 'ds-ngr'",
  ],
  id: 'tooltip',
  metadata: { nestable: true, props: {} },
}
