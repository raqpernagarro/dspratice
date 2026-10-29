// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-1906
// component=Menu.Item

const figma = require("figma")

const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})
const children = figma.selectedInstance.findText("label").__render__()

export default {
  id: "Menu.Item",
  imports: ["import { Menu } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Menu.Item${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )}>${figma.helpers.react.renderChildren(children)}</Menu.Item>`,
  metadata: { nestable: true },
}
