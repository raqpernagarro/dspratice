// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6659
// component=Tooltip.Popup

const figma = require("figma")

const arrow = figma.selectedInstance.getBoolean("Show arrow")
const children = figma.selectedInstance.getString("Label")

export default {
  id: "Tooltip.Popup",
  imports: ["import { Tooltip } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Tooltip.Popup${figma.helpers.react.renderProp(
    "arrow",
    arrow,
  )}>${figma.helpers.react.renderChildren(children)}</Tooltip.Popup>`,
  metadata: { nestable: true },
}
