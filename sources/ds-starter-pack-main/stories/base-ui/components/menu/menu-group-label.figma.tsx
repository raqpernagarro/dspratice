/* Generated from menu-group-label.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Menu } from './Menu'

figma.connect(Menu.GroupLabel, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6217', {
  props: {
    children: figma.string('Label'),
  },
  example: ({ children }) => <Menu.GroupLabel>{children}</Menu.GroupLabel>,
})
