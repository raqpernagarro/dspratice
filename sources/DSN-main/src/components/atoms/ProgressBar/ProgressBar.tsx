import './ProgressBar.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProgressBarProps {
  /**
   * Current progress as a percentage, 0–100. Values are clamped to [0, 100]
   * internally, so out-of-range values are safe to pass.
   */
  value: number;

  /**
   * Accessible label describing **what** is progressing.
   * Required when there is no visible label in the surrounding UI.
   * Example: `aria-label="Uploading file"`.
   */
  label?: string;

  /** Additional CSS class names merged onto the root element. */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Labeled, determinate progressbar showing a known percentage of a bounded task.
 *
 * @aiSelectWhen A specific trackable percentage is known for a bounded task the user is watching
 *
 * @aiAvoid Do not use when the percentage/duration is unknown — use LoadingBar's indeterminate mode instead
 * @aiAvoid Do not use for a compact or circular indicator — use ProgressRing instead
 * @aiAvoid Do not use for placeholder content while data loads — use SkeletonLoading instead
 *
 * @aiSpatial Fills its container's full width; no indeterminate mode, value is required
 */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  // The fill element is inset by -1px on top/left/bottom to overlap the track's
  // border, so width needs +2px to account for both sides.
  // At 0% we hide the fill completely (no 2px dot artefact).
  const fillWidth = clamped === 0 ? '0px' : `calc(${clamped}% + 2px)`;

  const rootClass = ['dsn-progress-bar', className].filter(Boolean).join(' ');

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
      className={rootClass}
    >
      <div className="dsn-progress-bar-track">
        <div
          className="dsn-progress-bar-fill"
          style={{ width: fillWidth }}
        />
      </div>
    </div>
  );
}
