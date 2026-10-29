import type { Icon } from '@phosphor-icons/react'
import type { IconProps } from '@phosphor-icons/react'

/** Fills the button / icon-button `.Icon` slot (see `button.module.css`). */
export const phosphorSlotProps: Pick<IconProps, 'aria-hidden'> = {
  'aria-hidden': true,
}

export function phosphorSlotIcon(
  IconComponent: Icon,
  options: Pick<IconProps, 'weight'> = { weight: 'fill' },
) {
  return function SlotIcon(props: IconProps) {
    return <IconComponent {...phosphorSlotProps} {...options} {...props} />
  }
}
