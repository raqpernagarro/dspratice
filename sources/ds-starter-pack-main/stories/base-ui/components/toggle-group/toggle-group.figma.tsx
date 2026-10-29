/* Generated from toggle-group.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { ToggleGroup } from './ToggleGroup'

figma.connect(ToggleGroup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6607', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    children: figma.slot('Items'),
  },
  example: ({ size, children }) => <ToggleGroup size={size}>{children}</ToggleGroup>,
})
