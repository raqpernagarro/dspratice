// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6608
// component=Menubar.Root

const figma = require("figma")

const children = figma.properties.slot("Items")

export default {
  id: "Menubar.Root",
  imports: ["import { Menubar } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Menubar.Root>${figma.helpers.react.renderChildren(
    children,
  )}</Menubar.Root>`,
  metadata: { nestable: true },
}
