/* Generated from accordion-item.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Accordion } from './Accordion'

figma.connect(Accordion.Item, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7353', {
  props: {
    disabled: figma.enum('State', { 'Disabled': true }),
    title: figma.string('Title'),
    children: figma.slot('Panel'),
  },
  example: ({ disabled, title, children }) => <Accordion.Item disabled={disabled} title={title}>{children}</Accordion.Item>,
})
