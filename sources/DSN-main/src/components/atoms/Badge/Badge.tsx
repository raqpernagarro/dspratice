import './Badge.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BadgeSize    = 'sm' | 'dot';
export type BadgeVariant = 'highlight-soft' | 'highlight-strong' | 'informative' | 'inverted' | 'critical';

export interface BadgeProps {
  /**
   * Visual size of the badge.
   * - `sm`  — 16px visual pill (--primitive-size-16) inside a transparent wrapper with
   *           4px padding-block (--inset-tiny), giving a 24px total footprint.
   * - `dot` — 8px circle (--primitive-size-8); no text; use for presence signals only.
   * @default 'sm'
   */
  size?: BadgeSize;

  /**
   * Semantic colour variant.
   * - `highlight-soft`   — light teal bg, teal text.
   * - `highlight-strong` — filled teal bg, white text.
   * - `informative`      — neutral gray bg, secondary text.
   * - `inverted`         — dark neutral bg, white text (Figma: Inverted).
   * - `critical`         — danger red bg, white text (urgent/errors).
   * @default 'highlight-soft'
   */
  variant?: BadgeVariant;

  /**
   * Numeric count to display on `sm` and `lg` badges.
   * Values > 99 are automatically rendered as "99+".
   * Ignored when `size='dot'`.
   */
  count?: number;

  /** Additional CSS class names to merge onto the root element. */
  className?: string;

  /**
   * Accessible label. Badge components are typically decorative — the host
   * element (e.g. the button or avatar the badge overlays) should carry the
   * accessible description. Provide `aria-label` only when the badge is
   * rendered in isolation and needs its own description.
   *
   * Dot badges are `aria-hidden="true"` by default; supplying `aria-label`
   * overrides that and makes them visible to assistive technology.
   */
  'aria-label'?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Badge({
  size    = 'sm',
  variant = 'highlight-soft',
  count,
  className,
  'aria-label': ariaLabel,
}: BadgeProps) {
  const isDot = size === 'dot';

  // Count display logic:
  // - Dot: no text ever.
  // - sm with count: cap at 99 → "99+".
  // - sm without count: renders empty (consumer controls visibility).
  const displayCount = isDot
    ? undefined
    : count !== undefined
      ? count > 99 ? '99+' : String(count)
      : undefined;

  const rootClass = ['dsn-badge', className].filter(Boolean).join(' ');

  if (isDot) {
    return (
      <span
        className={rootClass}
        data-size={size}
        data-variant={variant}
        aria-label={ariaLabel}
        role={ariaLabel ? 'img' : undefined}
        aria-hidden={!ariaLabel ? true : undefined}
      />
    );
  }

  return (
    <span
      className={rootClass}
      data-size={size}
      data-variant={variant}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      <span className="dsn-badge__pill">
        <span className="dsn-badge__label">{displayCount}</span>
      </span>
    </span>
  );
}
