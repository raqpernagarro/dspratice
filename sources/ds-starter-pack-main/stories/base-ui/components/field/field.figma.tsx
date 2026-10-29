/* Generated from field.spec.ts by `npm run ds:code-connect`. Do not edit. */
import figma from '@figma/code-connect'

import { Field } from './Field'

figma.connect(Field, 'https://www.figma.com/design/0lCfWZBgpscbrOKQ7iIRi8/?node-id=2059-6330', {
  props: {
    size: figma.enum('Size', { 'Small': 'sm', 'Medium': 'md', 'Large': 'lg' }),
    invalid: figma.enum('Invalid', { 'True': true, 'False': false }),
    label: figma.string('Label'),
    description: figma.boolean('Show description', { true: figma.string('Description'), false: undefined }),
    error: figma.string('Error'),
    children: figma.slot('Control'),
  },
  example: ({ size, invalid, label, description, error, children }) => <Field size={size} invalid={invalid} label={label} description={description} error={error}>{children}</Field>,
})
