// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=1359-12674
// source=src/components/organisms/Sidebar/Sidebar.tsx
// component=Sidebar
import figma from 'figma'
const instance = figma.selectedInstance

const collapsed = instance.getEnum('Collapsed', { True: true, False: false })

export default {
  example: figma.code`<Sidebar${collapsed ? '\n  collapsed' : ''}
  sections={sections}
/>`,
  imports: [
    "import { Sidebar } from 'ds-ngr'",
  ],
  id: 'sidebar',
  metadata: { nestable: true, props: {} },
}
