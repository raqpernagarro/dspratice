// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=1697-33038
// source=src/components/atoms/DateTimePicker/DateTimePicker.tsx
// component=DateTimePicker
import figma from 'figma'
const instance = figma.selectedInstance
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const mode = instance.getEnum('Mode', { 'Date range': 'range', 'Single date': 'single' })

export default {
  example: figma.code`<DateTimePicker
  displayMode="inline"
  label="Date"${mode === 'range' ? '\n  selectionMode="range"' : ''}${bool('withTime', instance.getBoolean('Show time'))}${instance.getBoolean('Show quick selection') ? '\n  presets={presets}' : ''}
/>`,
  imports: [
    "import { DateTimePicker } from 'ds-ngr'",
  ],
  id: 'date-time-picker-inline',
  metadata: { nestable: true, props: {} },
}
