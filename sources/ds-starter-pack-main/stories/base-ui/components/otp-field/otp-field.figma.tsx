/* Generated from otp-field.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { OtpField } from './OtpField'

figma.connect(OtpField, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-4062', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
  },
  example: ({ size }) => <OtpField size={size} />,
})
