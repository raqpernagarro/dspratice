// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2057-5316
// component=Menubar.Trigger

const figma = require("figma")

const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})
const children = figma.selectedInstance.findText("label").__render__()

export default {
  id: "Menubar.Trigger",
  imports: ["import { Menubar } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Menubar.Trigger${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )}>${figma.helpers.react.renderChildren(children)}</Menubar.Trigger>`,
  metadata: { nestable: true },
}
