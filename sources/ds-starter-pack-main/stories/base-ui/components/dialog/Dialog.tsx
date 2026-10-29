import * as React from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'

import { X } from '@phosphor-icons/react'

import { Button, type ButtonProps } from '../button/Button'
import { IconButton } from '../icon-button/IconButton'
import './dialog.css'
import './dialog.tokens.css'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

type ButtonLook = Pick<ButtonProps, 'variant' | 'size' | 'destructive'>

/** Opens the dialog: a Button. */
function Trigger({ variant = 'secondary', size, destructive, className, ...props }: Omit<React.ComponentProps<typeof BaseDialog.Trigger>, 'render' | 'className'> & ButtonLook & { className?: string }) {
  return <BaseDialog.Trigger {...props} render={<Button variant={variant} size={size} destructive={destructive} className={className} />} />
}

export interface DialogPopupProps extends Omit<React.ComponentProps<typeof BaseDialog.Popup>, 'className'> {
  className?: string
  /** A cross in the top corner that closes it (Figma: Show close). */
  showClose?: boolean
}

/** Portal + backdrop + popup (+ close button). */
function Popup({ className, showClose = true, children, ...props }: DialogPopupProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="ds-dialog__backdrop" />
      <BaseDialog.Popup className={cx('ds-dialog', className)} {...props}>
        {children}
        {showClose ? (
          <BaseDialog.Close className="ds-dialog__close" render={<IconButton variant="ghost" size="sm" label="Close" icon={<X weight="bold" />} />} />
        ) : null}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}

const Header = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cx('ds-dialog__header', className)} {...props} />
/** Anything between the header and the actions: a form, a list (Figma: Body slot). */
const Body = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cx('ds-dialog__body', className)} {...props} />
const Actions = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cx('ds-dialog__actions', className)} {...props} />

function Title({ className, ...props }: Omit<React.ComponentProps<typeof BaseDialog.Title>, 'className'> & { className?: string }) {
  return <BaseDialog.Title className={cx('ds-dialog__title', className)} {...props} />
}

function Description({ className, ...props }: Omit<React.ComponentProps<typeof BaseDialog.Description>, 'className'> & { className?: string }) {
  return <BaseDialog.Description className={cx('ds-dialog__description', className)} {...props} />
}

/** Closes the dialog: a Button (default secondary). */
function Close({ variant = 'secondary', size, destructive, className, ...props }: Omit<React.ComponentProps<typeof BaseDialog.Close>, 'render' | 'className'> & ButtonLook & { className?: string }) {
  return <BaseDialog.Close {...props} render={<Button variant={variant} size={size} destructive={destructive} className={className} />} />
}

/**
 * Styles: dialog.css (layout) + dialog.tokens.css (generated from dialog.spec.ts).
 *   Root › Trigger + Popup › Header (Title, Description) + Body + Actions (Close, Button)
 */
export const Dialog = { Root: BaseDialog.Root, Trigger, Popup, Header, Title, Description, Body, Actions, Close }

/** The popup drawn statically, as in Figma (docs, configurator). */
export function DialogPreview() {
  return (
    <div className="ds-dialog" data-preview>
      <div className="ds-dialog__header">
        <h2 className="ds-dialog__title">Notifications</h2>
        <p className="ds-dialog__description">You are all caught up. Good job!</p>
      </div>
      <div className="ds-dialog__actions">
        <Button variant="secondary" tabIndex={-1}>
          Close
        </Button>
      </div>
      <IconButton className="ds-dialog__close" variant="ghost" size="sm" label="Close" icon={<X weight="bold" />} tabIndex={-1} />
    </div>
  )
}
