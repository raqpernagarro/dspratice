import * as React from 'react'
import { Button as BaseButton } from '@base-ui/react/button'

import './icon-button.css'
import './icon-button.tokens.css'
import type { ButtonSize, ButtonType } from '../button/button.spec'

export interface IconButtonProps extends React.ComponentProps<typeof BaseButton> {
  /** Figma's Type. (`type` stays the native attribute.) */
  variant?: ButtonType
  size?: ButtonSize
  destructive?: boolean
  /** Accessible name (aria-label). Required: it's the only name screen readers announce. */
  label: string
  icon: React.ReactNode
}

/** Styles: icon-button.css (layout) + icon-button.tokens.css (generated from icon-button.spec.ts). */
export function IconButton({
  variant = 'primary',
  size = 'md',
  destructive = false,
  label,
  icon,
  className,
  ...props
}: IconButtonProps) {
  return (
    <BaseButton
      className={['ds-icon-button', className].filter(Boolean).join(' ')}
      aria-label={label}
      data-type={variant}
      data-size={size}
      data-destructive={destructive ? 'true' : 'false'}
      {...props}
    >
      <span className="ds-icon-button__icon" aria-hidden>{icon}</span>
    </BaseButton>
  )
}
