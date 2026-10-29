// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-4062
// component=OtpField

const figma = require("figma")

const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})

export default {
  id: "OtpField",
  imports: ["import { OtpField } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<OtpField${figma.helpers.react.renderProp(
    "size",
    size,
  )}/>`,
  metadata: { nestable: true },
}
