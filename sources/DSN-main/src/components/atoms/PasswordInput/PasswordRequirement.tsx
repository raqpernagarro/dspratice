import './PasswordRequirement.css';

// ─── Private icons ────────────────────────────────────────────────────────────

/** Unmet indicator — grey debossed circle (matches Figma "radio" component). */
function RadioIcon() {
  return (
    <span className="dsn-pw-req-radio" aria-hidden="true" />
  );
}

/** Met indicator — teal filled circle with white checkmark. */
function CheckIcon() {
  return (
    <svg
      className="dsn-pw-req-check"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" fill="var(--toggle-background-on)" />
      <path
        d="M5.5 8.5l1.75 1.75L10.5 6.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PasswordRequirementProps {
  /** The requirement text, e.g. "8+ characters". */
  label: string;
  /** Whether this requirement is currently satisfied. */
  met: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Single-row live status indicator for one password rule (met/unmet).
 *
 * @aiSelectWhen Showing live, per-rule feedback in a list below PasswordInput
 *
 * @aiAvoid Do not use as a general-purpose checklist item — use a plain list with Checkbox instead
 * @aiAvoid Do not use to show a post-submission validation error — use PasswordInput's errorMessage instead
 *
 * @aiSpatial No internal padding; single row sized to icon + label content. Spacing between stacked rows comes from the parent
 *
 * @aiCompose Always use directly below a PasswordInput, one row per distinct rule
 */
export function PasswordRequirement({ label, met, className }: PasswordRequirementProps) {
  return (
    <div
      className={`dsn-pw-requirement${className ? ` ${className}` : ''}`}
      data-met={met || undefined}
      role="status"
      aria-label={`${label}: ${met ? 'satisfied' : 'not satisfied'}`}
    >
      {met ? <CheckIcon /> : <RadioIcon />}
      <span className="dsn-pw-requirement-label">{label}</span>
    </div>
  );
}

export default PasswordRequirement;
