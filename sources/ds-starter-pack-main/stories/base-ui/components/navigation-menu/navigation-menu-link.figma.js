// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6755
// component=NavigationMenu.Card

const figma = require("figma")

const title = figma.selectedInstance.getString("Title")
const description = figma.selectedInstance.getBoolean("Show description", {
  true: figma.selectedInstance.getString("Description"),
  false: undefined,
})

export default {
  id: "NavigationMenu.Card",
  imports: ["import { NavigationMenu } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<NavigationMenu.Card${figma.helpers.react.renderProp(
    "title",
    title,
  )}${figma.helpers.react.renderProp("description", description)}/>`,
  metadata: { nestable: true },
}
