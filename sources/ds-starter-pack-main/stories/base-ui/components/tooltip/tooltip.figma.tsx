/* Generated from tooltip.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Tooltip } from './Tooltip'

figma.connect(Tooltip.Popup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6659', {
  props: {
    arrow: figma.boolean('Show arrow'),
    children: figma.string('Label'),
  },
  example: ({ arrow, children }) => <Tooltip.Popup arrow={arrow}>{children}</Tooltip.Popup>,
})
