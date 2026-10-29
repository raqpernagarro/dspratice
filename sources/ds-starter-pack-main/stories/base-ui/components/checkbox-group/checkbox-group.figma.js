// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6558
// component=CheckboxGroup

const figma = require("figma")

const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const children = figma.properties.slot("Options")

export default {
  id: "CheckboxGroup",
  imports: ["import { CheckboxGroup } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<CheckboxGroup${figma.helpers.react.renderProp(
    "size",
    size,
  )}>${figma.helpers.react.renderChildren(children)}</CheckboxGroup>`,
  metadata: { nestable: true },
}
