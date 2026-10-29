// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7353
// component=Accordion.Item

const figma = require("figma")

const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})
const title = figma.selectedInstance.getString("Title")
const children = figma.properties.slot("Panel")

export default {
  id: "Accordion.Item",
  imports: ["import { Accordion } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Accordion.Item${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )}${figma.helpers.react.renderProp(
    "title",
    title,
  )}>${figma.helpers.react.renderChildren(children)}</Accordion.Item>`,
  metadata: { nestable: true },
}
