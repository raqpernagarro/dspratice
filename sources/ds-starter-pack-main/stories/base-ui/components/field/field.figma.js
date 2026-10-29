// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6330
// component=Field

const figma = require("figma")

const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const invalid = figma.selectedInstance.getEnum("Invalid", {
  True: true,
  False: false,
})
const label = figma.selectedInstance.getString("Label")
const description = figma.selectedInstance.getBoolean("Show description", {
  true: figma.selectedInstance.getString("Description"),
  false: undefined,
})
const error = figma.selectedInstance.getString("Error")
const children = figma.properties.slot("Control")

export default {
  id: "Field",
  imports: ["import { Field } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Field${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp(
    "invalid",
    invalid,
  )}${figma.helpers.react.renderProp(
    "label",
    label,
  )}${figma.helpers.react.renderProp(
    "description",
    description,
  )}${figma.helpers.react.renderProp(
    "error",
    error,
  )}>${figma.helpers.react.renderChildren(children)}</Field>`,
  metadata: { nestable: true },
}
