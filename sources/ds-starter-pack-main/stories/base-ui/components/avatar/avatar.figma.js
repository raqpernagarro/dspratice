// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2058-5716
// component=Avatar

const figma = require("figma")

const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const initials = figma.selectedInstance.getString("Initials")

export default {
  id: "Avatar",
  imports: ["import { Avatar } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Avatar${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp("initials", initials)}/>`,
  metadata: { nestable: true },
}
