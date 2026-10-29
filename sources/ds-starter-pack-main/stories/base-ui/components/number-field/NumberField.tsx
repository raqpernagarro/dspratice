import * as React from 'react'
import { NumberField as BaseNumberField } from '@base-ui/react/number-field'
import { Minus, Plus } from '@phosphor-icons/react'

import { useControlSize } from '../shared/control-size'
import './number-field.css'
import './number-field.tokens.css'
import type { NumberFieldSize } from './number-field.spec'

export type { NumberFieldSize }

export interface NumberFieldProps extends Omit<React.ComponentProps<typeof BaseNumberField.Root>, 'className'> {
  /** Defaults to the enclosing Field's size, else md. */
  size?: NumberFieldSize
  className?: string
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover' | 'focused'
}

/**
 * Styles: number-field.css (layout) + number-field.tokens.css (generated from number-field.spec.ts).
 * `aria-label` / `aria-labelledby` name the input, for use outside a Field (inside one, its label does).
 */
export function NumberField({ size: sizeProp, className, 'data-preview-state': previewState, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, ...props }: NumberFieldProps) {
  const contextSize = useControlSize()
  const size = sizeProp ?? contextSize ?? 'md'
  return (
    <BaseNumberField.Root className="ds-number-field__root" {...props}>
      <BaseNumberField.Group className={['ds-number-field', className].filter(Boolean).join(' ')} data-size={size} data-preview-state={previewState}>
        <BaseNumberField.Decrement className="ds-number-field__decrement" aria-label="Decrease">
          <span className="ds-number-field__decrement-icon" aria-hidden>
            <Minus weight="bold" />
          </span>
        </BaseNumberField.Decrement>
        <BaseNumberField.Input className="ds-number-field__value" aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} />
        <BaseNumberField.Increment className="ds-number-field__increment" aria-label="Increase">
          <span className="ds-number-field__increment-icon" aria-hidden>
            <Plus weight="bold" />
          </span>
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  )
}
