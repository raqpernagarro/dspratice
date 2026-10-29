/* Generated from navigation-menu-link.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { NavigationMenu } from './NavigationMenu'

figma.connect(NavigationMenu.Card, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6755', {
  props: {
    title: figma.string('Title'),
    description: figma.boolean('Show description', { true: figma.string('Description'), false: undefined }),
  },
  example: ({ title, description }) => <NavigationMenu.Card title={title} description={description} />,
})
