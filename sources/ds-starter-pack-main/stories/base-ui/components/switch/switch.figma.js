// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-2156
// component=Switch

const figma = require("figma")

const checked = figma.selectedInstance.getEnum("Checked", {
  True: true,
  False: false,
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
  id: "Switch",
  imports: ["import { Switch } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Switch${figma.helpers.react.renderProp(
    "checked",
    checked,
  )}${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )}>${figma.helpers.react.renderChildren(children)}</Switch>`,
  metadata: { nestable: true },
}
