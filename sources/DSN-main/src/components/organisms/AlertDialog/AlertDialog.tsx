import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../atoms/Button';
import { Checkbox } from '../../atoms/Checkbox';
import { FOCUSABLE_SELECTOR, useDialogFocus } from '../../../hooks/useDialogFocus';
import { useIsClient } from '../../../hooks/useIsClient';
import './AlertDialog.css';

export type AlertDialogVariant = 'default' | 'danger';

export interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  variant?: AlertDialogVariant;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  requireAcknowledgement?: boolean;
  acknowledgementLabel?: string;
  acknowledgementChecked?: boolean;
  defaultAcknowledgementChecked?: boolean;
  onAcknowledgementChange?: (checked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Modal alertdialog confirmation with Cancel / Confirm and an optional acknowledgement checkbox gating Confirm.
 *
 * @aiSelectWhen The user must confirm a destructive or high-impact action before it runs
 * @aiSelectWhen An irreversible action needs explicit acknowledgement — set requireAcknowledgement
 *
 * @aiAvoid Do not use for forms or multi-field tasks — use Modal instead
 * @aiAvoid Do not use to confirm a completed action — use Toast instead
 * @aiAvoid Do not use for a non-blocking page notice — use Callout instead
 * @aiAvoid Do not use for anchored content — use PopoverWrapper or Tooltip instead
 *
 * @aiVariant variant="default" — high-impact, non-destructive confirmations
 * @aiVariant variant="danger" — destructive actions; Confirm renders destructive
 *
 * @aiSpatial Portalled to document.body; locks scroll, traps focus and restores it to the trigger on close.
 *
 * @aiCompose Never nest inside Modal or another AlertDialog; never auto-open on page load
 * @aiCompose onConfirm must close the dialog — it does not close itself
 */
export function AlertDialog({
  open,
  defaultOpen = false,
  onOpenChange,
  onClose,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  variant = 'default',
  title = 'Title',
  message = 'Message',
  confirmLabel = variant === 'danger' ? 'Delete' : 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  requireAcknowledgement = false,
  acknowledgementLabel = 'Confirm',
  acknowledgementChecked,
  defaultAcknowledgementChecked = false,
  onAcknowledgementChange,
  className,
  'aria-label': ariaLabel = 'Alert dialog',
}: AlertDialogProps) {
  const isClient = useIsClient();
  const isOpenControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isOpenControlled ? open : internalOpen;

  const isAckControlled = acknowledgementChecked !== undefined;
  const [internalAckChecked, setInternalAckChecked] = useState(defaultAcknowledgementChecked);
  const ackChecked = isAckControlled ? acknowledgementChecked : internalAckChecked;

  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const requestClose = () => {
    if (!isOpenControlled) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onClose?.();
  };

  const setAck = (checked: boolean) => {
    if (!isAckControlled) {
      setInternalAckChecked(checked);
    }
    onAcknowledgementChange?.(checked);
  };

  useDialogFocus({
    isOpen,
    dialogRef,
    onEscape: requestClose,
    closeOnEscape,
    getInitialFocus: (dialog) => dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR),
  });

  if (!isOpen) return null;

  const confirmDisabled = requireAcknowledgement && !ackChecked;
  const rootClass = ['dsn-alert-dialog', className].filter(Boolean).join(' ');

  // No document during SSR; the portal mounts once hydrated.
  if (!isClient) return null;

  return createPortal(
    <div
      className="dsn-alert-dialog-overlay"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (!closeOnOverlayClick) return;
        requestClose();
      }}
    >
      <div className="dsn-alert-dialog-backdrop" aria-hidden="true" />
      <div
        className={rootClass}
        data-variant={variant}
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
      >
        <div className="dsn-alert-dialog-content">
          <h2 id={titleId} className="dsn-alert-dialog-title">
            {title}
          </h2>
          <p id={messageId} className="dsn-alert-dialog-message">
            {message}
          </p>
        </div>

        <div className="dsn-alert-dialog-footer">
          <div className="dsn-alert-dialog-footer-left">
            {requireAcknowledgement ? (
              <Checkbox
                size="md"
                checked={ackChecked}
                onCheckedChange={setAck}
                label={acknowledgementLabel}
                showTrailingIcon={false}
                aria-label={acknowledgementLabel}
              />
            ) : null}
          </div>
          <div className="dsn-alert-dialog-footer-right">
            <Button variant="ghost" size="md" onClick={onCancel ?? requestClose}>
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              size="md"
              destructive={variant === 'danger'}
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AlertDialog;
