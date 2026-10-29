/* Generated from checkbox-group.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { CheckboxGroup } from './CheckboxGroup'

figma.connect(CheckboxGroup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6558', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    children: figma.slot('Options'),
  },
  example: ({ size, children }) => <CheckboxGroup size={size}>{children}</CheckboxGroup>,
})
