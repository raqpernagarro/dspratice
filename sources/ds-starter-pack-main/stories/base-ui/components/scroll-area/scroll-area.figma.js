// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7496
// component=ScrollArea

const figma = require("figma")

const children = figma.properties.slot("Content")

export default {
  id: "ScrollArea",
  imports: ["import { ScrollArea } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<ScrollArea>${figma.helpers.react.renderChildren(
    children,
  )}</ScrollArea>`,
  metadata: { nestable: true },
}
