/* Generated from dialog.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Dialog } from './Dialog'

figma.connect(Dialog.Popup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6798', {
  props: {
    title: figma.string('Title'),
    description: figma.boolean('Show description', { true: figma.string('Description'), false: undefined }),
    showClose: figma.boolean('Show close'),
    body: figma.slot('Body'),
    actions: figma.slot('Actions'),
  },
  example: ({ showClose, title, description, body, actions }) => (
    <Dialog.Popup showClose={showClose}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
      <Dialog.Body>{body}</Dialog.Body>
      <Dialog.Actions>{actions}</Dialog.Actions>
    </Dialog.Popup>
  ),
})
