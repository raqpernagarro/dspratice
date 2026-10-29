import React, { useEffect, useId, useRef, useState } from 'react';
import './OTPInput.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OTPInputProps {
  /** Number of digit cells. Default: 6. */
  length?: number;
  /**
   * Controlled full-string value, e.g. `"123456"`.
   * Provide `onChange` to keep it in sync.
   */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /**
   * Visual / interaction state beyond normal typing.
   * - `'idle'`      — default typing state (Empty / Partially filled)
   * - `'verifying'` — submission in progress; cells are non-interactive
   * - `'correct'`   — verification succeeded; green treatment
   * - `'error'`     — verification failed; red label + error message
   */
  status?: 'idle' | 'verifying' | 'correct' | 'error';
  disabled?: boolean;
  /** Label text rendered above the cells. */
  label?: string;
  /**
   * Optional element displayed to the right of the label.
   * Typical usage: a "Try again" action link shown when `status="error"`.
   */
  labelAction?: React.ReactNode;
  /** Helper text shown below the cells in idle / verifying states. */
  helperText?: string;
  /** Optional 16×16 icon at the start of the helper row. */
  helperIcon?: React.ReactNode;
  /** Error message shown below the cells when `status="error"`. */
  errorMessage?: string;
  /** Called with the full code string on every change. */
  onChange?: (value: string) => void;
  /** Called with the full code string when every cell is filled. */
  onComplete?: (value: string) => void;
  /** Accessible group label. Default: `"Enter {length}-digit verification code"`. */
  'aria-label'?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Segmented digit-cell input for one-time passwords and verification codes.
 *
 * @aiSelectWhen A short numeric code (4-8 chars) sent via SMS, email, or authenticator app
 *
 * @aiAvoid Do not use for passwords — use PasswordInput instead
 * @aiAvoid Do not use for long or free-form alphanumeric values — use a standard text input instead
 *
 * @aiVariant status="idle" — default typing state
 * @aiVariant status="verifying" — code submitted, cells non-interactive
 * @aiVariant status="correct" — verification succeeded
 * @aiVariant status="error" — verification failed or code expired, pair with errorMessage
 *
 * @aiSpatial Owns its own padding; cell group sized to length fixed-size cells, does not stretch
 *
 * @aiCompose Use onComplete to auto-trigger verification — never require a separate submit button for a fixed-length code
 */
export function OTPInput({
  length = 6,
  value,
  defaultValue,
  status = 'idle',
  disabled = false,
  label,
  labelAction,
  helperText,
  helperIcon,
  errorMessage,
  onChange,
  onComplete,
  'aria-label': ariaLabel,
  className,
}: OTPInputProps) {
  const autoId = useId();
  const groupId = `dsn-otp-${autoId}`;
  const statusId = `${groupId}-status`;

  // ── Internal cells state ──────────────────────────────────────────────────
  const [cells, setCells] = useState<string[]>(() => {
    const initial = (value ?? defaultValue ?? '').slice(0, length);
    return Array.from({ length }, (_, i) => initial[i] ?? '');
  });

  // Sync from controlled value
  useEffect(() => {
    if (value !== undefined) {
      setCells(Array.from({ length }, (_, i) => value[i] ?? ''));
    }
  }, [value, length]);

  // Refs for programmatic focus
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const isInteractive = !disabled && status !== 'verifying' && status !== 'correct';

  // ── Handlers ──────────────────────────────────────────────────────────────

  function commitCells(next: string[]) {
    setCells(next);
    const joined = next.join('');
    onChange?.(joined);
    if (next.every(c => c !== '')) {
      onComplete?.(joined);
    }
  }

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Accept only digits; take the last typed character
    const digit = raw.replace(/[^0-9]/g, '').slice(-1);
    const next = [...cells];
    next[index] = digit;
    commitCells(next);
    // Auto-advance to the next empty cell (or the last cell)
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...cells];
      if (next[index]) {
        // Clear current cell
        next[index] = '';
        commitCells(next);
      } else if (index > 0) {
        // Move back, clear previous cell
        next[index - 1] = '';
        commitCells(next);
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    // Select on focus so typing replaces the character
    e.target.select();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, length);
    if (!pasted) return;
    const next = [...cells];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCells(next);
    const joined = next.join('');
    onChange?.(joined);
    // Move focus to the cell after the last pasted char (or the final cell)
    const nextEmpty = next.findIndex(c => c === '');
    const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
    refs.current[focusIndex]?.focus();
    if (next.every(c => c !== '')) {
      onComplete?.(joined);
    }
  }

  // ── Status announcer text ─────────────────────────────────────────────────
  function statusText() {
    if (status === 'verifying') return 'Verifying code…';
    if (status === 'correct') return 'Verification successful';
    if (status === 'error') return errorMessage ?? 'Verification failed';
    return '';
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Helper row content: show errorMessage in error state, otherwise helperText
  const helperContent =
    status === 'error' && errorMessage ? errorMessage : helperText;
  const showHelper = Boolean(helperContent);

  return (
    <div
      className={`dsn-otp${className ? ` ${className}` : ''}`}
      data-status={status !== 'idle' ? status : undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      {/* ── Label row ────────────────────────────────────────────────────── */}
      {(label || labelAction) && (
        <div className="dsn-otp-label-row">
          {label && <span className="dsn-otp-label">{label}</span>}
          {labelAction && (
            <span className="dsn-otp-label-action">{labelAction}</span>
          )}
        </div>
      )}

      {/* ── Cells group ──────────────────────────────────────────────────── */}
      <div
        className="dsn-otp-stack"
        role="group"
        aria-label={ariaLabel ?? `Enter ${length}-digit verification code`}
        aria-describedby={status !== 'idle' ? statusId : undefined}
      >
        {cells.map((char, i) => (
          <input
            key={i}
            ref={el => {
              refs.current[i] = el;
            }}
            className="dsn-otp-cell"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={char}
            disabled={!isInteractive}
            aria-label={`Digit ${i + 1} of ${length}`}
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKeyDown(i, e)}
            onFocus={handleFocus}
            onPaste={handlePaste}
          />
        ))}
      </div>

      {/* ── Status announcer (screen-reader live region) ──────────────────── */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="dsn-otp-sr-only"
      >
        {statusText()}
      </div>

      {/* ── Helper row ────────────────────────────────────────────────────── */}
      {showHelper && (
        <div className="dsn-otp-helper-row">
          {helperIcon && (
            <span className="dsn-otp-helper-icon" aria-hidden="true">
              {helperIcon}
            </span>
          )}
          <p className="dsn-otp-helper">{helperContent}</p>
        </div>
      )}
    </div>
  );
}
