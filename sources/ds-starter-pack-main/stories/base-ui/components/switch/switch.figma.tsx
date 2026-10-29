/* Generated from switch.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Switch } from './Switch'

figma.connect(Switch, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-2156', {
  props: {
    checked: figma.enum('Checked', { 'True': true, 'False': false }),
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    disabled: figma.enum('State', { 'Disabled': true }),
    children: figma.textContent('label'),
  },
  example: ({ checked, size, disabled, children }) => <Switch checked={checked} size={size} disabled={disabled}>{children}</Switch>,
})
