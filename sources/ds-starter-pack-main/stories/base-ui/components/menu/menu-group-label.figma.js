// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6217
// component=Menu.GroupLabel

const figma = require("figma")

const children = figma.selectedInstance.getString("Label")

export default {
  id: "Menu.GroupLabel",
  imports: ["import { Menu } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Menu.GroupLabel>${figma.helpers.react.renderChildren(
    children,
  )}</Menu.GroupLabel>`,
  metadata: { nestable: true },
}
