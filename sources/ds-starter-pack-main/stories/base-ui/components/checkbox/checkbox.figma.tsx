/* Generated from checkbox.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Checkbox } from './Checkbox'

figma.connect(Checkbox, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-1742', {
  props: {
    checked: figma.enum('Checked', { 'True': true, 'Indeterminate': true }),
    indeterminate: figma.enum('Checked', { 'Indeterminate': true }),
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    disabled: figma.enum('State', { 'Disabled': true }),
    children: figma.textContent('label'),
  },
  example: ({ checked, indeterminate, size, disabled, children }) => <Checkbox checked={checked} indeterminate={indeterminate} size={size} disabled={disabled}>{children}</Checkbox>,
})
