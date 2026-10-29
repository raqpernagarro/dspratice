// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6607
// component=ToggleGroup

const figma = require("figma")

const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const children = figma.properties.slot("Items")

export default {
  id: "ToggleGroup",
  imports: ["import { ToggleGroup } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<ToggleGroup${figma.helpers.react.renderProp(
    "size",
    size,
  )}>${figma.helpers.react.renderChildren(children)}</ToggleGroup>`,
  metadata: { nestable: true },
}
