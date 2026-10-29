/* Generated from fieldset.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Fieldset } from './Fieldset'

figma.connect(Fieldset, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6412', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    children: figma.slot('Fields'),
    legend: figma.string('Legend'),
  },
  example: ({ size, legend, children }) => <Fieldset size={size} legend={legend}>{children}</Fieldset>,
})
