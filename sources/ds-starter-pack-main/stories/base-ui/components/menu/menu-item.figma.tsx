/* Generated from menu-item.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Menu } from './Menu'

figma.connect(Menu.Item, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-1906', {
  props: {
    disabled: figma.enum('State', { 'Disabled': true }),
    children: figma.textContent('label'),
  },
  example: ({ disabled, children }) => <Menu.Item disabled={disabled}>{children}</Menu.Item>,
})
