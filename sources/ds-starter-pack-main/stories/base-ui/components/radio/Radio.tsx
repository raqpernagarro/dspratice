import * as React from 'react'
import { Radio as BaseRadio } from '@base-ui/react/radio'

import { useControlSize } from '../shared/control-size'
import './radio.css'
import './radio.tokens.css'
import type { RadioSize } from './radio.spec'

export type { RadioSize }

export interface RadioProps extends Omit<React.ComponentProps<typeof BaseRadio.Root>, 'className' | 'style' | 'children'> {
  /** Defaults to the enclosing Radio Group's size, else md. */
  size?: RadioSize
  /** The option's label. */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover' | 'pressed'
}

/** Styles: radio.css (layout) + radio.tokens.css (generated from radio.spec.ts). */
export function Radio({ size: sizeProp, children, className, style, 'data-preview-state': previewState, ...props }: RadioProps) {
  const contextSize = useControlSize()
  const size = sizeProp ?? contextSize ?? 'md'
  return (
    <label className={['ds-radio', className].filter(Boolean).join(' ')} style={style} data-size={size} data-preview-state={previewState}>
      <BaseRadio.Root className="ds-radio__control" {...props}>
        <BaseRadio.Indicator className="ds-radio__indicator" />
      </BaseRadio.Root>
      {children ? <span className="ds-radio__label">{children}</span> : null}
    </label>
  )
}
