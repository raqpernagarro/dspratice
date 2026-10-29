import * as React from 'react'
import { Input as BaseInput } from '@base-ui/react/input'
import { MagnifyingGlass } from '@phosphor-icons/react'

import { useControlSize } from '../shared/control-size'
import './input.css'
import './input.tokens.css'
import type { InputSize } from './input.spec'

export type { InputSize }

export interface InputProps extends Omit<React.ComponentProps<typeof BaseInput>, 'size' | 'className' | 'style'> {
  /** Defaults to the enclosing Field's size, else md. */
  size?: InputSize
  /** Leading icon (decorative). Defaults to a magnifying glass, like the Figma component. */
  icon?: React.ReactNode
  /** Show the leading icon (Figma: Show icon). Default true. */
  showIcon?: boolean
  className?: string
  style?: React.CSSProperties
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover' | 'focused'
}

/** Styles: input.css (layout) + input.tokens.css (generated from input.spec.ts). */
export function Input({ size, icon = <MagnifyingGlass weight="fill" />, showIcon = true, className, style, 'data-preview-state': previewState, ...props }: InputProps) {
  const contextSize = useControlSize()
  return (
    // A <label> so clicking the icon or padding focuses the input.
    <label
      className={['ds-input', className].filter(Boolean).join(' ')}
      style={style}
      data-size={size ?? contextSize ?? 'md'}
      data-preview-state={previewState}
    >
      {showIcon && icon ? (
        <span className="ds-input__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <BaseInput className="ds-input__value" {...props} />
    </label>
  )
}
