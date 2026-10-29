import React from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Avatar, type AvatarProps } from '../../atoms/Avatar';
import { Badge, type BadgeVariant } from '../../atoms/Badge';
import './SidebarMenuSelector.css';

export type SidebarMenuSelectorVariant = 'full' | 'icon';

export interface SidebarMenuSelectorProps {
  variant?: SidebarMenuSelectorVariant;
  label?: string;
  showIcon?: boolean;
  /** Leading icon. Nothing renders in the icon slot when omitted. */
  icon?: React.ReactNode;
  showAvatar?: boolean;
  avatarProps?: AvatarProps;
  showBadge?: boolean;
  badgeCount?: number;
  badgeVariant?: BadgeVariant;
  showDisclosure?: boolean;
  showRightButton?: boolean;
  rightButton?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  'aria-label'?: string;
  /** Ref to the inner `<button>` — use as the `anchorRef` of a panel this item opens. */
  buttonRef?: React.Ref<HTMLButtonElement>;
  /** Set when the item opens a popup (e.g. `"dialog"` for NotificationCenter). */
  'aria-haspopup'?: 'dialog' | 'menu' | 'listbox';
  /** Popup triggers only: whether the popup is open. */
  'aria-expanded'?: boolean;
  /** Popup triggers only: id of the popup while it is open. */
  'aria-controls'?: string;
}

/**
 * Sidebar row button with icon or avatar, label, and optional badge, disclosure and trailing action.
 *
 * @aiSelectWhen Rendering Sidebar bottomContent rows (Settings, User Name) or the workspace selector
 * @aiSelectWhen A sidebar row opens a panel — set buttonRef and the aria popup props
 *
 * @aiAvoid Do not use for main nav items — use Sidebar sections items instead
 * @aiAvoid Do not use for dropdown rows — use MenuCell inside PopoverMenu instead
 * @aiAvoid Do not use outside a sidebar — use Button instead
 *
 * @aiVariant variant="full" — expanded sidebar
 * @aiVariant variant="icon" — collapsed sidebar; label becomes the accessible name
 *
 * @aiSpatial Owns its inset and height; the full variant spans the sidebar width.
 *
 * @aiCompose In bottomContent, mirror AppShell's collapsed state: variant={collapsed ? 'icon' : 'full'}
 * @aiCompose Pass icon (or showAvatar) on every row — the icon variant shows only the icon, and no icon slot renders without one
 */
export function SidebarMenuSelector({
  variant = 'full',
  label = 'Label',
  showIcon = true,
  icon,
  showAvatar = false,
  avatarProps,
  showBadge = false,
  badgeCount = 3,
  badgeVariant = 'highlight-strong',
  showDisclosure = false,
  showRightButton = false,
  rightButton,
  selected = false,
  disabled = false,
  onClick,
  className,
  'aria-label': ariaLabel,
  buttonRef,
  'aria-haspopup': ariaHasPopup,
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls,
}: SidebarMenuSelectorProps) {
  const isIcon = variant === 'icon';
  const rootClass = ['dsn-sidebar-selector', className].filter(Boolean).join(' ');
  const resolvedAriaLabel = ariaLabel ?? (isIcon ? label : undefined);

  return (
    <div
      className={rootClass}
      data-variant={variant}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
    >
      <button
        type="button"
        className="dsn-sidebar-selector-container"
        disabled={disabled}
        ref={buttonRef}
        aria-label={resolvedAriaLabel}
        aria-haspopup={ariaHasPopup}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-current={selected ? 'page' : undefined}
        onClick={onClick}
      >
        {showIcon && !showAvatar && icon != null && (
          <span className="dsn-sidebar-selector-icon-wrap" aria-hidden="true">
            {icon}
          </span>
        )}

        {showAvatar && (
          <span className="dsn-sidebar-selector-avatar-wrap">
            <Avatar
              size="xs"
              variant="organization"
              fill="initials"
              initials="AA"
              name="Avatar"
              {...avatarProps}
            />
          </span>
        )}

        {!isIcon && (
          <span className="dsn-sidebar-selector-label-wrap">
            <span className="dsn-sidebar-selector-label">{label}</span>
          </span>
        )}

        {!isIcon && showBadge && (
          <span className="dsn-sidebar-selector-badge-wrap">
            <Badge size="sm" variant={badgeVariant} count={badgeCount} />
          </span>
        )}

        {!isIcon && showDisclosure && (
          <span className="dsn-sidebar-selector-disclosure" aria-hidden="true">
            <ChevronsUpDown size={16} />
          </span>
        )}

      </button>

      {!isIcon && showRightButton && rightButton && (
        <span
          className="dsn-sidebar-selector-action-wrap"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {rightButton}
        </span>
      )}

      {selected && <span className="dsn-sidebar-selector-rail" aria-hidden="true" />}
    </div>
  );
}

export default SidebarMenuSelector;
