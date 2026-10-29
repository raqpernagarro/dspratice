import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { SectionHeader, type SectionHeaderSize } from '../../atoms/SectionHeader';
import { Switcher } from '../../atoms/Switcher';
import { Toolbar, type ToolbarSize } from '../../molecules/Toolbar';
import { FOCUSABLE_SELECTOR, useDialogFocus } from '../../../hooks/useDialogFocus';
import { useIsClient } from '../../../hooks/useIsClient';
import './Drawer.css';

export type DrawerVariant = 'overlay' | 'stacked';
export type DrawerPlacement = 'left' | 'right';

export interface DrawerProps {
  variant?: DrawerVariant;
  placement?: DrawerPlacement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  width?: number | string;
  title?: string;
  description?: string;
  showHeader?: boolean;
  headerSize?: SectionHeaderSize;
  headerLeadingControl?: React.ReactNode;
  headerTrailingControl?: React.ReactNode;
  showCloseButton?: boolean;
  showToggle?: boolean;
  toggleChecked?: boolean;
  onToggleChange?: (checked: boolean) => void;
  toggleAriaLabel?: string;
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

const DRAWER_EXIT_MS = 200;

/**
 * Partial overlay or stacked side panel with header, content slot, and bottom action bar, for row detail/filter/secondary tasks.
 *
 * @aiSelectWhen The user needs more space than a popover but should retain partial page context (row detail, filter set, quick edit)
 * @aiSelectWhen The user clicks a table row to see details
 *
 * @aiAvoid Do not use when the task needs exclusive focus with no background reference — use Modal instead
 * @aiAvoid Do not use for a single short line of content — use Tooltip instead
 * @aiAvoid Do not use for content anchored to a trigger with a small menu — use Popover instead
 *
 * @aiVariant variant="overlay" — floats above page content with backdrop and focus trap, dismissible by overlay click or Escape
 * @aiVariant variant="stacked" — renders inline as a persistent panel without backdrop or focus trap
 *
 * @aiSpatial Overlay variant portals to document.body and ignores its mount point's layout; stacked variant renders inline; header and bottom bar use SectionHeader/Toolbar padding; .dsn-drawer-content is full-bleed with DataListCell rows picking up matching horizontal inset.
 *
 * @aiCompose Never place Breadcrumbs inside a Drawer
 */
export function Drawer({
  variant = 'overlay',
  placement = 'right',
  open,
  defaultOpen,
  onOpenChange,
  onClose,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  width = '40%',
  title = 'Title',
  description,
  showHeader = true,
  headerSize = variant === 'stacked' ? 'medium' : 'large',
  headerLeadingControl,
  headerTrailingControl,
  showCloseButton = true,
  showToggle = false,
  toggleChecked = false,
  onToggleChange,
  toggleAriaLabel = 'Toggle drawer option',
  header,
  children,
  showBottomBar = true,
  bottomBarSize = variant === 'stacked' ? 'md' : 'lg',
  bottomBarLeftActions,
  bottomBarRightActions,
  bottomBar,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
  className,
  'aria-label': ariaLabel = 'Drawer',
  'aria-describedby': ariaDescribedBy,
}: DrawerProps) {
  const isClient = useIsClient();
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? (variant === 'stacked'));
  const isOpen = isControlled ? open : internalOpen;
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const requestClose = () => {
    if (!isControlled) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onClose?.();
  };

  useEffect(() => {
    if (variant !== 'overlay') {
      setIsRendered(isOpen);
      setIsClosing(false);
      return;
    }

    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      return;
    }

    if (!isRendered) return;
    setIsClosing(true);
    const timeout = window.setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
    }, DRAWER_EXIT_MS);
    return () => window.clearTimeout(timeout);
  }, [isOpen, isRendered, variant]);

  useDialogFocus({
    isOpen: variant === 'overlay' && isOpen,
    dialogRef: panelRef,
    onEscape: requestClose,
    closeOnEscape,
    getInitialFocus: (panel) => panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR),
  });

  if (variant === 'overlay' && !isRendered) return null;
  if (variant === 'stacked' && !isOpen) return null;

  const rootClass = ['dsn-drawer', className].filter(Boolean).join(' ');
  const defaultTrailing = (
    <div className="dsn-drawer-header-controls">
      {showToggle ? (
        <Switcher
          checked={toggleChecked}
          onChange={onToggleChange}
          size="md"
          aria-label={toggleAriaLabel}
        />
      ) : null}
      {showCloseButton ? (
        <Button
          variant="ghost"
          size="md"
          showLabel={false}
          showLeadingIcon
          leadingIcon={<X size={16} />}
          aria-label="Close drawer"
          onClick={requestClose}
        />
      ) : null}
    </div>
  );
  const resolvedHeader = header ?? (
    <SectionHeader
      title={title}
      description={description}
      size={headerSize}
      leadingControl={headerLeadingControl}
      trailingControl={headerTrailingControl ?? defaultTrailing}
      className="dsn-drawer-title"
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
      aria-label="Drawer actions"
    />
  );

  const panel = (
    <div
      className={rootClass}
      data-variant={variant}
      data-placement={placement}
      style={{ width }}
      ref={panelRef}
      role={variant === 'overlay' ? 'dialog' : 'complementary'}
      aria-modal={variant === 'overlay' ? true : undefined}
      aria-label={showHeader && !header ? undefined : ariaLabel}
      aria-labelledby={showHeader && !header ? titleId : undefined}
      aria-describedby={ariaDescribedBy}
      tabIndex={variant === 'overlay' ? -1 : undefined}
    >
      {showHeader && resolvedHeader ? <div className="dsn-drawer-header">{resolvedHeader}</div> : null}
      {showHeader && !header ? (
        <h2 id={titleId} className="dsn-drawer-title-assistive">
          {title}
        </h2>
      ) : null}
      <div className="dsn-drawer-content">{children}</div>
      {showBottomBar ? <div className="dsn-drawer-bottom-bar">{resolvedBottomBar}</div> : null}
    </div>
  );

  if (variant === 'stacked') {
    return panel;
  }

  // No document during SSR; the portal mounts once hydrated.
  if (!isClient) return null;

  return createPortal(
    <div
      className="dsn-drawer-overlay"
      data-placement={placement}
      data-state={isClosing ? 'closing' : 'open'}
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (!closeOnOverlayClick) return;
        requestClose();
      }}
    >
      <div className="dsn-drawer-backdrop" aria-hidden="true" />
      {panel}
    </div>,
    document.body,
  );
}

export default Drawer;
