import * as React from 'react'
import { Switch as BaseSwitch } from '@base-ui/react/switch'

import './switch.css'
import './switch.tokens.css'
import { useControlSize } from '../shared/control-size'
import type { SwitchSize } from './switch.spec'

export type { SwitchSize }

export interface SwitchProps extends Omit<React.ComponentProps<typeof BaseSwitch.Root>, 'className' | 'style' | 'children'> {
  size?: SwitchSize
  /** The label. Omit it for a bare switch, and pass aria-label instead. */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** Static state preview (docs, configurator). */
  'data-preview-state'?: 'hover' | 'pressed'
}

/** Styles: switch.css (layout) + switch.tokens.css (generated from switch.spec.ts). */
export function Switch({ size: sizeProp, children, className, style, 'data-preview-state': previewState, ...props }: SwitchProps) {
  const contextSize = useControlSize()
  const size = sizeProp ?? contextSize ?? 'md'
  return (
    <label className={['ds-switch', className].filter(Boolean).join(' ')} style={style} data-size={size} data-preview-state={previewState}>
      <BaseSwitch.Root className="ds-switch__control" {...props}>
        <BaseSwitch.Thumb className="ds-switch__thumb" />
      </BaseSwitch.Root>
      {children ? <span className="ds-switch__label">{children}</span> : null}
    </label>
  )
}
