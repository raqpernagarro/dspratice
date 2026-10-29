import './LoadingBar.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoadingBarProps {
  /**
   * Current progress as a percentage (0–100).
   *
   * - **Omit** this prop for **indeterminate** mode — a segment animates
   *   continuously left → right, signalling activity without a known end time.
   * - **Provide** a number for **determinate** mode — the bar fills to the
   *   given percentage and exposes `aria-valuenow` to assistive technology.
   *   Values are clamped to [0, 100] internally.
   */
  value?: number;

  /**
   * Accessible label describing the operation in progress.
   * Example: `"Navigating to dashboard"`, `"Uploading files"`.
   */
  label?: string;

  /** Additional CSS class names merged onto the root element. */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Thin, full-width progressbar — indeterminate (no value) or determinate (value 0-100).
 *
 * @aiSelectWhen Page-level or section-level loading with an unknown or approximate duration
 *
 * @aiAvoid Do not use for a bounded task with a known percentage the user is watching — use ProgressBar instead
 * @aiAvoid Do not use for a circular/compact indicator — use ProgressRing instead
 * @aiAvoid Do not use for placeholder content while data loads — use SkeletonLoading instead
 *
 * @aiVariant value omitted — indeterminate, continuous animation
 * @aiVariant value provided (0-100) — determinate, fills to percentage
 *
 * @aiSpatial Fills its container's full width; no internal padding to configure
 */
export function LoadingBar({ value, label, className }: LoadingBarProps) {
  const isDeterminate = value !== undefined;
  const clamped       = isDeterminate
    ? Math.min(100, Math.max(0, value))
    : undefined;

  const rootClass = ['dsn-loading-bar', className].filter(Boolean).join(' ');

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}    // omitted (undefined) for indeterminate
      aria-label={label}
      aria-live="polite"
      className={rootClass}
      data-mode={isDeterminate ? 'determinate' : 'indeterminate'}
    >
      <div
        className="dsn-loading-bar-fill"
        style={isDeterminate ? { width: `${clamped}%` } : undefined}
      />
    </div>
  );
}
