import { IconButton } from '../../components/icon-button/IconButton'
import type { ButtonSize, ButtonType } from '../../components/button/Button'
import { IconButtonDemoIcon } from '../../shared/button-demo-icons'

export interface IconButtonDemoProps {
  variant?: ButtonType
  size?: ButtonSize
  destructive?: boolean
  disabled?: boolean
}

export function IconButtonDemo({
  variant = 'primary',
  size = 'md',
  destructive = false,
  disabled = false,
}: IconButtonDemoProps) {
  return (
    <IconButton
      variant={variant}
      size={size}
      destructive={destructive}
      disabled={disabled}
      label="Home"
      icon={<IconButtonDemoIcon />}
    />
  )
}
