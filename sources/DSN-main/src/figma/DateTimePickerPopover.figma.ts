// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8567-40254
// source=src/components/atoms/DateTimePicker/DateTimePicker.tsx
// component=DateTimePicker
import figma from 'figma'
const instance = figma.selectedInstance

const mode = instance.getEnum('Mode', { 'Date range': 'range', 'Single date': 'single' })

export default {
  example: figma.code`<DateTimePicker
  displayMode="popover"
  label="Date"${mode === 'range' ? '\n  selectionMode="range"' : ''}\n  defaultOpen
/>`,
  imports: [
    "import { DateTimePicker } from 'ds-ngr'",
  ],
  id: 'date-time-picker-popover',
  metadata: { nestable: true, props: {} },
}
