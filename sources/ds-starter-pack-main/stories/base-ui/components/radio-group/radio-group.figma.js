// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6503
// component=RadioGroup

const figma = require("figma")

const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const children = figma.properties.slot("Options")

export default {
  id: "RadioGroup",
  imports: ["import { RadioGroup } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<RadioGroup${figma.helpers.react.renderProp(
    "size",
    size,
  )}>${figma.helpers.react.renderChildren(children)}</RadioGroup>`,
  metadata: { nestable: true },
}
