/* Generated from meter.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Meter } from './Meter'

figma.connect(Meter, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7304', {
  props: {
    value: figma.enum('Value', { '0%': 0, '25%': 25, '50%': 50, '75%': 75, '100%': 100 }),
    label: figma.boolean('Show label', { true: figma.string('Label'), false: undefined }),
    showValue: figma.boolean('Show value'),
  },
  example: ({ value, label, showValue }) => <Meter value={value} label={label} showValue={showValue} />,
})
