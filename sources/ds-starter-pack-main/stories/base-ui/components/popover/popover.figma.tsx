/* Generated from popover.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Popover } from './Popover'

figma.connect(Popover.Popup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6642', {
  props: {
    arrow: figma.boolean('Show arrow'),
    title: figma.boolean('Show title', { true: figma.string('Title'), false: undefined }),
    description: figma.boolean('Show description', { true: figma.string('Description'), false: undefined }),
    children: figma.slot('Content'),
  },
  example: ({ arrow, title, description, children }) => (
    <Popover.Popup arrow={arrow}>
      <Popover.Title>{title}</Popover.Title>
      <Popover.Description>{description}</Popover.Description>
      {children}
    </Popover.Popup>
  ),
})
