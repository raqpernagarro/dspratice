import React from 'react';
import { Avatar, type AvatarProps } from '../Avatar';
import { Badge, type BadgeSize, type BadgeVariant } from '../Badge';
import { Button } from '../Button';
import { Switcher } from '../Switcher';
import { Tag, type TagVariant } from '../Tag';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import './Radio.css';

export type RadioSize = 'md' | 'sm';

/**
 * Radio atom: row-level single-select control for composition in lists,
 * cells, and form wrappers. Field-level label/helper/error anatomy belongs
 * to dedicated form-field wrappers.
 */
export interface RadioProps {
  size?: RadioSize;
  checked?: boolean;
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
  className?: string;
  'aria-label'?: string;
}

export function Radio({
  size = 'md',
  checked = false,
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
  className,
  'aria-label': ariaLabel,
}: RadioProps) {
  const rootClass = ['dsn-radio', className].filter(Boolean).join(' ');

  function select() {
    if (disabled || checked) return;
    onCheckedChange?.(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) {
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      select();
    }
  }

  // action-wrap and switcher-wrap contain interactive elements (Button, Switcher).
  // Place them outside role="radio" to avoid the nested-interactive axe violation.
  const hasTrailingInteractive = showButtons || showSwitcherRight;

  const radioEl = (
    <div
      className={rootClass}
      data-size={size}
      data-has-content={showContent || undefined}
      data-disabled={disabled || undefined}
      data-checked={checked || undefined}
      role="radio"
      aria-checked={checked ? 'true' : 'false'}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : select}
      onKeyDown={handleKeyDown}
    >
      <span className="dsn-radio-indicator-wrap" aria-hidden="true">
        <span className="dsn-radio-indicator">
          <span className="dsn-radio-dot" />
        </span>
      </span>

      {showContent && (
        <span className="dsn-radio-content">
          {showAvatar && (
            <span className="dsn-radio-avatar-wrap">
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
            <span className="dsn-radio-icon-wrap" aria-hidden="true">
              {leadingIcon ?? <PlaceholderIcon />}
            </span>
          )}

          {showLabel && (
            <span className="dsn-radio-label-wrap">
              <span className="dsn-radio-label">{label}</span>
              {showDescription && (
                <span className="dsn-radio-description">{description}</span>
              )}
            </span>
          )}

          {showDescriptionRight && (
            <span className="dsn-radio-description-right">{descriptionRight}</span>
          )}

          {showBadge && (
            <span className="dsn-radio-badge-wrap">
              <Badge size={badgeSize} variant={badgeVariant} count={badgeCount} />
            </span>
          )}

          {showTag && (
            <span className="dsn-radio-tag-wrap">
              <Tag size="sm" variant={tagVariant} label={tagLabel} />
            </span>
          )}

          {showTrailingIcon && (
            <span className="dsn-radio-icon-wrap" aria-hidden="true">
              {trailingIcon ?? <PlaceholderIcon />}
            </span>
          )}
        </span>
      )}
    </div>
  );

  if (!hasTrailingInteractive) {
    return radioEl;
  }

  return (
    <div className="dsn-radio-compound">
      {radioEl}

      {showButtons && (
        <span
          className="dsn-radio-action-wrap"
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
          className="dsn-radio-switcher-wrap"
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

export default Radio;
