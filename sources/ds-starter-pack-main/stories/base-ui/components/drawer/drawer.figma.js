// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7066
// component=Drawer.Popup

const figma = require("figma")

const title = figma.selectedInstance.getString("Title")
const description = figma.selectedInstance.getBoolean("Show description", {
  true: figma.selectedInstance.getString("Description"),
  false: undefined,
})
const showClose = figma.selectedInstance.getBoolean("Show close")
const body = figma.properties.slot("Body")
const actions = figma.properties.slot("Actions")

export default {
  id: "Drawer.Popup",
  imports: ["import { Drawer } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Drawer.Popup${figma.helpers.react.renderProp(
    "showClose",
    showClose,
  )}>
      <Drawer.Title>${figma.helpers.react.renderChildren(title)}</Drawer.Title>
      <Drawer.Description>${figma.helpers.react.renderChildren(
        description,
      )}</Drawer.Description>
      <Drawer.Body>${figma.helpers.react.renderChildren(body)}</Drawer.Body>
      <Drawer.Actions>${figma.helpers.react.renderChildren(
        actions,
      )}</Drawer.Actions>
    </Drawer.Popup>`,
  metadata: { nestable: true },
}
