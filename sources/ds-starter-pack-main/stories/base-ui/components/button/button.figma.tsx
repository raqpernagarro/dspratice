/* Generated from button.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Button } from './Button'

figma.connect(Button, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=221-2', {
  props: {
    variant: figma.enum('Type', { 'Primary': 'primary', 'Secondary': 'secondary', 'Ghost': 'ghost', 'Outline': 'outline' }),
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    disabled: figma.enum('State', { 'Disabled': true }),
    destructive: figma.enum('Destructive', { 'False': false, 'True': true }),
    children: figma.textContent('label'),
  },
  example: ({ variant, size, disabled, destructive, children }) => <Button variant={variant} size={size} disabled={disabled} destructive={destructive}>{children}</Button>,
})
