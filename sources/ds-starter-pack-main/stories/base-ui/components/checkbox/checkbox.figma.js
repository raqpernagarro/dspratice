// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-1742
// component=Checkbox

const figma = require("figma")

const checked = figma.selectedInstance.getEnum("Checked", {
  True: true,
  Indeterminate: true,
})
const indeterminate = figma.selectedInstance.getEnum("Checked", {
  Indeterminate: true,
})
const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})
const children = figma.selectedInstance.findText("label").__render__()

export default {
  id: "Checkbox",
  imports: ["import { Checkbox } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Checkbox${figma.helpers.react.renderProp(
    "checked",
    checked,
  )}${figma.helpers.react.renderProp(
    "indeterminate",
    indeterminate,
  )}${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )}>${figma.helpers.react.renderChildren(children)}</Checkbox>`,
  metadata: { nestable: true },
}
