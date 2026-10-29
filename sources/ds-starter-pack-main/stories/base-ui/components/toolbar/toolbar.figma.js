// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7453
// component=Toolbar.Root

const figma = require("figma")

const children = figma.properties.slot("Items")

export default {
  id: "Toolbar.Root",
  imports: ["import { Toolbar } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Toolbar.Root>${figma.helpers.react.renderChildren(
    children,
  )}</Toolbar.Root>`,
  metadata: { nestable: true },
}
