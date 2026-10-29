import * as React from 'react'
import { Form as BaseForm } from '@base-ui/react/form'

import './form.css'
import './form.tokens.css'

export interface FormProps extends Omit<React.ComponentProps<typeof BaseForm>, 'className'> {
  className?: string
}

/** Styles: form.css (layout) + form.tokens.css (generated from form.spec.ts). */
export function Form({ className, ...props }: FormProps) {
  return <BaseForm className={['ds-form', className].filter(Boolean).join(' ')} {...props} />
}

/** The row of buttons at the end of a form. */
export function FormActions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={['ds-form__actions', className].filter(Boolean).join(' ')} {...props} />
}
