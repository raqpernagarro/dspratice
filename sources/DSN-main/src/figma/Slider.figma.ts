// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=2514-45982
// source=src/components/molecules/Slider/Slider.tsx
// component=Slider
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const mode = instance.getEnum('Type', { 'Max value': 'single', Range: 'range' })
const stack = instance.getEnum('Stack', { Horizontal: 'horizontal', Vertical: 'vertical' })

export default {
  example: figma.code`<Slider${mode === 'range' ? '\n  mode="range"\n  defaultRangeValue={{ min: 20, max: 80 }}' : '\n  defaultValue={50}'}
  stack="${stack}"${bool('showInput', instance.getBoolean('Show input'))}${bool('disabled', flag('Disabled'))}
/>`,
  imports: [
    "import { Slider } from 'ds-ngr'",
  ],
  id: 'slider',
  metadata: { nestable: true, props: {} },
}
