// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=221-2
// component=Button

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
const children = figma.selectedInstance.findText("label").__render__()

export default {
  id: "Button",
  imports: ["import { Button } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Button${figma.helpers.react.renderProp(
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
  )}>${figma.helpers.react.renderChildren(children)}</Button>`,
  metadata: { nestable: true },
}
