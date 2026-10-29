import type * as React from 'react'
import { Button, type ButtonSize, type ButtonType } from '../../components/button/Button'
import { ButtonDemoLeadIcon, ButtonDemoTrailIcon } from '../../shared/button-demo-icons'

export interface ButtonDemoProps {
  variant?: ButtonType
  size?: ButtonSize
  destructive?: boolean
  disabled?: boolean
  showIcons?: boolean
  label?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export function ButtonDemo({
  variant = 'primary',
  size = 'md',
  destructive = false,
  disabled = false,
  showIcons = true,
  label = 'Button',
  onClick,
}: ButtonDemoProps) {
  return (
    <Button
      variant={variant}
      size={size}
      destructive={destructive}
      disabled={disabled}
      onClick={onClick}
      leadIcon={showIcons ? <ButtonDemoLeadIcon /> : undefined}
      trailIcon={showIcons ? <ButtonDemoTrailIcon /> : undefined}
    >
      {label}
    </Button>
  )
}
