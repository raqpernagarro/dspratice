import { ChevronDown } from 'lucide-react';
import { renderIcon, type IconSource } from '../../../types/icon';
import './Tag.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TagVariant = 'highlight' | 'warning' | 'error' | 'success' | 'neutral';
export type TagSize = 'sm' | 'md';

export interface TagProps {
  /**
   * The text label displayed inside the tag.
   * Keep to 1–3 words. Use sentence case ("In review", not "In Review").
   */
  label: string;

  /**
   * Semantic colour variant — choose based on meaning, not visual preference.
   * - `highlight` — notable but not urgent (featured, active)
   * - `warning`   — caution, approaching an issue
   * - `error`     — something has gone wrong or is blocked
   * - `success`   — completed, healthy, approved
   * - `neutral`   — no semantic weight, purely categorical
   * @default 'neutral'
   */
  variant?: TagVariant;

  /**
   * Display size.
   * - `md` — default
   * - `sm` — dense layouts, multiple tags per item
   * @default 'md'
   */
  size?: TagSize;

  /** Show the leading icon slot. Figma: `Show leading icon`. @default true */
  showLeadingIcon?: boolean;

  /**
   * Icon before the label. Figma: `Leading icon`.
   * Accepts a Lucide component (`Star`) or an element (`<Star />`).
   */
  leadingIcon?: IconSource;

  /** Show the trailing icon slot. Figma: `Show trailing icon`. @default true */
  showTrailingIcon?: boolean;

  /**
   * Icon after the label. Figma: `Trailing icon`.
   * Accepts a Lucide component (`X`) or an element (`<X />`).
   */
  trailingIcon?: IconSource;

  /** Show a trailing chevron-down disclosure indicator. Figma: `Disclosure`. @default false */
  disclosure?: boolean;

  /** @deprecated Use `leadingIcon`. */
  iconLeft?: IconSource;

  /** @deprecated Use `trailingIcon`. */
  iconRight?: IconSource;

  /**
   * @deprecated Use `showLeadingIcon` / `showTrailingIcon`.
   * When set, it overrides both per-side toggles.
   */
  showIcon?: boolean;

  /** Additional CSS class names merged onto the root element. */
  className?: string;

  /**
   * Accessible label for the tag. Tags should not rely on colour alone —
   * the `label` text is the primary semantic signal.
   */
  'aria-label'?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Non-interactive status/category label with a semantic color variant.
 *
 * @aiSelectWhen attaching a categorical or status label to a record, list item, card, or table row
 * @aiSelectWhen the label is informational only and carries no interaction
 *
 * @aiAvoid Do not use when the element must be selectable or dismissible — use Chip instead
 * @aiAvoid Do not use when the label is a numeric count on another element — use Badge instead
 * @aiAvoid Do not use for urgent system-level alerts — use Toast instead
 *
 * @aiVariant variant="success" — done, active, on track, approved, complete
 * @aiVariant variant="warning" — at risk, pending, in review, in progress, waiting
 * @aiVariant variant="error" — behind, blocked, failed, rejected, overdue
 * @aiVariant variant="neutral" — no semantic weight, purely categorical
 * @aiVariant variant="highlight" — notable but not urgent, e.g. featured or primary category
 *
 * @aiSpatial Owns its own padding, has zero external margin, and does not fill its container — spacing between adjacent tags must come from the parent layout.
 *
 * @aiCompose Never wrap in a clickable element or attach onClick — Tag has no interactive states; use Chip if interactivity is needed
 */
export function Tag({
  label,
  variant = 'neutral',
  size = 'md',
  leadingIcon,
  trailingIcon,
  showLeadingIcon = true,
  showTrailingIcon = true,
  disclosure = false,
  iconLeft,
  iconRight,
  showIcon,
  className,
  'aria-label': ariaLabel,
}: TagProps) {
  const rootClass = ['dsn-tag', className].filter(Boolean).join(' ');
  const iconSize = size === 'sm' ? 10 : 12;
  const leading = leadingIcon ?? iconLeft;
  const trailing = trailingIcon ?? iconRight;
  const showLeading = showIcon ?? showLeadingIcon;
  const showTrailing = showIcon ?? showTrailingIcon;

  return (
    <span
      className={rootClass}
      data-variant={variant}
      data-size={size}
      role="status"
      aria-label={ariaLabel}
    >
      {showLeading && leading && (
        <span className="dsn-tag-icon dsn-tag-icon-left" aria-hidden="true">
          {renderIcon(leading, iconSize)}
        </span>
      )}
      <span className="dsn-tag-label">{label}</span>
      {showTrailing && trailing && (
        <span className="dsn-tag-icon dsn-tag-icon-right" aria-hidden="true">
          {renderIcon(trailing, iconSize)}
        </span>
      )}
      {disclosure && (
        <span className="dsn-tag-icon dsn-tag-icon-right" data-disclosure="" aria-hidden="true">
          {renderIcon(ChevronDown, iconSize)}
        </span>
      )}
    </span>
  );
}
