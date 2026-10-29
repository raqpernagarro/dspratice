/* Generated from menu.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Menu } from './Menu'

figma.connect(Menu.Popup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6224', {
  props: {
    children: figma.slot('Items'),
  },
  example: ({ children }) => <Menu.Popup>{children}</Menu.Popup>,
})
