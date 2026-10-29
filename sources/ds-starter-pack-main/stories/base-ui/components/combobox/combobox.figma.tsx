/* Generated from combobox.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Combobox } from './Combobox'

figma.connect(Combobox.Input, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2057-5305', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    disabled: figma.enum('State', { 'Disabled': true }),
  },
  example: ({ size, disabled }) => <Combobox.Input size={size} disabled={disabled} />,
})
