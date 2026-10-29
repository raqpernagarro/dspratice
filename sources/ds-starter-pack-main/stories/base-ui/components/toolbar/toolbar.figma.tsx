/* Generated from toolbar.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Toolbar } from './Toolbar'

figma.connect(Toolbar.Root, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7453', {
  props: {
    children: figma.slot('Items'),
  },
  example: ({ children }) => <Toolbar.Root>{children}</Toolbar.Root>,
})
