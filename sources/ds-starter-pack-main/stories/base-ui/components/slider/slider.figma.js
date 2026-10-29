// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-4113
// component=Slider

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
  id: "Slider",
  imports: ["import { Slider } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Slider${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp("disabled", disabled)}/>`,
  metadata: { nestable: true },
}
