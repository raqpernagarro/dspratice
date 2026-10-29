import React from 'react';
import { Ellipsis } from 'lucide-react';
import { Avatar, type AvatarProps } from '../Avatar';
import { Badge, type BadgeSize, type BadgeVariant } from '../Badge';
import { Button } from '../Button';
import { Shortcut } from '../Shortcut';
import { Switcher } from '../Switcher';
import { Tag, type TagVariant } from '../Tag';
import './MenuCell.css';

export type MenuCellVariant = 'default' | 'switcher';

export interface MenuCellProps {
  variant?: MenuCellVariant;
  destructive?: boolean;
  disabled?: boolean;
  selected?: boolean;
  fullWidth?: boolean;
  label?: string;
  description?: string;
  descriptionRight?: string;
  showLabel?: boolean;
  showDescription?: boolean;
  showDescriptionRight?: boolean;
  showLeadingIcon?: boolean;
  leadingIcon?: React.ReactNode;
  showTrailingIcon?: boolean;
  trailingIcon?: React.ReactNode;
  showAvatar?: boolean;
  avatarProps?: AvatarProps;
  shortcut?: boolean;
  shortcutLabel?: string;
  shortcutAriaLabel?: string;
  showBadge?: boolean;
  badgeCount?: number;
  badgeSize?: BadgeSize;
  badgeVariant?: BadgeVariant;
  showTag?: boolean;
  tagLabel?: string;
  tagVariant?: TagVariant;
  showButtons?: boolean;
  /** Icon for the trailing action button rendered by `showButtons`. Defaults to lucide `Ellipsis`. */
  actionIcon?: React.ReactNode;
  actionAriaLabel?: string;
  onActionClick?: React.MouseEventHandler<HTMLButtonElement>;
  switcherChecked?: boolean;
  onSwitcherChange?: (checked: boolean) => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  tabIndex?: number;
  className?: string;
  'aria-label'?: string;
  /** Override the default "menuitem" role — pass "option" when MenuCell is used inside a listbox. */
  role?: React.AriaRole;
  /** Conveys selection state when role="option" (listbox pattern). */
  'aria-selected'?: boolean;
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Single menu row (role="menuitem" by default) with optional icon/avatar, description, badge, tag, shortcut, check or switch.
 *
 * @aiSelectWhen Building a custom menu or listbox that PopoverMenu, Select, Combobox or ChoiceList cannot express
 *
 * @aiAvoid Do not hand-build action menus — use PopoverMenu instead
 * @aiAvoid Do not hand-build pickers — use Select or Combobox instead
 * @aiAvoid Do not use for form option lists — use ChoiceList instead
 * @aiAvoid Do not use for sidebar rows — use SidebarMenuSelector instead
 *
 * @aiVariant variant="default" — action or option row; selected shows a check mark
 * @aiVariant variant="switcher" — row toggles a setting in place
 *
 * @aiSpatial Fixed default menu width unless fullWidth; the menu container owns spacing between rows.
 *
 * @aiCompose Always place inside role="menu", or role="listbox" with role="option" + aria-selected
 * @aiCompose With showButtons, pass actionIcon + actionAriaLabel that describe the action (default icon is Ellipsis, "Open actions")
 */
export const MenuCell = React.forwardRef<HTMLElement, MenuCellProps>(function MenuCell(
  {
    variant = 'default',
    destructive = false,
    disabled = false,
    selected = false,
    fullWidth = false,
    label = 'Label',
    description = 'Description',
    descriptionRight = 'Description',
    showLabel = true,
    showDescription = false,
    showDescriptionRight = false,
    showLeadingIcon = true,
    leadingIcon,
    showTrailingIcon = true,
    trailingIcon,
    showAvatar = false,
    avatarProps,
    shortcut = false,
    shortcutLabel = '⌘ ↵',
    shortcutAriaLabel = 'Command Enter',
    showBadge = false,
    badgeCount = 1,
    badgeSize = 'sm',
    badgeVariant = 'critical',
    showTag = false,
    tagLabel = 'Label',
    tagVariant = 'highlight',
    showButtons = false,
    actionIcon,
    actionAriaLabel = 'Open actions',
    onActionClick,
    switcherChecked,
    onSwitcherChange,
    onClick,
    onKeyDown,
    tabIndex,
    className,
    'aria-label': ariaLabel,
    role: roleProp,
    'aria-selected': ariaSelected,
  }: MenuCellProps,
  ref,
) {
  const rootClass = ['dsn-menu-cell', fullWidth && 'dsn-menu-cell--full-width', className].filter(Boolean).join(' ');
  const isSwitcher = variant === 'switcher';
  const resolvedSwitcherChecked = switcherChecked ?? selected;
  const hasNestedInteractiveContent = showButtons || isSwitcher;
  const useSemanticButtonRoot = !hasNestedInteractiveContent;

  const handleDivKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLElement>);

    if (event.target !== event.currentTarget) {
      return;
    }

    if (disabled || !onClick) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event as unknown as React.MouseEvent<HTMLElement>);
    }
  };

  const sharedProps = {
    className: rootClass,
    'data-variant': variant,
    'data-destructive': destructive || undefined,
    'data-selected': selected || undefined,
    'data-disabled': disabled || undefined,
    role: (roleProp ?? 'menuitem') as React.AriaRole,
    'aria-label': ariaLabel,
    'aria-disabled': disabled || undefined,
    'aria-selected': ariaSelected,
  };

  const content = (
    <>
      {showAvatar && (
        <span className="dsn-menu-cell-avatar-wrap">
          <Avatar
            size="xs"
            variant="profile"
            fill="initials"
            initials="AC"
            name="Avatar"
            {...avatarProps}
          />
        </span>
      )}
      {!showAvatar && showLeadingIcon && leadingIcon != null && (
        <span className="dsn-menu-cell-icon-wrap" aria-hidden="true">
          {leadingIcon}
        </span>
      )}

      {showLabel && (
        <span className="dsn-menu-cell-label-wrap">
          <span className="dsn-menu-cell-label">{label}</span>
          {showDescription && (
            <span className="dsn-menu-cell-description">{description}</span>
          )}
        </span>
      )}

      {showDescriptionRight && (
        <span className="dsn-menu-cell-description-right">{descriptionRight}</span>
      )}

      {showBadge && (
        <span className="dsn-menu-cell-badge-wrap">
          <Badge size={badgeSize} variant={badgeVariant} count={badgeCount} />
        </span>
      )}

      {showTag && (
        <span className="dsn-menu-cell-tag-wrap">
          <Tag size="sm" variant={tagVariant} label={tagLabel} />
        </span>
      )}

      {showTrailingIcon && (selected && !isSwitcher || trailingIcon != null) && (
        <span className="dsn-menu-cell-icon-wrap" aria-hidden="true">
          {selected && !isSwitcher ? <CheckIcon /> : trailingIcon}
        </span>
      )}

      {shortcut && (
        <span className="dsn-menu-cell-shortcut-wrap">
          <Shortcut label={shortcutLabel} aria-label={shortcutAriaLabel} />
        </span>
      )}

      {showButtons && (
        <span
          className="dsn-menu-cell-action-wrap"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            showLabel={false}
            showLeadingIcon
            leadingIcon={actionIcon ?? <Ellipsis size={16} aria-hidden="true" />}
            aria-label={actionAriaLabel}
            onClick={(event) => {
              event.stopPropagation();
              onActionClick?.(event);
            }}
          />
        </span>
      )}

      {isSwitcher && (
        <span
          className="dsn-menu-cell-switcher-wrap"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Switcher
            size="sm"
            checked={resolvedSwitcherChecked}
            disabled={disabled}
            aria-label="Toggle option"
            onChange={onSwitcherChange}
          />
        </span>
      )}
    </>
  );

  if (useSemanticButtonRoot) {
    return (
      <button
        type="button"
        {...sharedProps}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled}
        onClick={onClick}
        onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLButtonElement> | undefined}
        tabIndex={tabIndex}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      {...sharedProps}
      ref={ref as React.Ref<HTMLDivElement>}
      tabIndex={tabIndex ?? (disabled ? -1 : 0)}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleDivKeyDown}
    >
      {content}
    </div>
  );
});

export default MenuCell;
