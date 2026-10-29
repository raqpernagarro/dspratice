/* Generated from number-field.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { NumberField } from './NumberField'

figma.connect(NumberField, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-4522', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    disabled: figma.enum('State', { 'Disabled': true }),
  },
  example: ({ size, disabled }) => <NumberField size={size} disabled={disabled} />,
})
