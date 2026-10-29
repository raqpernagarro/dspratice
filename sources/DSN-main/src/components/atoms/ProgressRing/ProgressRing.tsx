import './ProgressRing.css';

// ─── Constants ────────────────────────────────────────────────────────────────

// SVG geometry: viewBox="0 0 36 36", r=15 (same as Spinner)
const RADIUS          = 15;
const CIRCUMFERENCE   = 2 * Math.PI * RADIUS; // ≈ 94.25

// 270° arc dasharray — same constant as Spinner (indeterminate mode)
const INDETERMINATE_DASHARRAY = '70.7 23.6';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProgressRingSize = 'sm' | 'lg' | 'xl' | 'xxl';

export interface ProgressRingProps {
  /**
   * Current progress as a percentage (0–100). Clamped internally.
   *
   * - **Omit** → **indeterminate** mode: a 270° arc spins continuously
   *   against a grey track ring. No `aria-valuenow` is set.
   * - **Provide** → **determinate** mode: the ring fills clockwise from
   *   12 o'clock to the given percentage. `aria-valuenow` is set.
   */
  value?: number;

  /**
   * Visual size of the ring — pixel-identical to Spinner sizes.
   * - `sm`  — 16 px
   * - `lg`  — 32 px (default)
   * - `xl`  — 48 px
   * - `xxl` — 64 px
   * @default 'lg'
   */
  size?: ProgressRingSize;

  /**
   * Accessible label describing what is progressing / loading.
   * Required when there is no visible label in the surrounding UI.
   */
  label?: string;

  /** Additional CSS class names merged onto the root element. */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Circular indeterminate (spinning arc) or determinate (filled ring) progress indicator.
 *
 * @aiSelectWhen A compact, circular loading/progress indicator — inline with a button or in a small card
 *
 * @aiAvoid Do not use for a full-width linear indicator — use LoadingBar or ProgressBar instead
 * @aiAvoid Do not use for placeholder content while data loads — use SkeletonLoading instead
 *
 * @aiVariant value omitted — indeterminate, role="status", continuous 270° spin
 * @aiVariant value provided (0-100) — determinate, role="progressbar", fills clockwise from 12 o'clock
 *
 * @aiSpatial Sized to a fixed pixel dimension per size prop; does not stretch to fill its container
 */
export function ProgressRing({
  value,
  size      = 'lg',
  label,
  className,
}: ProgressRingProps) {
  const isDeterminate = value !== undefined;
  const clamped       = isDeterminate
    ? Math.min(100, Math.max(0, value))
    : undefined;

  // stroke-dashoffset drives how much of the full-circumference arc is visible
  const dashOffset = isDeterminate
    ? CIRCUMFERENCE * (1 - (clamped as number) / 100)
    : undefined;

  const rootClass = ['dsn-progress-ring', className].filter(Boolean).join(' ');

  // Indeterminate uses role="status" (same as Spinner — progressbar requires aria-valuenow)
  const role = isDeterminate ? 'progressbar' : 'status';

  return (
    <div
      role={role}
      aria-valuemin={isDeterminate ? 0 : undefined}
      aria-valuemax={isDeterminate ? 100 : undefined}
      aria-valuenow={clamped}      // undefined → attribute omitted for indeterminate
      aria-label={label}
      aria-live="polite"
      className={rootClass}
      data-size={size}
      data-mode={isDeterminate ? 'determinate' : 'indeterminate'}
    >
      <svg
        viewBox="0 0 36 36"
        aria-hidden="true"
        focusable="false"
      >
        {/* Track: grey full circle — only rendered in determinate mode */}
        {isDeterminate && (
          <circle
            className="dsn-progress-ring-track"
            cx="18"
            cy="18"
            r={RADIUS}
            fill="none"
            strokeWidth="3"
          />
        )}

        {/* Fill: teal arc, driven by dashoffset (determinate) or fixed 270° (indeterminate) */}
        <circle
          className="dsn-progress-ring-fill"
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          // Rotate so the arc starts at 12 o'clock
          transform="rotate(-90 18 18)"
          strokeDasharray={
            isDeterminate
              ? CIRCUMFERENCE   // full circumference; offset controls visibility
              : INDETERMINATE_DASHARRAY
          }
          strokeDashoffset={dashOffset}
        />
      </svg>
    </div>
  );
}
