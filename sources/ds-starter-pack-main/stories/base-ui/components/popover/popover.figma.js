// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6642
// component=Popover.Popup

const figma = require("figma")

const arrow = figma.selectedInstance.getBoolean("Show arrow")
const title = figma.selectedInstance.getBoolean("Show title", {
  true: figma.selectedInstance.getString("Title"),
  false: undefined,
})
const description = figma.selectedInstance.getBoolean("Show description", {
  true: figma.selectedInstance.getString("Description"),
  false: undefined,
})
const children = figma.properties.slot("Content")

export default {
  id: "Popover.Popup",
  imports: ["import { Popover } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Popover.Popup${figma.helpers.react.renderProp(
    "arrow",
    arrow,
  )}>
      <Popover.Title>${figma.helpers.react.renderChildren(
        title,
      )}</Popover.Title>
      <Popover.Description>${figma.helpers.react.renderChildren(
        description,
      )}</Popover.Description>
      ${figma.helpers.react.renderChildren(children)}
    </Popover.Popup>`,
  metadata: { nestable: true },
}
