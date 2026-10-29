// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=179-2495
// source=src/components/atoms/DataTableCell/DataTableCell.tsx
// component=DataTableCell
import figma from 'figma'
const instance = figma.selectedInstance
const flag = (prop: string) => instance.getEnum(prop, { True: true, False: false }) === true
const swap = (prop: string) => {
  const node = instance.getInstanceSwap(prop)
  return node && node.type === 'INSTANCE' ? node.executeTemplate().example : undefined
}
const q = (value: string) => (value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`)
const bool = (name: string, value: boolean | undefined) => (value ? `\n  ${name}` : '')
const fieldType = instance.getEnum('Field type', {
  "String": 'string',
  "Main": 'main',
  "Icon": 'icon',
  "Text field (single line)": 'text',
  "Text field (long text)": 'long-text',
  "Email": 'email',
  "Phone number": 'phone',
  "Address": 'address',
  "Contact": 'contact',
  "Date and time": 'datetime',
  "Date": 'date',
  "Month and year": 'month-year',
  "Number": 'number',
  "Range": 'range',
  "Single choice": 'single-choice',
  "Multi choice": 'multi-choice',
  "Single user or team": 'single-user',
  "Multiple users or teams": 'multi-user',
  "URL": 'url',
  "URL read-only": 'url-readonly',
  "Boolean": 'boolean',
  "Buttons": 'buttons',
  "Tags single choice": 'tags-single',
  "Tags multi choice": 'tags-multi',
  "Tags read-only": 'tags-readonly',
  "File (single)": 'file',
  "Checkbox (row selection)": 'checkbox',
  "Contacts (table)": 'contacts',
  "Contacts (description list)": 'contacts-list',
  "Empty": 'empty',
  "Expand": 'expand',
})
// Which Figma text property carries the cell value for each field type.
const VALUE_PROP: Record<string, string> = {
  'string': "Label",
  'main': "Label",
  'text': "Label",
  'long-text': "Label",
  'email': "Label",
  'phone': "Label",
  'address': "Address",
  'contact': "Label",
  'datetime': "Date",
  'date': "Date",
  'month-year': "Month Year",
  'number': "Number",
  'range': "Range",
  'single-choice': "Label",
  'single-user': "Label",
  'url': "Link",
  'url-readonly': "Link",
  'tags-single': "Label",
  'file': "Label",
  'empty': "Empty placeholder",
}
const valueProp = fieldType ? VALUE_PROP[fieldType] : undefined
const value = valueProp ? instance.getString(valueProp) : undefined
const leading = instance.getBoolean('Show leading icon') ? swap('Leading icon') : undefined

export default {
  example: figma.code`<DataTableCell
  fieldType="${fieldType}"${value !== undefined ? `\n  value=${q(value)}` : '\n  value={value}'}${leading ? figma.code`
  leadingAccessory={${leading}}` : ''}${bool('loading', flag('Loading'))}
/>`,
  imports: [
    "import { DataTableCell } from 'ds-ngr'",
  ],
  id: 'data-table-cell',
  metadata: { nestable: true, props: {} },
}
