// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-7304
// component=Meter

const figma = require("figma")

const value = figma.selectedInstance.getEnum("Value", {
  "0%": 0,
  "25%": 25,
  "50%": 50,
  "75%": 75,
  "100%": 100,
})
const label = figma.selectedInstance.getBoolean("Show label", {
  true: figma.selectedInstance.getString("Label"),
  false: undefined,
})
const showValue = figma.selectedInstance.getBoolean("Show value")

export default {
  id: "Meter",
  imports: ["import { Meter } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Meter${figma.helpers.react.renderProp(
    "value",
    value,
  )}${figma.helpers.react.renderProp(
    "label",
    label,
  )}${figma.helpers.react.renderProp("showValue", showValue)}/>`,
  metadata: { nestable: true },
}
