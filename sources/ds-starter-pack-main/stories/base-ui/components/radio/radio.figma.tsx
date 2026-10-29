/* Generated from radio.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Radio } from './Radio'

figma.connect(Radio, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-2255', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    disabled: figma.enum('State', { 'Disabled': true }),
    children: figma.textContent('label'),
  },
  example: ({ size, disabled, children }) => <Radio size={size} disabled={disabled} value="option">{children}</Radio>,
})
