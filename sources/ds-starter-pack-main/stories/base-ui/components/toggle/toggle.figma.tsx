/* Generated from toggle.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Toggle } from './Toggle'

figma.connect(Toggle, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-4303', {
  props: {
    pressed: figma.enum('Selected', { 'True': true, 'False': false }),
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    disabled: figma.enum('State', { 'Disabled': true }),
    icon: figma.instance<any>('Icon'),
  },
  example: ({ pressed, size, disabled, icon }) => <Toggle pressed={pressed} size={size} disabled={disabled} icon={icon} label="Describe the option" />,
})
