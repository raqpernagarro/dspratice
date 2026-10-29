/* Generated from menubar-item.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Menubar } from './Menubar'

figma.connect(Menubar.Trigger, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2057-5316', {
  props: {
    disabled: figma.enum('State', { 'Disabled': true }),
    children: figma.textContent('label'),
  },
  example: ({ disabled, children }) => <Menubar.Trigger disabled={disabled}>{children}</Menubar.Trigger>,
})
