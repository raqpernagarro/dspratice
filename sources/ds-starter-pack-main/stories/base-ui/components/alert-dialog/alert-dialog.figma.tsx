/* Generated from alert-dialog.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { AlertDialog } from './AlertDialog'

figma.connect(AlertDialog.Popup, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6908', {
  props: {
    title: figma.string('Title'),
    description: figma.boolean('Show description', { true: figma.string('Description'), false: undefined }),
    showClose: figma.boolean('Show close'),
    body: figma.slot('Body'),
    actions: figma.slot('Actions'),
  },
  example: ({ showClose, title, description, body, actions }) => (
    <AlertDialog.Popup showClose={showClose}>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description>{description}</AlertDialog.Description>
      <AlertDialog.Body>{body}</AlertDialog.Body>
      <AlertDialog.Actions>{actions}</AlertDialog.Actions>
    </AlertDialog.Popup>
  ),
})
