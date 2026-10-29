// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6412
// component=Fieldset

const figma = require("figma")

const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const children = figma.properties.slot("Fields")
const legend = figma.selectedInstance.getString("Legend")

export default {
  id: "Fieldset",
  imports: ["import { Fieldset } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Fieldset${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp(
    "legend",
    legend,
  )}>${figma.helpers.react.renderChildren(children)}</Fieldset>`,
  metadata: { nestable: true },
}
