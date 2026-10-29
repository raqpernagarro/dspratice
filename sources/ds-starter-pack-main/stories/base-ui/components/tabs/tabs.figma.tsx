/* Generated from tabs.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Tabs } from './Tabs'

figma.connect(Tabs.Root, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7273', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    panel: figma.slot('Panel'),
  },
  example: ({ size, panel }) => (
    <Tabs.Root size={size}>
      <Tabs.Panel value="tab">{panel}</Tabs.Panel>
    </Tabs.Root>
  ),
})
