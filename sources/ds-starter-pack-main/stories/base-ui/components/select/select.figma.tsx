/* Generated from select.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Select } from './Select'

figma.connect(Select.Trigger, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2057-5008', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    disabled: figma.enum('State', { 'Disabled': true }),
  },
  example: ({ size, disabled }) => <Select.Trigger size={size} disabled={disabled} />,
})
