/* Generated from drawer.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Drawer } from './Drawer'

figma.connect(Drawer.Popup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7066', {
  props: {
    title: figma.string('Title'),
    description: figma.boolean('Show description', { true: figma.string('Description'), false: undefined }),
    showClose: figma.boolean('Show close'),
    body: figma.slot('Body'),
    actions: figma.slot('Actions'),
  },
  example: ({ showClose, title, description, body, actions }) => (
    <Drawer.Popup showClose={showClose}>
      <Drawer.Title>{title}</Drawer.Title>
      <Drawer.Description>{description}</Drawer.Description>
      <Drawer.Body>{body}</Drawer.Body>
      <Drawer.Actions>{actions}</Drawer.Actions>
    </Drawer.Popup>
  ),
})
