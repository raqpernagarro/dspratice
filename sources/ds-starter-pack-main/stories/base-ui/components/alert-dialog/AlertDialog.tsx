import * as React from 'react'
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog'

import { X } from '@phosphor-icons/react'

import { Button, type ButtonProps } from '../button/Button'
import { IconButton } from '../icon-button/IconButton'
import './alert-dialog.css'
import './alert-dialog.tokens.css'

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(' ')

type ButtonLook = Pick<ButtonProps, 'variant' | 'size' | 'destructive'>

/** Opens the dialog: a Button. */
function Trigger({ variant = 'secondary', size, destructive, className, ...props }: Omit<React.ComponentProps<typeof BaseAlertDialog.Trigger>, 'render' | 'className'> & ButtonLook & { className?: string }) {
  return <BaseAlertDialog.Trigger {...props} render={<Button variant={variant} size={size} destructive={destructive} className={className} />} />
}

export interface AlertDialogPopupProps extends Omit<React.ComponentProps<typeof BaseAlertDialog.Popup>, 'className'> {
  className?: string
  /** A cross in the top corner that closes it (Figma: Show close). */
  showClose?: boolean
}

/** Portal + backdrop + popup (+ close button). */
function Popup({ className, showClose = false, children, ...props }: AlertDialogPopupProps) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className="ds-alert-dialog__backdrop" />
      <BaseAlertDialog.Popup className={cx('ds-alert-dialog', className)} {...props}>
        {children}
        {showClose ? (
          <BaseAlertDialog.Close className="ds-alert-dialog__close" render={<IconButton variant="ghost" size="sm" label="Close" icon={<X weight="bold" />} />} />
        ) : null}
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
  )
}

const Header = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cx('ds-alert-dialog__header', className)} {...props} />
/** Anything between the header and the actions: a form, a list (Figma: Body slot). */
const Body = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cx('ds-alert-dialog__body', className)} {...props} />
const Actions = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cx('ds-alert-dialog__actions', className)} {...props} />

function Title({ className, ...props }: Omit<React.ComponentProps<typeof BaseAlertDialog.Title>, 'className'> & { className?: string }) {
  return <BaseAlertDialog.Title className={cx('ds-alert-dialog__title', className)} {...props} />
}

function Description({ className, ...props }: Omit<React.ComponentProps<typeof BaseAlertDialog.Description>, 'className'> & { className?: string }) {
  return <BaseAlertDialog.Description className={cx('ds-alert-dialog__description', className)} {...props} />
}

/** Closes the dialog: a Button (default secondary). */
function Close({ variant = 'secondary', size, destructive, className, ...props }: Omit<React.ComponentProps<typeof BaseAlertDialog.Close>, 'render' | 'className'> & ButtonLook & { className?: string }) {
  return <BaseAlertDialog.Close {...props} render={<Button variant={variant} size={size} destructive={destructive} className={className} />} />
}

/**
 * Dialog's anatomy with its own tokens; it can't be dismissed by clicking outside.
 * Styles: alert-dialog.css (layout) + alert-dialog.tokens.css (generated from alert-dialog.spec.ts).
 *   Root › Trigger + Popup › Header (Title, Description) + Body + Actions (Close, Button)
 */
export const AlertDialog = { Root: BaseAlertDialog.Root, Trigger, Popup, Header, Title, Description, Body, Actions, Close }

/** The popup drawn statically, as in Figma (docs, configurator). */
export function AlertDialogPreview() {
  return (
    <div className="ds-alert-dialog" data-preview>
      <div className="ds-alert-dialog__header">
        <h2 className="ds-alert-dialog__title">Discard draft?</h2>
        <p className="ds-alert-dialog__description">You can’t undo this action.</p>
      </div>
      <div className="ds-alert-dialog__actions">
        <Button variant="secondary" tabIndex={-1}>
          Cancel
        </Button>
        <Button destructive tabIndex={-1}>
          Discard
        </Button>
      </div>
    </div>
  )
}
