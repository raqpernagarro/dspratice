// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7452
// component=Collapsible

const figma = require("figma")

const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})
const label = figma.selectedInstance.getString("Label")
const children = figma.properties.slot("Panel")

export default {
  id: "Collapsible",
  imports: ["import { Collapsible } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Collapsible${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )}${figma.helpers.react.renderProp(
    "label",
    label,
  )}>${figma.helpers.react.renderChildren(children)}</Collapsible>`,
  metadata: { nestable: true },
}
