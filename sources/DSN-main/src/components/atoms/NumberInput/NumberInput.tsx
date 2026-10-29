import React, { useId, useState } from 'react';
import './NumberInput.css';

// ─── Private icons ─────────────────────────────────────────────────────────────

function MinusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 8H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 3V13M3 8H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NumberInputProps {
  /** Unique id — wires <label htmlFor> ↔ <input id>. Auto-generated if omitted. */
  id?: string;
  /** Visible label rendered above the control. */
  label?: string;
  placeholder?: string;
  /** Controlled numeric value. */
  value?: number;
  /** Uncontrolled default numeric value. */
  defaultValue?: number;
  /** Minimum allowed value. Decrement button disables at this boundary. */
  min?: number;
  /** Maximum allowed value. Increment button disables at this boundary. */
  max?: number;
  /** Amount each stepper click changes the value. Default: 1. */
  step?: number;
  disabled?: boolean;
  /** Enables the error visual state (red border, label, helper text). */
  error?: boolean;
  /** When true, appends "(optional)" to the label and suppresses aria-required. */
  optional?: boolean;
  /** Shown below the control; replaced by errorMessage when error=true. */
  helperText?: string;
  /** Shown below the control only when error=true. */
  errorMessage?: string;
  /** Optional 16×16 icon at the start of the helper row. */
  helperIcon?: React.ReactNode;
  /** Optional 16×16 icon at the start of the control. Figma: `Icon` / `Show icon`. */
  leadingIcon?: React.ReactNode;
  /**
   * Called with the parsed numeric value (or `null` when the field is cleared).
   * For controlled usage, update `value` in response to this callback.
   */
  onChange?: (value: number | null) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  name?: string;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min?: number, max?: number): number {
  let clamped = value;
  if (min !== undefined) clamped = Math.max(min, clamped);
  if (max !== undefined) clamped = Math.min(max, clamped);
  return clamped;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Numeric text input with increment/decrement steppers and min/max clamping on blur.
 *
 * @aiSelectWhen Quantities, counts, or durations, especially with a small integer range
 *
 * @aiAvoid Do not use for currency amounts — use a dedicated currency input or plain text input with formatting guidance instead
 * @aiAvoid Do not use for a value that is a range between two points — use Slider instead
 * @aiAvoid Do not use for a large numeric ID/code — use a plain text input instead
 *
 * @aiSpatial Owns its own padding; control row fills container width, stepper buttons sit at a fixed width inside it
 *
 * @aiCompose Always set min/max when a valid range exists — steppers auto-disable at each boundary
 */
export function NumberInput({
  id,
  label,
  placeholder,
  value,
  defaultValue,
  min,
  max,
  step = 1,
  disabled = false,
  error = false,
  optional = false,
  helperText,
  errorMessage,
  helperIcon,
  leadingIcon,
  onChange,
  onBlur,
  onFocus,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  name,
  className,
}: NumberInputProps) {
  // ── ID wiring ──────────────────────────────────────────────────────────────
  const autoId = useId();
  const inputId = id ?? `dsn-number-input-${autoId}`;
  const helperId = `${inputId}-helper`;

  const hasHelperContent =
    Boolean(helperText) || (error && Boolean(errorMessage));
  const describedBy = hasHelperContent ? helperId : undefined;

  // ── Internal string value (uncontrolled mode) ─────────────────────────────
  const [rawValue, setRawValue] = useState(
    () => (defaultValue !== undefined ? String(defaultValue) : ''),
  );

  // Display: controlled → derive from prop; uncontrolled → internal state
  const displayValue = value !== undefined ? String(value) : rawValue;

  // Current numeric value for boundary checks
  const currentNum =
    value !== undefined
      ? value
      : rawValue !== ''
      ? parseFloat(rawValue)
      : NaN;

  // ── Stepper disabled flags ─────────────────────────────────────────────────
  const atMin =
    disabled ||
    (min !== undefined && !isNaN(currentNum) && currentNum <= min);
  const atMax =
    disabled ||
    (max !== undefined && !isNaN(currentNum) && currentNum >= max);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;

    if (value === undefined) {
      // Uncontrolled: update internal state
      setRawValue(raw);
    }

    if (raw === '' || raw === '-') {
      onChange?.(null);
    } else {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChange?.(parsed);
      }
    }
  }

  function handleInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    // On blur, clamp the value if it's out of range
    const parsed = parseFloat(displayValue);
    if (!isNaN(parsed)) {
      const clamped = clamp(parsed, min, max);
      if (clamped !== parsed) {
        const clampedStr = String(clamped);
        if (value === undefined) setRawValue(clampedStr);
        onChange?.(clamped);
      }
    }
    onBlur?.(e);
  }

  function handleDecrement() {
    if (disabled || atMin) return;
    const base = !isNaN(currentNum) ? currentNum : (min ?? 0);
    const next = clamp(base - step, min, max);
    if (value === undefined) setRawValue(String(next));
    onChange?.(next);
  }

  function handleIncrement() {
    if (disabled || atMax) return;
    const base = !isNaN(currentNum) ? currentNum : (min ?? 0);
    const next = clamp(base + step, min, max);
    if (value === undefined) setRawValue(String(next));
    onChange?.(next);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  }

  // ── Derived content ────────────────────────────────────────────────────────
  const showHelperRow = Boolean(helperText) || (error && Boolean(errorMessage));
  const helperContent = error && errorMessage ? errorMessage : helperText;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`dsn-number-input${className ? ` ${className}` : ''}`}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      {/* Label */}
      {label && (
        <label className="dsn-number-input-label" htmlFor={inputId}>
          {label}
          {optional && (
            <span className="dsn-number-input-optional"> (optional)</span>
          )}
        </label>
      )}

      {/* Control */}
      <div className="dsn-number-input-control">
        {leadingIcon && (
          <span className="dsn-number-input-leading-icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          type="text"
          inputMode="numeric"
          id={inputId}
          className="dsn-number-input-field"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          name={name}
          aria-invalid={error || undefined}
          aria-required={!optional || undefined}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={onFocus}
          onKeyDown={handleInputKeyDown}
        />

        {/* Stepper button group */}
        <div
          className="dsn-number-input-stepper"
          role="group"
          aria-label="Adjust value"
        >
          <button
            type="button"
            className="dsn-number-input-btn"
            aria-label="Decrease value"
            disabled={atMin}
            onClick={handleDecrement}
            tabIndex={disabled ? -1 : undefined}
          >
            <MinusIcon />
          </button>
          <button
            type="button"
            className="dsn-number-input-btn"
            aria-label="Increase value"
            disabled={atMax}
            onClick={handleIncrement}
            tabIndex={disabled ? -1 : undefined}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Helper row */}
      {showHelperRow && (
        <div className="dsn-number-input-meta">
          <div className="dsn-number-input-helper-inner">
            {helperIcon && (
              <span className="dsn-number-input-icon" aria-hidden="true">
                {helperIcon}
              </span>
            )}
            {helperContent !== undefined && (
              <p id={helperId} className="dsn-number-input-helper">
                {helperContent}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NumberInput;
