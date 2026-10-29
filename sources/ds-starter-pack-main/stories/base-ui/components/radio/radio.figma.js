// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-2255
// component=Radio

const figma = require("figma")

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
  id: "Radio",
  imports: ["import { Radio } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Radio${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )} value="option">${figma.helpers.react.renderChildren(children)}</Radio>`,
  metadata: { nestable: true },
}
