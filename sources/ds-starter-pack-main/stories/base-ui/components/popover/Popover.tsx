import * as React from 'react'
import { Popover as BasePopover } from '@base-ui/react/popover'

import { Button, type ButtonProps } from '../button/Button'
import type { PopupSide } from '../shared/popup'
import '../shared/popup.css'
import './popover.css'
import './popover.tokens.css'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

export interface PopoverTriggerProps extends Omit<React.ComponentProps<typeof BasePopover.Trigger>, 'render' | 'className'> {
  /** Button look of the trigger (default secondary). */
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
}

/** Opens the popover: a Button. */
function Trigger({ variant = 'secondary', size = 'md', className, children, ...props }: PopoverTriggerProps) {
  return (
    <BasePopover.Trigger {...props} render={<Button variant={variant} size={size} className={className} />}>
      {children}
    </BasePopover.Trigger>
  )
}

export interface PopoverPopupProps extends Omit<React.ComponentProps<typeof BasePopover.Popup>, 'className'> {
  className?: string
  side?: React.ComponentProps<typeof BasePopover.Positioner>['side']
  align?: React.ComponentProps<typeof BasePopover.Positioner>['align']
  sideOffset?: number
  /** Show the arrow pointing at the trigger (default true). */
  arrow?: boolean
}

/** Portal + positioner + popup (+ arrow), so a popover is Root › Trigger + Popup › content. */
function Popup({ className, side, align, sideOffset = 8, arrow = true, children, ...props }: PopoverPopupProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner className="ds-popover__positioner" side={side} align={align} sideOffset={sideOffset}>
        <BasePopover.Popup className={cx('ds-popup ds-popover', className)} {...props}>
          {arrow ? <BasePopover.Arrow className="ds-arrow ds-popover__arrow" /> : null}
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}

function Title({ className, ...props }: Omit<React.ComponentProps<typeof BasePopover.Title>, 'className'> & { className?: string }) {
  return <BasePopover.Title className={cx('ds-popover__title', className)} {...props} />
}

function Description({ className, ...props }: Omit<React.ComponentProps<typeof BasePopover.Description>, 'className'> & { className?: string }) {
  return <BasePopover.Description className={cx('ds-popover__description', className)} {...props} />
}

/** Styles: popover.css (layout) + popover.tokens.css (generated from popover.spec.ts). */
export const Popover = {
  Root: BasePopover.Root,
  Trigger,
  Popup,
  Title,
  Description,
  Close: BasePopover.Close,
}

/** The popup drawn statically, as in Figma (docs, configurator). */
export function PopoverPreview({ side = 'bottom', title = 'Notifications', description = 'You are all caught up. Good job!' }: { side?: PopupSide; title?: string; description?: string }) {
  return (
    <div className="ds-popup ds-popover" data-preview style={{ width: 240 }}>
      <div className="ds-arrow ds-popover__arrow" data-side={side} data-preview />
      <h2 className="ds-popover__title">{title}</h2>
      <p className="ds-popover__description">{description}</p>
    </div>
  )
}
