import * as React from 'react'
import { OTPField as BaseOTPField } from '@base-ui/react/otp-field'

import { useControlSize } from '../shared/control-size'
import './otp-field.css'
import './otp-field.tokens.css'
import './otp-slot.tokens.css'
import type { OtpSize } from './otp-slot.spec'

export interface OtpFieldProps extends Omit<React.ComponentProps<typeof BaseOTPField.Root>, 'className' | 'children' | 'length'> {
  /** Number of characters. */
  length?: number
  /** Defaults to the enclosing Field's size, else md. */
  size?: OtpSize
  className?: string
  /** Static state preview of every slot (docs, configurator). */
  'data-preview-state'?: 'hover' | 'focused'
}

/** Styles: otp-field.css (layout) + otp-field.tokens.css / otp-slot.tokens.css (generated from their specs). */
export function OtpField({ length = 6, size: sizeProp, className, 'data-preview-state': previewState, ...props }: OtpFieldProps) {
  const contextSize = useControlSize()
  const size = sizeProp ?? contextSize ?? 'md'
  return (
    <BaseOTPField.Root className={['ds-otp-field', className].filter(Boolean).join(' ')} data-size={size} length={length} {...props}>
      {Array.from({ length }, (_, i) => (
        <BaseOTPField.Input
          key={i}
          className="ds-otp-slot"
          data-size={size}
          data-preview-state={previewState}
          aria-label={i === 0 ? undefined : `Character ${i + 1} of ${length}`}
        />
      ))}
    </BaseOTPField.Root>
  )
}
