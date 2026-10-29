// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-1470
// component=Input

const figma = require("figma")

const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})

export default {
  id: "Input",
  imports: ["import { Input } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Input${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp("disabled", disabled)}/>`,
  metadata: { nestable: true },
}
