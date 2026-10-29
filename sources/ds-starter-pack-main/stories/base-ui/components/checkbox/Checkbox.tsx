import * as React from 'react'
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Check, Minus } from '@phosphor-icons/react'

import './checkbox.css'
import './checkbox.tokens.css'
import { useControlSize } from '../shared/control-size'
import type { CheckboxSize } from './checkbox.spec'

export type { CheckboxSize }

export interface CheckboxProps extends Omit<React.ComponentProps<typeof BaseCheckbox.Root>, 'className' | 'style' | 'children'> {
  /** Defaults to the enclosing group's size, else md. */
  size?: CheckboxSize
  /** The label. Omit it for a bare box, and pass aria-label instead. */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover' | 'pressed'
}

/** Styles: checkbox.css (layout) + checkbox.tokens.css (generated from checkbox.spec.ts). */
export function Checkbox({ size: sizeProp, children, className, style, 'data-preview-state': previewState, ...props }: CheckboxProps) {
  const contextSize = useControlSize()
  const size = sizeProp ?? contextSize ?? 'md'
  return (
    <label
      className={['ds-checkbox', className].filter(Boolean).join(' ')}
      style={style}
      data-size={size}
      data-preview-state={previewState}
    >
      <BaseCheckbox.Root className="ds-checkbox__control" {...props}>
        <BaseCheckbox.Indicator className="ds-checkbox__indicator">
          <Check className="ds-checkbox__check" weight="bold" aria-hidden />
          <Minus className="ds-checkbox__dash" weight="bold" aria-hidden />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {children ? <span className="ds-checkbox__label">{children}</span> : null}
    </label>
  )
}
