// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2056-4303
// component=Toggle

const figma = require("figma")

const pressed = figma.selectedInstance.getEnum("Selected", {
  True: true,
  False: false,
})
const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})
const icon = figma.selectedInstance
  .getInstanceSwap("Icon")
  ?.executeTemplate().example

export default {
  id: "Toggle",
  imports: ["import { Toggle } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Toggle${figma.helpers.react.renderProp(
    "pressed",
    pressed,
  )}${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )}${figma.helpers.react.renderProp(
    "icon",
    icon,
  )} label="Describe the option"/>`,
  metadata: { nestable: true },
}
