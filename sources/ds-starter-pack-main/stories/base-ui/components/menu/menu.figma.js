// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6224
// component=Menu.Popup

const figma = require("figma")

const children = figma.properties.slot("Items")

export default {
  id: "Menu.Popup",
  imports: ["import { Menu } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Menu.Popup>${figma.helpers.react.renderChildren(
    children,
  )}</Menu.Popup>`,
  metadata: { nestable: true },
}
