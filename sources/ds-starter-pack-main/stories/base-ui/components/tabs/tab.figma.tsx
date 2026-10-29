/* Generated from tab.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Tabs } from './Tabs'

figma.connect(Tabs.Tab, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7242', {
  props: {
    disabled: figma.enum('State', { 'Disabled': true }),
    children: figma.string('Label'),
  },
  example: ({ disabled, children }) => <Tabs.Tab disabled={disabled} value="tab">{children}</Tabs.Tab>,
})
