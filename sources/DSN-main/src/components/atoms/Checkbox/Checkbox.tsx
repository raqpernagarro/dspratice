import React from 'react';
import { Avatar, type AvatarProps } from '../Avatar';
import { Badge, type BadgeSize, type BadgeVariant } from '../Badge';
import { Button } from '../Button';
import { Switcher } from '../Switcher';
import { Tag, type TagVariant } from '../Tag';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import './Checkbox.css';

export type CheckboxSize = 'md' | 'sm';

/**
 * Checkbox atom: row-level selectable control that can be embedded in
 * multiple contexts. Field-level label/helper/error anatomy belongs to
 * form wrappers such as CheckboxField and MultiChoice.
 */
export interface CheckboxProps {
  size?: CheckboxSize;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  descriptionRight?: string;
  showContent?: boolean;
  showLabel?: boolean;
  showDescription?: boolean;
  showDescriptionRight?: boolean;
  showAvatar?: boolean;
  avatarProps?: AvatarProps;
  showLeadingIcon?: boolean;
  leadingIcon?: React.ReactNode;
  showTrailingIcon?: boolean;
  trailingIcon?: React.ReactNode;
  showBadge?: boolean;
  badgeCount?: number;
  badgeSize?: BadgeSize;
  badgeVariant?: BadgeVariant;
  showTag?: boolean;
  tagLabel?: string;
  tagVariant?: TagVariant;
  showButtons?: boolean;
  actionAriaLabel?: string;
  onActionClick?: React.MouseEventHandler<HTMLButtonElement>;
  showSwitcherRight?: boolean;
  switcherChecked?: boolean;
  onSwitcherChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  /** When true, checkbox stretches to full width (e.g. in choice lists). Default is wrap content (e.g. toolbar). */
  fullWidth?: boolean;
  className?: string;
  'aria-label'?: string;
}

function CheckmarkIcon() {
  return (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
      <path
        d="M0.625 3.125L3.125 5.625L8.125 0.625"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IndeterminateIcon() {
  return (
    <svg width="8" height="2" viewBox="0 0 8 2" fill="none" aria-hidden="true">
      <path d="M0.5 1H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Checkbox({
  size = 'md',
  checked = false,
  indeterminate = false,
  disabled = false,
  label = 'Label',
  description = 'Description',
  descriptionRight = 'Assist label',
  showContent = true,
  showLabel = true,
  showDescription = false,
  showDescriptionRight = false,
  showAvatar = false,
  avatarProps,
  showLeadingIcon = false,
  leadingIcon,
  showTrailingIcon = true,
  trailingIcon,
  showBadge = false,
  badgeCount = 1,
  badgeSize = 'sm',
  badgeVariant = 'critical',
  showTag = false,
  tagLabel = 'Label',
  tagVariant = 'error',
  showButtons = false,
  actionAriaLabel = 'Open actions',
  onActionClick,
  showSwitcherRight = false,
  switcherChecked = false,
  onSwitcherChange,
  onCheckedChange,
  fullWidth = false,
  className,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  const rootClass = [
    'dsn-checkbox',
    fullWidth && 'dsn-checkbox--full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const ariaChecked = indeterminate ? 'mixed' : checked ? 'true' : 'false';

  function toggle() {
    if (disabled) return;
    onCheckedChange?.(!checked);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) {
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }

  // action-wrap and switcher-wrap contain interactive elements (Button, Switcher).
  // Nesting focusable elements inside role="checkbox" violates aria-required-children
  // and triggers the nested-interactive axe rule. When either is present we wrap the
  // checkbox in a neutral compound div and place the trailing interactive elements
  // as siblings — outside the role="checkbox" boundary.
  const hasTrailingInteractive = showButtons || showSwitcherRight;

  const checkboxEl = (
    <div
      className={rootClass}
      data-size={size}
      data-has-content={showContent || undefined}
      data-disabled={disabled || undefined}
      data-checked={checked || undefined}
      data-indeterminate={indeterminate || undefined}
      role="checkbox"
      aria-checked={ariaChecked}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : toggle}
      onKeyDown={handleKeyDown}
    >
      <span className="dsn-checkbox-indicator-wrap" aria-hidden="true">
        <span className="dsn-checkbox-indicator">
          {(checked || indeterminate) && (
            <span className="dsn-checkbox-mark">
              {indeterminate ? <IndeterminateIcon /> : <CheckmarkIcon />}
            </span>
          )}
        </span>
      </span>

      {showContent && (
        <span className="dsn-checkbox-content">
          {showAvatar && (
            <span className="dsn-checkbox-avatar-wrap">
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

          {showLeadingIcon && (
            <span className="dsn-checkbox-icon-wrap" aria-hidden="true">
              {leadingIcon ?? <PlaceholderIcon />}
            </span>
          )}

          {showLabel && (
            <span className="dsn-checkbox-label-wrap">
              <span className="dsn-checkbox-label">{label}</span>
              {showDescription && (
                <span className="dsn-checkbox-description">{description}</span>
              )}
            </span>
          )}

          {showDescriptionRight && (
            <span className="dsn-checkbox-description-right">{descriptionRight}</span>
          )}

          {showBadge && (
            <span className="dsn-checkbox-badge-wrap">
              <Badge size={badgeSize} variant={badgeVariant} count={badgeCount} />
            </span>
          )}

          {showTag && (
            <span className="dsn-checkbox-tag-wrap">
              <Tag size="sm" variant={tagVariant} label={tagLabel} />
            </span>
          )}

          {showTrailingIcon && (
            <span className="dsn-checkbox-icon-wrap" aria-hidden="true">
              {trailingIcon ?? <PlaceholderIcon />}
            </span>
          )}
        </span>
      )}
    </div>
  );

  if (!hasTrailingInteractive) {
    return checkboxEl;
  }

  return (
    <div
      className={['dsn-checkbox-compound', fullWidth && 'dsn-checkbox-compound--full'].filter(Boolean).join(' ')}
    >
      {checkboxEl}

      {showButtons && (
        <span
          className="dsn-checkbox-action-wrap"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            showLabel={false}
            showLeadingIcon
            leadingIcon={<PlaceholderIcon />}
            aria-label={actionAriaLabel}
            onClick={(event) => {
              event.stopPropagation();
              onActionClick?.(event);
            }}
          />
        </span>
      )}

      {showSwitcherRight && (
        <span
          className="dsn-checkbox-switcher-wrap"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Switcher
            size="sm"
            checked={switcherChecked}
            disabled={disabled}
            aria-label="Toggle option"
            onChange={onSwitcherChange}
          />
        </span>
      )}
    </div>
  );
}

export default Checkbox;
