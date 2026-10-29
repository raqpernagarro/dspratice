/* Generated from preview-card.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { PreviewCard } from './PreviewCard'

figma.connect(PreviewCard.Popup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6684', {
  props: {
    arrow: figma.boolean('Show arrow'),
  },
  example: ({ arrow }) => <PreviewCard.Popup arrow={arrow} />,
})
