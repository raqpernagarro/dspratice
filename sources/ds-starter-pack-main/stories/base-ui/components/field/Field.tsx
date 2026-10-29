import * as React from 'react'
import { Field as BaseField } from '@base-ui/react/field'

import './field.css'
import './field.tokens.css'
import { ControlSizeContext } from '../shared/control-size'
import type { FieldSize } from './field.spec'

export type { FieldSize }

export interface FieldProps extends Omit<React.ComponentProps<typeof BaseField.Root>, 'className' | 'children'> {
  label: React.ReactNode
  description?: React.ReactNode
  /** Message shown while the field is invalid (constraint validation, `validate`, or `invalid`). */
  error?: React.ReactNode
  size?: FieldSize
  className?: string
  /** The control: usually an Input, which takes the Field's size. */
  children: React.ReactNode
}

/** Styles: field.css (layout) + field.tokens.css (generated from field.spec.ts). */
export function Field({ label, description, error, size = 'md', className, children, ...props }: FieldProps) {
  return (
    <ControlSizeContext.Provider value={size}>
      <BaseField.Root className={['ds-field', className].filter(Boolean).join(' ')} data-size={size} {...props}>
        <BaseField.Label className="ds-field__label">{label}</BaseField.Label>
        {children}
        {description ? <BaseField.Description className="ds-field__description">{description}</BaseField.Description> : null}
        {/* Base UI shows the error for its own validation; `invalid` set from outside needs match. */}
        {error ? (
          <BaseField.Error className="ds-field__error" match={props.invalid ? true : undefined}>
            {error}
          </BaseField.Error>
        ) : null}
      </BaseField.Root>
    </ControlSizeContext.Provider>
  )
}
