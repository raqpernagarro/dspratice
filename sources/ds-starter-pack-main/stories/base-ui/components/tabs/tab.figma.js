// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7242
// component=Tabs.Tab

const figma = require("figma")

const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})
const children = figma.selectedInstance.getString("Label")

export default {
  id: "Tabs.Tab",
  imports: ["import { Tabs } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Tabs.Tab${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )} value="tab">${figma.helpers.react.renderChildren(children)}</Tabs.Tab>`,
  metadata: { nestable: true },
}
