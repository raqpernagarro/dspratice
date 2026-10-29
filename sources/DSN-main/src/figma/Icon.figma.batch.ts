// Lucide icon — one template for every icon component listed in Icon.figma.batch.json.
// Renders a JSX element; every DS icon prop accepts elements (see src/types/icon.tsx).
import figma from 'figma'

const name = figma.batch.componentName as string

export default {
  example: figma.code`<${name} />`,
  imports: [`import { ${name} } from 'lucide-react'`],
  id: figma.batch.id as string,
  metadata: { nestable: true, props: { icon: name } },
}
