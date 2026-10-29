import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { SectionHeader, type SectionHeaderSize } from '../../atoms/SectionHeader';
import { Toolbar, type ToolbarSize } from '../../molecules/Toolbar';
import { useDialogFocus } from '../../../hooks/useDialogFocus';
import { useIsClient } from '../../../hooks/useIsClient';
import './Modal.css';

export interface ModalProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  title?: string;
  description?: string;
  showHeader?: boolean;
  headerSize?: SectionHeaderSize;
  headerLeadingControl?: React.ReactNode;
  headerTrailingControl?: React.ReactNode;
  showCloseButton?: boolean;
  header?: React.ReactNode;
  children?: React.ReactNode;
  showBottomBar?: boolean;
  bottomBarSize?: ToolbarSize;
  bottomBarLeftActions?: React.ReactNode;
  bottomBarRightActions?: React.ReactNode;
  bottomBar?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getInitialFocusTarget(container: HTMLElement): HTMLElement | null {
  const content = container.querySelector('.dsn-modal-content');
  if (content) {
    const contentFocusable = content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (contentFocusable.length > 0) {
      return contentFocusable[0];
    }
  }

  const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return focusableElements[0] ?? null;
}

/**
 * Focus-trapped overlay dialog portaled to document.body, with header, content slot, and bottom action bar.
 *
 * @aiSelectWhen The user must complete a task or decide before continuing
 * @aiSelectWhen The interaction needs exclusive focus with no background page reference
 *
 * @aiAvoid Do not use for informational-only messages with no action required — use Toast instead
 * @aiAvoid Do not use when the task needs more room but should retain partial page context — use Drawer instead
 * @aiAvoid Do not use for content anchored to a trigger element — use Popover instead
 * @aiAvoid Do not use for a single short line of content — use Tooltip instead
 * @aiAvoid Do not use to preview images, PDFs or video full screen — use MediaViewer instead
 *
 * @aiSpatial Portaled to document.body; ignores the layout of its mount point and manages its own header/content/bottom-bar padding.
 *
 * @aiCompose Never open a Modal from within a Modal
 */
export function Modal({
  open,
  defaultOpen = false,
  onOpenChange,
  onClose,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  title = 'Title',
  description,
  showHeader = true,
  headerSize = 'large',
  headerLeadingControl,
  headerTrailingControl,
  showCloseButton = true,
  header,
  children,
  showBottomBar = true,
  bottomBarSize = 'lg',
  bottomBarLeftActions,
  bottomBarRightActions,
  bottomBar,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
  className,
  'aria-label': ariaLabel = 'Modal',
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  const isClient = useIsClient();
  const titleId = useId();
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;
  const dialogRef = useRef<HTMLDivElement>(null);

  const requestClose = () => {
    if (!isControlled) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onClose?.();
  };

  useDialogFocus({
    isOpen,
    dialogRef,
    onEscape: requestClose,
    closeOnEscape,
    getInitialFocus: getInitialFocusTarget,
  });

  if (!isOpen) return null;

  const rootClass = ['dsn-modal', className].filter(Boolean).join(' ');
  const defaultTrailing = showCloseButton ? (
    <Button
      variant="ghost"
      size="md"
      showLabel={false}
      showLeadingIcon
      leadingIcon={<X size={16} />}
      aria-label="Close modal"
      onClick={requestClose}
    />
  ) : undefined;
  const resolvedHeader = header ?? (
    <SectionHeader
      title={title}
      description={description}
      size={headerSize}
      leadingControl={headerLeadingControl}
      trailingControl={headerTrailingControl ?? defaultTrailing}
      className="dsn-modal-title"
    />
  );
  const resolvedBottomBar = bottomBar ?? (
    <Toolbar
      size={bottomBarSize}
      leftActions={bottomBarLeftActions}
      rightActions={
        bottomBarRightActions ?? (
          <>
            <Button variant="ghost" size="md" onClick={onCancel ?? requestClose}>
              {cancelLabel}
            </Button>
            <Button variant="primary" size="md" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </>
        )
      }
      aria-label="Modal actions"
    />
  );

  // No document during SSR; the portal mounts once hydrated.
  if (!isClient) return null;

  return createPortal(
    <div
      className="dsn-modal-overlay"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (!closeOnOverlayClick) return;
        requestClose();
      }}
    >
      <div className="dsn-modal-backdrop" aria-hidden="true" />
      <div
        className={rootClass}
        role="dialog"
        aria-modal="true"
        aria-label={showHeader && !header ? undefined : ariaLabel}
        aria-labelledby={showHeader && !header ? titleId : undefined}
        aria-describedby={ariaDescribedBy}
        ref={dialogRef}
        tabIndex={-1}
      >
        {showHeader && resolvedHeader ? <div className="dsn-modal-header">{resolvedHeader}</div> : null}
        {showHeader && !header ? (
          <h2 id={titleId} className="dsn-modal-title-assistive">
            {title}
          </h2>
        ) : null}
        <div className="dsn-modal-content">{children}</div>
        {showBottomBar ? <div className="dsn-modal-bottom-bar">{resolvedBottomBar}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
