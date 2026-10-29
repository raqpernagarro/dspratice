// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2057-5305
// component=Combobox.Input

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
  id: "Combobox.Input",
  imports: ["import { Combobox } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Combobox.Input${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp("disabled", disabled)}/>`,
  metadata: { nestable: true },
}
