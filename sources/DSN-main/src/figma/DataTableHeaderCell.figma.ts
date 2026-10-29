// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=179-2156
// source=src/components/atoms/DataTableHeaderCell/DataTableHeaderCell.tsx
// component=DataTableHeaderCell
import figma from 'figma'
const instance = figma.selectedInstance
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const str = (name: string, value: string | undefined) => (value ? `\n  ${name}=${q(value)}` : '')
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const variant = instance.getEnum('Type', { Title: 'title', Checkbox: 'checkbox' })
const icon = instance.getBoolean('Show icon') ? swap('Icon') : undefined
// Sort direction is an icon swap in Figma, so the direction itself can't be read.

export default {
  example: figma.code`<DataTableHeaderCell${variant === 'checkbox' ? '\n  variant="checkbox"\n  label="Select all rows"' : str('label', instance.getString('Label'))}${instance.getBoolean('Sorted') ? '\n  sortable\n  sortDirection="asc"' : ''}${bool('reorderable', instance.getBoolean('Draggable'))}${icon ? figma.code`
  leadingAccessory={${icon}}` : ''}
/>`,
  imports: [
    "import { DataTableHeaderCell } from 'ds-ngr'",
  ],
  id: 'data-table-header-cell',
  metadata: { nestable: true, props: {} },
}
