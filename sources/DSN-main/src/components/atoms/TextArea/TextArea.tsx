import React, { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import './TextArea.css';

/** Pixels added/removed per ArrowUp/ArrowDown press on the resize handle. */
const RESIZE_KEY_STEP = 16;
/** Maximum field height as a multiple of its minimum height. */
const RESIZE_MAX_FACTOR = 6;

export interface TextAreaProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: boolean;
  /** When true, appends "(optional)" to the label and suppresses aria-required. */
  optional?: boolean;
  helperText?: string;
  errorMessage?: string;
  maxLength?: number;
  minRows?: number;
  helperIcon?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  /** Optional 16×16 icon at the end of the control. Figma: `Trailing icon` / `Show trailing icon`. */
  trailingIcon?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  autoComplete?: string;
  name?: string;
  className?: string;
}

function DefaultHelperIcon({ error = false }: { error?: boolean }) {
  if (error) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 5V8M8 11H8.01M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5L13.5 8L8 13.5L2.5 8L8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TextArea({
  id,
  label,
  placeholder = 'Placeholder',
  value,
  defaultValue,
  disabled = false,
  error = false,
  optional = false,
  helperText,
  errorMessage,
  maxLength,
  minRows = 3,
  helperIcon,
  leadingIcon,
  trailingIcon,
  onChange,
  onBlur,
  onFocus,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  autoComplete,
  name,
  className,
}: TextAreaProps) {
  const autoId = useId();
  const textAreaId = id ?? `dsn-text-area-${autoId}`;
  const helperId = `${textAreaId}-helper`;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [charCount, setCharCount] = useState(() => (value ?? defaultValue ?? '').length);
  const displayCount = value !== undefined ? value.length : charCount;

  const helperContent = error && errorMessage ? errorMessage : helperText;
  const hasHelperContent = Boolean(helperText) || (error && Boolean(errorMessage));
  const showMeta = hasHelperContent || maxLength !== undefined;
  const describedBy = hasHelperContent ? helperId : undefined;
  const resolvedHelperIcon = helperIcon ?? (hasHelperContent ? <DefaultHelperIcon error={error} /> : null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (value === undefined) {
      setCharCount(e.target.value.length);
    }
    onChange?.(e);
  }

  const [resizeBounds, setResizeBounds] = useState({ now: 0, min: 0, max: 0 });
  /** Rendered height at `minRows` — the floor when CSS sets no min-height. */
  const initialHeightRef = useRef(0);

  /** Current, minimum and maximum field height in px — exposed on the resize separator. */
  const measureResizeBounds = useCallback(() => {
    const textArea = textAreaRef.current;
    if (!textArea) {
      return { now: 0, min: 0, max: 0 };
    }
    const now = Math.round(textArea.getBoundingClientRect().height);
    if (!initialHeightRef.current) {
      initialHeightRef.current = now;
    }
    const min = Math.round(parseFloat(getComputedStyle(textArea).minHeight) || 0) || initialHeightRef.current;
    return { now, min, max: Math.max(now, min * RESIZE_MAX_FACTOR) };
  }, []);

  const applyHeight = useCallback((nextHeight: number) => {
    const textArea = textAreaRef.current;
    if (!textArea) {
      return;
    }
    const { min, max } = measureResizeBounds();
    const clamped = Math.round(Math.min(max, Math.max(min, nextHeight)));
    textArea.style.height = `${clamped}px`;
    setResizeBounds({ now: clamped, min, max });
  }, [measureResizeBounds]);

  useLayoutEffect(() => {
    setResizeBounds(measureResizeBounds());
  }, [measureResizeBounds, minRows]);

  const startVerticalResize = useCallback((clientY: number) => {
    const textArea = textAreaRef.current;
    if (!textArea || disabled) {
      return;
    }

    const startY = clientY;
    const startHeight = textArea.getBoundingClientRect().height;

    function onMove(nextClientY: number) {
      applyHeight(startHeight + (nextClientY - startY));
    }

    function onMouseMove(event: MouseEvent) {
      onMove(event.clientY);
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    }

    function onTouchMove(event: TouchEvent) {
      if (event.touches.length === 0) {
        return;
      }
      event.preventDefault();
      onMove(event.touches[0].clientY);
    }

    function onTouchEnd() {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    }

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }, [applyHeight, disabled]);

  function handleResizeMouseDown(event: React.MouseEvent<HTMLSpanElement>) {
    event.preventDefault();
    startVerticalResize(event.clientY);
  }

  function handleResizeKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    const textArea = textAreaRef.current;
    if (!textArea || disabled) {
      return;
    }
    const { now, min, max } = measureResizeBounds();
    const next: Record<string, number> = {
      ArrowUp: now - RESIZE_KEY_STEP,
      ArrowDown: now + RESIZE_KEY_STEP,
      Home: min,
      End: max,
    };
    if (!(event.key in next)) {
      return;
    }
    event.preventDefault();
    applyHeight(next[event.key]);
  }

  function handleResizeTouchStart(event: React.TouchEvent<HTMLSpanElement>) {
    if (event.touches.length === 0) {
      return;
    }
    event.preventDefault();
    startVerticalResize(event.touches[0].clientY);
  }

  return (
    <div
      className={`dsn-text-area${className ? ` ${className}` : ''}`}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
    >
      {label && (
        <label className="dsn-text-area-label" htmlFor={textAreaId}>
          {label}
          {optional && (
            <span className="dsn-text-area-optional"> (optional)</span>
          )}
        </label>
      )}

      <div className="dsn-text-area-control">
        {leadingIcon && (
          <span className="dsn-text-area-leading-icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <textarea
          ref={textAreaRef}
          id={textAreaId}
          className="dsn-text-area-field"
          rows={minRows}
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
        {trailingIcon && (
          <span className="dsn-text-area-leading-icon dsn-text-area-trailing-icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
        <span
          className="dsn-text-area-resize-handle"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize text area"
          aria-controls={textAreaId}
          aria-valuenow={resizeBounds.now}
          aria-valuemin={resizeBounds.min}
          aria-valuemax={resizeBounds.max}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleResizeKeyDown}
          onMouseDown={disabled ? undefined : handleResizeMouseDown}
          onTouchStart={disabled ? undefined : handleResizeTouchStart}
        />
      </div>

      {showMeta && (
        <div className="dsn-text-area-meta">
          <div className="dsn-text-area-helper-inner">
            {resolvedHelperIcon && (
              <span className="dsn-text-area-helper-icon" aria-hidden="true">
                {resolvedHelperIcon}
              </span>
            )}
            {helperContent && (
              <p id={helperId} className="dsn-text-area-helper">
                {helperContent}
              </p>
            )}
          </div>
          {maxLength !== undefined && (
            <span className="dsn-text-area-count" aria-live="polite" aria-atomic="true">
              {displayCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default TextArea;
