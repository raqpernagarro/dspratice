import React from 'react';
import './VerticalButton.css';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Visual hierarchy variant for the Vertical button.
 * `ghost` is the default — matches the typical toolbar context.
 */
export type VerticalButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * Size of the Vertical button icon circle.
 * - `'md'` — 32 × 32 px icon area (default)
 * - `'sm'` — 24 × 24 px icon area
 */
export type VerticalButtonSize = 'sm' | 'md';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface VerticalButtonProps {
  /**
   * Visual hierarchy variant.
   * @default 'ghost'
   */
  variant?: VerticalButtonVariant;

  /**
   * Size of the icon circle.
   * @default 'md'
   */
  size?: VerticalButtonSize;

  /**
   * Prevents all interaction. Maps to the native `disabled` attribute.
   * @default false
   */
  disabled?: boolean;

  /**
   * Shows a spinner in the icon area and sets `aria-busy`. The icon is
   * hidden while loading is active.
   * @default false
   */
  loading?: boolean;

  /**
   * Renders a small notification badge dot on the top-right of the icon area.
   * @default false
   */
  badge?: boolean;

  /**
   * Controls visibility of the text label below the icon area.
   * Set to `false` to render an icon-only button (supply `aria-label` instead).
   * @default true
   */
  showLabel?: boolean;

  /**
   * Icon element rendered inside the icon circle (16 × 16 px).
   */
  icon?: React.ReactNode;

  /**
   * Label text displayed below the icon area in micro typography (12 px).
   */
  children?: React.ReactNode;

  /**
   * Accessible label. Required when `showLabel` is `false` or when
   * `children` is absent.
   */
  'aria-label'?: string;

  /** Click handler. Not called when `disabled` or `loading`. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;

  /** Additional CSS class names applied to the outer button element. */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * **VerticalButton** — a stacked icon circle + label button.
 *
 * Implements the DS-Ngr Vertical button specification (Figma node 107:87).
 *
 * The visual treatment (background fill, shadow, border-radius) applies only
 * to the inner icon circle. The text label sits below it in micro typography
 * with a 4 px gap. Hover and focus states change the circle's appearance only.
 *
 * Common uses: bottom navigation bars, toolbar action groups where a visible
 * label reinforces the icon meaning.
 *
 * ### Usage
 * ```tsx
 * <VerticalButton icon={<HomeIcon />} onClick={() => navigate('/')}>
 *   Home
 * </VerticalButton>
 *
 * // Icon-only (no label):
 * <VerticalButton icon={<HomeIcon />} showLabel={false} aria-label="Home" />
 *
 * // With notification badge:
 * <VerticalButton icon={<InboxIcon />} badge>Inbox</VerticalButton>
 * ```
 */
/**
 * @aiSelectWhen Stacked icon+label control in a bottom nav bar or toolbar action panel
 * @aiSelectWhen A visible label alongside the icon reinforces its meaning
 *
 * @aiAvoid Do not use for a single inline action in a toolbar or form — use Button instead
 * @aiAvoid Do not use for a persistent icon-only toggle with no label — use ToggleButton instead
 * @aiAvoid Do not use for one of several mutually exclusive options — use SegmentControl or Tab instead
 *
 * @aiVariant variant="ghost" — default, standard toolbar/bottom-nav context
 * @aiVariant variant="secondary" — more visual weight than surrounding ghost controls
 * @aiVariant variant="primary" — rare, the vertical button is the primary interactive element
 *
 * @aiSpatial Visual treatment applies only to the inner icon circle, not the outer button; label sits below with a fixed 4px gap, both inside the button element
 *
 * @aiCompose Used inside bottom navigation bars and toolbar action groups
 */
export function VerticalButton({
  variant = 'ghost',
  size = 'md',
  disabled = false,
  loading = false,
  badge = false,
  showLabel = true,
  icon,
  children,
  'aria-label': ariaLabel,
  onClick,
  className,
}: VerticalButtonProps) {
  return (
    <button
      type="button"
      className={`dsn-vertical-button${className ? ` ${className}` : ''}`}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {/* Icon circle — receives all visual treatment (background, shadow, radius) */}
      <span className="dsn-vertical-button__icon-area">
        {loading ? (
          <span className="dsn-vertical-button__spinner" aria-hidden="true" />
        ) : (
          icon != null && (
            <span className="dsn-vertical-button__icon" aria-hidden="true">{icon}</span>
          )
        )}
        {badge && (
          <span className="dsn-vertical-button__badge" aria-hidden="true" />
        )}
      </span>

      {/* Text label — micro typography, visible by default */}
      {showLabel && children != null && (
        <span className="dsn-vertical-button__label">{children}</span>
      )}
    </button>
  );
}

export default VerticalButton;
