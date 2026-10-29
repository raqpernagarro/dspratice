/* Generated from option.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Select } from '../select/Select'

figma.connect(Select.Item, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2057-4750', {
  props: {
    disabled: figma.enum('State', { 'Disabled': true }),
    children: figma.textContent('label'),
  },
  example: ({ disabled, children }) => <Select.Item disabled={disabled}>{children}</Select.Item>,
})
