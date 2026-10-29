/* Generated from collapsible.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Collapsible } from './Collapsible'

figma.connect(Collapsible, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7452', {
  props: {
    disabled: figma.enum('State', { 'Disabled': true }),
    label: figma.string('Label'),
    children: figma.slot('Panel'),
  },
  example: ({ disabled, label, children }) => <Collapsible disabled={disabled} label={label}>{children}</Collapsible>,
})
