// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6908
// component=AlertDialog.Popup

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
  id: "AlertDialog.Popup",
  imports: ["import { AlertDialog } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<AlertDialog.Popup${figma.helpers.react.renderProp(
    "showClose",
    showClose,
  )}>
      <AlertDialog.Title>${figma.helpers.react.renderChildren(
        title,
      )}</AlertDialog.Title>
      <AlertDialog.Description>${figma.helpers.react.renderChildren(
        description,
      )}</AlertDialog.Description>
      <AlertDialog.Body>${figma.helpers.react.renderChildren(
        body,
      )}</AlertDialog.Body>
      <AlertDialog.Actions>${figma.helpers.react.renderChildren(
        actions,
      )}</AlertDialog.Actions>
    </AlertDialog.Popup>`,
  metadata: { nestable: true },
}
