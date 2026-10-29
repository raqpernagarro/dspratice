/* Generated from avatar.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Avatar } from './Avatar'

figma.connect(Avatar, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2058-5716', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    initials: figma.string('Initials'),
  },
  example: ({ size, initials }) => <Avatar size={size} initials={initials} />,
})
