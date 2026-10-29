/* Generated from menubar.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Menubar } from './Menubar'

figma.connect(Menubar.Root, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6608', {
  props: {
    children: figma.slot('Items'),
  },
  example: ({ children }) => <Menubar.Root>{children}</Menubar.Root>,
})
