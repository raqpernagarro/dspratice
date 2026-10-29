/* Generated from icon-button.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { IconButton } from './IconButton'

figma.connect(IconButton, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=261-1993', {
  props: {
    variant: figma.enum('Type', { 'Primary': 'primary', 'Secondary': 'secondary', 'Ghost': 'ghost', 'Outline': 'outline' }),
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    disabled: figma.enum('State', { 'Disabled': true }),
    destructive: figma.enum('Destructive', { 'False': false, 'True': true }),
    icon: figma.instance('Icon'),
  },
  example: ({ variant, size, disabled, destructive, icon }) => <IconButton variant={variant} size={size} disabled={disabled} destructive={destructive} icon={icon} label="Describe the action" />,
})
