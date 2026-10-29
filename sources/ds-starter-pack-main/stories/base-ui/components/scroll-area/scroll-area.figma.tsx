/* Generated from scroll-area.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { ScrollArea } from './ScrollArea'

figma.connect(ScrollArea, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7496', {
  props: {
    children: figma.slot('Content'),
  },
  example: ({ children }) => <ScrollArea>{children}</ScrollArea>,
})
