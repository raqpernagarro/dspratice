// url=https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6413
// component=Form

const figma = require("figma")

const children = figma.properties.slot("Fields")
const actions = figma.properties.slot("Actions")

export default {
  id: "Form",
  imports: ["import { Form, FormActions } from 'nagarro-ds-starter-pack'"],
  example: figma.code`<Form>
      <FormActions>${figma.helpers.react.renderChildren(actions)}</FormActions>
      ${figma.helpers.react.renderChildren(children)}
    </Form>`,
  metadata: { nestable: true },
}
