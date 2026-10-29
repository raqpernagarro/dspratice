// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2057-4750
// component=Select.Item

const figma = require("figma")

const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})
const children = figma.selectedInstance.findText("label").__render__()

export default {
  id: "Select.Item",
  imports: ["import { Select } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Select.Item${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )}>${figma.helpers.react.renderChildren(children)}</Select.Item>`,
  metadata: { nestable: true },
}
