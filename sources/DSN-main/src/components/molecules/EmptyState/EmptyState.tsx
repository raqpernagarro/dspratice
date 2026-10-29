import React from 'react';
import { renderIcon, type IconSource } from '../../../types/icon';
import { Button } from '../../atoms/Button';
import './EmptyState.css';

export type EmptyStateSize = 'default' | 'small';

export interface EmptyStateProps {
  /** Visual size variant. Figma: Default (large) and Small. */
  size?: EmptyStateSize;
  /** Optional root class name. */
  className?: string;

  /** Enables/disables the icon block. Pair with `icon` when true. */
  hasIcon?: boolean;
  /** Context-specific Lucide icon. Accepts a component (`icon={Search}`) or an element (`icon={<Search />}`). */
  icon?: IconSource;

  /** Enables/disables the title text. */
  hasTitle?: boolean;
  /** Main heading copy. */
  title?: string;

  /** Enables/disables the subtitle text. */
  hasSubtitle?: boolean;
  /** Supporting copy under the title. */
  subtitle?: string;

  /** Enables/disables the full actions section. */
  hasActions?: boolean;
  /** Enables/disables the primary CTA. */
  showMainCta?: boolean;
  /** Primary CTA label. */
  mainCtaLabel?: string;
  /** Primary CTA click handler. */
  onMainCtaClick?: () => void;

  /** Enables/disables the secondary action. */
  showSecondaryOption?: boolean;
  /** Secondary action label. */
  secondaryOptionLabel?: string;
  /** Secondary action click handler. */
  onSecondaryOptionClick?: () => void;

  /** Enables/disables the tertiary action. */
  showTertiaryOption?: boolean;
  /** Tertiary action label. */
  tertiaryOptionLabel?: string;
  /** Tertiary action click handler. */
  onTertiaryOptionClick?: () => void;

  /** Enables/disables the link-style action. */
  showLink?: boolean;
  /** Link action label. */
  linkLabel?: string;
  /** Link action click handler. */
  onLinkClick?: () => void;

  /** Enables/disables helper text under actions. */
  showHelpText?: boolean;
  /** Helper copy rendered under actions. */
  helpText?: string;
}

/**
 * Structured layout — optional icon, title/subtitle, tiered actions — for when a list, table, card, or column has nothing to show.
 *
 * @aiSelectWhen First-use, filtered-empty, permission, or recoverable load-empty situations
 * @aiSelectWhen A board column, card body, or split panel specifically has no content
 *
 * @aiAvoid Do not use for a single failed form field — use an inline field validation message instead
 * @aiAvoid Do not use for a whole-page system error — use a full-page error screen instead
 * @aiAvoid Do not use for a one-line hint beside other content — use copy in context instead
 *
 * @aiVariant size="default" — dominates a primary content area (full page or main panel)
 * @aiVariant size="small" — compact in-column empty states (Kanban columns, card bodies, filtered lists)
 *
 * @aiSpatial Owns its internal padding but not its margin; in flex column parents set min-width:0 on the parent and min-width:0/max-width:100% on the EmptyState root so content wraps instead of overflowing.
 *
 * @aiCompose Never mount a standalone Button beside EmptyState to change variant — use showMainCta/showSecondaryOption instead
 * @aiCompose When hasIcon is true, always pass a context-specific Lucide icon via icon={IconComponent} — never rely on a built-in default
 */
export function EmptyState({
  size = 'default',
  className,
  hasIcon = false,
  icon,
  hasTitle = true,
  title = 'Title',
  hasSubtitle = true,
  subtitle = 'Subtitle.',
  hasActions = true,
  showMainCta = true,
  mainCtaLabel = 'Button',
  onMainCtaClick,
  showSecondaryOption = true,
  secondaryOptionLabel = 'Button',
  onSecondaryOptionClick,
  showTertiaryOption = true,
  tertiaryOptionLabel = 'Button',
  onTertiaryOptionClick,
  showLink = true,
  linkLabel = 'Button',
  onLinkClick,
  showHelpText = true,
  helpText = 'Help text',
}: EmptyStateProps) {
  const rootClassName = ['dsn-empty-state', className].filter(Boolean).join(' ');
  const buttonSize = size === 'small' ? 'sm' : 'md';

  const hasAnyAction =
    showMainCta || showSecondaryOption || showTertiaryOption || showLink || showHelpText;

  return (
    <div className={rootClassName} data-size={size}>
      <div className="dsn-empty-state-content">
        {hasIcon && icon ? (
          <div className="dsn-empty-state-icon" aria-hidden="true">
            {renderIcon(icon, { strokeWidth: 1.25 })}
          </div>
        ) : null}

        {(hasTitle || hasSubtitle) && (
          <div className="dsn-empty-state-copy">
            {hasTitle ? <p className="dsn-empty-state-title">{title}</p> : null}
            {hasSubtitle ? <p className="dsn-empty-state-subtitle">{subtitle}</p> : null}
          </div>
        )}

        {hasActions && hasAnyAction ? (
          <div className="dsn-empty-state-actions">
            {showMainCta ? (
              <Button variant="primary" size={buttonSize} onClick={onMainCtaClick}>
                {mainCtaLabel}
              </Button>
            ) : null}
            {showSecondaryOption ? (
              <Button variant="secondary" size={buttonSize} onClick={onSecondaryOptionClick}>
                {secondaryOptionLabel}
              </Button>
            ) : null}
            {showTertiaryOption ? (
              <Button variant="ghost" size={buttonSize} onClick={onTertiaryOptionClick}>
                {tertiaryOptionLabel}
              </Button>
            ) : null}
            {showLink ? (
              <Button variant="plain" size="sm" onClick={onLinkClick}>
                {linkLabel}
              </Button>
            ) : null}
            {showHelpText ? <p className="dsn-empty-state-help-text">{helpText}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default EmptyState;
