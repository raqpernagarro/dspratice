/* Generated from progress.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Progress } from './Progress'

figma.connect(Progress, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7098', {
  props: {
    value: figma.enum('Value', { '0%': 0, '25%': 25, '50%': 50, '75%': 75, '100%': 100 }),
    label: figma.boolean('Show label', { true: figma.string('Label'), false: undefined }),
    showValue: figma.boolean('Show value'),
  },
  example: ({ value, label, showValue }) => <Progress value={value} label={label} showValue={showValue} />,
})
