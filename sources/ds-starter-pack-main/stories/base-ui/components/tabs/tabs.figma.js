// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7273
// component=Tabs.Root

const figma = require("figma")

const size = figma.selectedInstance.getEnum("Size", {
  Small: "sm",
  Medium: "md",
  Large: "lg",
})
const panel = figma.properties.slot("Panel")

export default {
  id: "Tabs.Root",
  imports: ["import { Tabs } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Tabs.Root${figma.helpers.react.renderProp("size", size)}>
      <Tabs.Panel value="tab">${figma.helpers.react.renderChildren(
        panel,
      )}</Tabs.Panel>
    </Tabs.Root>`,
  metadata: { nestable: true },
}
