import React, { useId, useState } from 'react';
import './TextInput.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextInputProps {
  /** Unique id — wires <label htmlFor> ↔ <input id>. Auto-generated via useId() if omitted. */
  id?: string;
  /** Visible label above the control. Omit only when aria-label / aria-labelledby is provided. */
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
  /** Enables "N/maxLength" character counter in the helper row. */
  maxLength?: number;
  /** Optional 16×16 icon inside the control on the left. */
  leadingIcon?: React.ReactNode;
  /**
   * Optional 16×16 icon inside the control on the right.
   * Hidden when maxLength is set (counter occupies that slot conceptually).
   */
  trailingIcon?: React.ReactNode;
  /** Optional 16×16 icon rendered at the start of the helper / error text row. */
  helperIcon?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  autoComplete?: string;
  name?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Single-line text input with label, optional leading/trailing icons, and a helper/error/character-count row.
 *
 * @aiSelectWhen Any short, free-form text value (names, emails, URLs, addresses, subject lines)
 * @aiSelectWhen No more specific input type applies — the foundational input type
 *
 * @aiAvoid Do not use for multi-line prose — use TextArea instead
 * @aiAvoid Do not use for numbers with increment/decrement controls — use NumberInput instead
 * @aiAvoid Do not use for passwords — use PasswordInput instead
 * @aiAvoid Do not use for international phone numbers — use PhoneInput instead
 * @aiAvoid Do not use for search/filter queries — use SearchInput instead
 * @aiAvoid Do not use when selecting from a predefined list — use Select instead
 *
 * @aiSpatial Owns its internal label/control/helper-row padding but not margin from sibling fields; the helper row only renders when there is helper/error/counter content.
 *
 * @aiCompose Never use placeholder text as a substitute for label — always set label or an aria-label
 */
export function TextInput({
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
  maxLength,
  leadingIcon,
  trailingIcon,
  helperIcon,
  onChange,
  onBlur,
  onFocus,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  autoComplete,
  name,
  className,
}: TextInputProps) {
  // ── ID wiring ──────────────────────────────────────────────────────────────
  const autoId = useId();
  const inputId = id ?? `dsn-text-input-${autoId}`;
  const helperId = `${inputId}-helper`;

  // Only wire aria-describedby when there is actually helper content.
  const hasHelperContent =
    Boolean(helperText) || (error && Boolean(errorMessage));
  const describedBy = hasHelperContent ? helperId : undefined;

  // ── Character count ────────────────────────────────────────────────────────
  // For uncontrolled usage we track count in local state.
  // For controlled usage we derive it from the value prop directly.
  const [charCount, setCharCount] = useState(
    () => (value ?? defaultValue ?? '').length,
  );

  const displayCount = value !== undefined ? value.length : charCount;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (value === undefined) {
      // Uncontrolled: update internal count.
      setCharCount(e.target.value.length);
    }
    onChange?.(e);
  }

  // ── Derived flags ──────────────────────────────────────────────────────────
  const showHelperRow =
    Boolean(helperText) ||
    (error && Boolean(errorMessage)) ||
    maxLength !== undefined;

  const showTrailingIcon = trailingIcon != null && maxLength === undefined;

  // ── Helper / error text to display ────────────────────────────────────────
  const helperContent = error && errorMessage ? errorMessage : helperText;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`dsn-text-input${className ? ` ${className}` : ''}`}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      {/* Label */}
      {label && (
        <label className="dsn-text-input-label" htmlFor={inputId}>
          {label}
          {optional && (
            <span className="dsn-text-input-optional"> (optional)</span>
          )}
        </label>
      )}

      {/* Control wrapper */}
      <div className="dsn-text-input-control">
        {leadingIcon && (
          <span className="dsn-text-input-icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}

        <input
          type="text"
          id={inputId}
          className="dsn-text-input-field"
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={error || undefined}
          aria-required={!optional || undefined}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          autoComplete={autoComplete}
          name={name}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
        />

        {showTrailingIcon && (
          <span className="dsn-text-input-icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </div>

      {/* Helper row */}
      {showHelperRow && (
        <div className="dsn-text-input-meta">
          <div className="dsn-text-input-helper-inner">
            {helperIcon && (
              <span className="dsn-text-input-icon" aria-hidden="true">
                {helperIcon}
              </span>
            )}
            {helperContent !== undefined && (
              <p id={helperId} className="dsn-text-input-helper">
                {helperContent}
              </p>
            )}
          </div>

          {maxLength !== undefined && (
            <span
              className="dsn-text-input-count"
              aria-live="polite"
              aria-atomic="true"
            >
              {displayCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default TextInput;
