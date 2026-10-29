// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=261-1993
// component=IconButton

const figma = require("figma")

const variant = figma.selectedInstance.getEnum("Type", {
  Primary: "primary",
  Secondary: "secondary",
  Ghost: "ghost",
  Outline: "outline",
})
const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const disabled = figma.selectedInstance.getEnum("State", {
  Disabled: true,
})
const destructive = figma.selectedInstance.getEnum("Destructive", {
  False: false,
  True: true,
})
const icon = figma.selectedInstance
  .getInstanceSwap("Icon")
  ?.executeTemplate().example

export default {
  id: "IconButton",
  imports: ["import { IconButton } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<IconButton${figma.helpers.react.renderProp(
    "variant",
    variant,
  )}${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp(
    "disabled",
    disabled,
  )}${figma.helpers.react.renderProp(
    "destructive",
    destructive,
  )}${figma.helpers.react.renderProp(
    "icon",
    icon,
  )} label="Describe the action"/>`,
  metadata: { nestable: true },
}
