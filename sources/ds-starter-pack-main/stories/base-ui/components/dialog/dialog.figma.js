// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6798
// component=Dialog.Popup

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
  id: "Dialog.Popup",
  imports: ["import { Dialog } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Dialog.Popup${figma.helpers.react.renderProp(
    "showClose",
    showClose,
  )}>
      <Dialog.Title>${figma.helpers.react.renderChildren(title)}</Dialog.Title>
      <Dialog.Description>${figma.helpers.react.renderChildren(
        description,
      )}</Dialog.Description>
      <Dialog.Body>${figma.helpers.react.renderChildren(body)}</Dialog.Body>
      <Dialog.Actions>${figma.helpers.react.renderChildren(
        actions,
      )}</Dialog.Actions>
    </Dialog.Popup>`,
  metadata: { nestable: true },
}
