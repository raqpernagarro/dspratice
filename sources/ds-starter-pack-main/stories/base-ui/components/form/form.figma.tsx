/* Generated from form.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Form, FormActions } from './Form'

figma.connect(Form, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6413', {
  props: {
    children: figma.slot('Fields'),
    actions: figma.slot('Actions'),
  },
  example: ({ children, actions }) => (
    <Form>
      <FormActions>{actions}</FormActions>
      {children}
    </Form>
  ),
})
