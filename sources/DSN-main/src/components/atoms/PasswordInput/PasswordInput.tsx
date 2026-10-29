import React, { useId, useState } from 'react';
import './PasswordInput.css';

// ─── Private icons ────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="7.5" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M5.5 7.5V5.5a2.5 2.5 0 0 1 5 0v2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 8C2.5 5.5 5 3.5 8 3.5S13.5 5.5 14.5 8 12 12.5 8 12.5 2.5 10.5 1.5 8Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 2.5L14 13.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M6.5 6.8A2 2 0 0 0 8 10a2 2 0 0 0 1.5-.7M4.2 4.7C2.7 5.8 1.5 8 1.5 8s2 4.5 6.5 4.5c1.2 0 2.2-.3 3-.8M8 3.5c4 0 6.5 4.5 6.5 4.5s-.5 1-1.5 2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PasswordInputProps {
  /** Unique id — wires <label htmlFor> ↔ <input id>. Auto-generated via useId() if omitted. */
  id?: string;
  /** Visible label above the control. */
  label?: string;
  placeholder?: string;
  /** Controlled value. */
  value?: string;
  /** Uncontrolled default value. */
  defaultValue?: string;
  disabled?: boolean;
  /** Enables the error visual state on the control, label, and helper row. */
  error?: boolean;
  /** When true, appends "(optional)" to the label and suppresses aria-required. */
  optional?: boolean;
  /** Shown below the control; replaced by errorMessage when error=true. */
  helperText?: string;
  /** Shown below the control only when error=true. */
  errorMessage?: string;
  /** Optional 16×16 icon at the start of the helper / error row. */
  helperIcon?: React.ReactNode;
  /**
   * 16×16 icon at the start of the control. Figma: `Leading icon`.
   * Defaults to the lock icon.
   */
  leadingIcon?: React.ReactNode;
  /** Render the leading icon. Figma: `Show leading icon`. @default true */
  showLeadingIcon?: boolean;
  /**
   * Optional 16×16 icon rendered between the text field and the show/hide toggle.
   * Maps to Figma's `rhIconWrapper` (trailing icon slot).
   */
  trailingIcon?: React.ReactNode;
  /**
   * Optional content rendered to the right of the label
   * (e.g. a "Forgot password?" plain link button).
   */
  labelAction?: React.ReactNode;
  /**
   * autoComplete value. Defaults to "current-password".
   * Use "new-password" for registration / change-password forms.
   */
  autoComplete?: string;
  name?: string;
  className?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Text input that masks its value by default, with a lock icon and show/hide toggle.
 *
 * @aiSelectWhen The value is a password or other sensitive credential that must be masked
 *
 * @aiAvoid Do not use for PINs or one-time verification codes — use OTPInput instead
 * @aiAvoid Do not use for non-sensitive text values — use a standard text input instead
 *
 * @aiSpatial Owns its own padding (label, control, helper rows laid out internally); fills its container width
 *
 * @aiCompose Pair with PasswordRequirement rows below the field for new-password contexts
 */
export function PasswordInput({
  id,
  label,
  placeholder,
  value,
  defaultValue,
  disabled = false,
  error = false,
  optional = false,
  helperText,
  errorMessage,
  helperIcon,
  trailingIcon,
  leadingIcon,
  showLeadingIcon = true,
  labelAction,
  autoComplete = 'current-password',
  name,
  className,
  onChange,
  onBlur,
  onFocus,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: PasswordInputProps) {
  // ── ID wiring ──────────────────────────────────────────────────────────────
  const autoId = useId();
  const inputId = id ?? `dsn-password-input-${autoId}`;
  const helperId = `${inputId}-helper`;

  // ── Visibility toggle ──────────────────────────────────────────────────────
  const [revealed, setRevealed] = useState(false);

  // ── Helper / error content ─────────────────────────────────────────────────
  const helperContent = error && errorMessage ? errorMessage : helperText;
  const hasHelperContent = Boolean(helperText) || (error && Boolean(errorMessage));
  const describedBy = hasHelperContent ? helperId : undefined;
  const showHelperRow = hasHelperContent;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`dsn-password-input${className ? ` ${className}` : ''}`}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      {/* Label row */}
      {label && (
        <div className="dsn-password-input-label-row">
          <label className="dsn-password-input-label" htmlFor={inputId}>
            {label}
            {optional && (
              <span className="dsn-password-input-optional"> (optional)</span>
            )}
          </label>
          {labelAction && (
            <span className="dsn-password-input-label-action">{labelAction}</span>
          )}
        </div>
      )}

      {/* Control */}
      <div className="dsn-password-input-control">
        {/* Leading icon — lock by default */}
        {showLeadingIcon && (
          <span className="dsn-password-input-lock" aria-hidden="true">
            {leadingIcon ?? <LockIcon />}
          </span>
        )}

        {/* Native input */}
        <input
          type={revealed ? 'text' : 'password'}
          id={inputId}
          className="dsn-password-input-field"
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-required={!optional || undefined}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          autoComplete={autoComplete}
          name={name}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
        />

        {/* Optional trailing icon slot (rhIconWrapper) */}
        {trailingIcon && (
          <span className="dsn-password-input-trailing" aria-hidden="true">
            {trailingIcon}
          </span>
        )}

        {/* Show / hide toggle */}
        <button
          type="button"
          className="dsn-password-input-toggle"
          aria-label={revealed ? 'Hide password' : 'Show password'}
          aria-pressed={revealed}
          onClick={() => setRevealed((v) => !v)}
          disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {/* Helper row */}
      {showHelperRow && (
        <div className="dsn-password-input-meta">
          <div className="dsn-password-input-helper-inner">
            {helperIcon && (
              <span className="dsn-password-input-icon" aria-hidden="true">
                {helperIcon}
              </span>
            )}
            <p id={helperId} className="dsn-password-input-helper">
              {helperContent}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PasswordInput;
