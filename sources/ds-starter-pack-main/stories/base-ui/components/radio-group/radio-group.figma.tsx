/* Generated from radio-group.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { RadioGroup } from './RadioGroup'

figma.connect(RadioGroup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6503', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    children: figma.slot('Options'),
  },
  example: ({ size, children }) => <RadioGroup size={size}>{children}</RadioGroup>,
})
