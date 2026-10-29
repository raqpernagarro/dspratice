// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2057-5008
// component=Select.Trigger

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
  id: "Select.Trigger",
  imports: ["import { Select } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Select.Trigger${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp("disabled", disabled)}/>`,
  metadata: { nestable: true },
}
