import * as React from 'react'
import { Button as BaseButton } from '@base-ui/react/button'

import './button.css'
import './button.tokens.css'
import type { ButtonSize, ButtonType } from './button.spec'

export type { ButtonSize, ButtonType }

export interface ButtonProps extends React.ComponentProps<typeof BaseButton> {
  /** Figma's Type. (`type` stays the native attribute: button / submit / reset.) */
  variant?: ButtonType
  size?: ButtonSize
  destructive?: boolean
  leadIcon?: React.ReactNode
  trailIcon?: React.ReactNode
}

/** Styles: button.css (layout) + button.tokens.css (generated from button.spec.ts). */
export function Button({
  variant = 'primary',
  size = 'md',
  destructive = false,
  leadIcon,
  trailIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={['ds-button', className].filter(Boolean).join(' ')}
      data-type={variant}
      data-size={size}
      data-destructive={destructive ? 'true' : 'false'}
      {...props}
    >
      {leadIcon ? <span className="ds-button__icon" aria-hidden>{leadIcon}</span> : null}
      {children ? <span className="ds-button__label">{children}</span> : null}
      {trailIcon ? <span className="ds-button__icon" aria-hidden>{trailIcon}</span> : null}
    </BaseButton>
  )
}
