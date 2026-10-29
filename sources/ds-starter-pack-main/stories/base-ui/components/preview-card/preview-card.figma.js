// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6684
// component=PreviewCard.Popup

const figma = require("figma")

const arrow = figma.selectedInstance.getBoolean("Show arrow")

export default {
  id: "PreviewCard.Popup",
  imports: ["import { PreviewCard } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<PreviewCard.Popup${figma.helpers.react.renderProp(
    "arrow",
    arrow,
  )}/>`,
  metadata: { nestable: true },
}
