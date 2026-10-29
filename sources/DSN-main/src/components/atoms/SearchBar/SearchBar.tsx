import React, { useId, useState } from 'react';
import './SearchBar.css';

export type SearchBarVariant = 'default' | 'ghost';

export interface SearchBarProps {
  id?: string;
  variant?: SearchBarVariant;
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  errorMessage?: string;
  maxLength?: number;
  /** When true, appends "(optional)" to the label and suppresses aria-required. */
  optional?: boolean;
  helperIcon?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onClear?: () => void;
  className?: string;
  name?: string;
  autoComplete?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.5 11.5L14 14M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.5 4.5L4.5 11.5M4.5 4.5L11.5 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Search input (role="searchbox") with leading icon and clear button; bordered with label, or borderless ghost.
 *
 * @aiSelectWhen The user queries, filters or looks up records — the value is a transient query
 * @aiSelectWhen Filtering a list from a Toolbar (ghost) or searching navigation in Sidebar searchSlot
 *
 * @aiAvoid Do not use for a saved form value — use TextInput instead
 * @aiAvoid Do not use to pick from a known list — use Combobox or Select instead
 * @aiAvoid Do not use for a command palette — use CommandDialog instead
 *
 * @aiVariant variant="default" — dedicated search areas; override the literal "Label" / "Help text" defaults
 * @aiVariant variant="ghost" — toolbars, headers and menus; always set aria-label
 *
 * @aiSpatial Fills its parent's width and owns its inset; constrain width on a wrapper.
 *
 * @aiCompose Never show the error state for "no results" — show empty-state feedback in the results area
 */
export function SearchBar({
  id,
  variant = 'default',
  label = 'Label',
  placeholder = 'Search',
  value,
  defaultValue,
  disabled = false,
  error = false,
  helperText = 'Help text',
  errorMessage,
  maxLength,
  optional = false,
  helperIcon,
  onChange,
  onFocus,
  onBlur,
  onClear,
  className,
  name,
  autoComplete,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: SearchBarProps) {
  const autoId = useId();
  const inputId = id ?? `dsn-search-bar-${autoId}`;
  const helperId = `${inputId}-helper`;
  const [charCount, setCharCount] = useState(() => (value ?? defaultValue ?? '').length);

  const isControlled = value !== undefined;
  const displayValue = value ?? undefined;
  const currentLength = (value ?? '').length;
  const displayCount = isControlled ? currentLength : charCount;
  const hasValue = isControlled ? currentLength > 0 : charCount > 0;
  const hasHelperContent = Boolean(helperText) || (error && Boolean(errorMessage));
  const showHelperRow =
    variant === 'default' &&
    (hasHelperContent || maxLength !== undefined || (error && Boolean(errorMessage)));
  const helperContent = error && errorMessage ? errorMessage : helperText;

  const rootClass = ['dsn-search-bar', className].filter(Boolean).join(' ');

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setCharCount(event.target.value.length);
    }
    onChange?.(event);
  }

  function handleClear() {
    if (!isControlled) {
      setCharCount(0);
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      if (input) {
        input.value = '';
        input.focus();
      }
    }
    onClear?.();
  }

  return (
    <div
      className={rootClass}
      data-variant={variant}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
    >
      {variant === 'default' && (
        <label className="dsn-search-bar-label" htmlFor={inputId}>
          {label}
          {optional && (
            <span className="dsn-search-bar-optional"> (optional)</span>
          )}
        </label>
      )}

      <div className="dsn-search-bar-control">
        <span className="dsn-search-bar-icon-wrap" aria-hidden="true">
          <span className="dsn-search-bar-icon">
            <SearchIcon />
          </span>
        </span>
        <span className="dsn-search-bar-label-wrap">
          <input
            id={inputId}
            type="text"
            role="searchbox"
            enterKeyHint="search"
            className="dsn-search-bar-field"
            placeholder={placeholder}
            value={displayValue}
            defaultValue={defaultValue}
            disabled={disabled}
            maxLength={maxLength}
            name={name}
            autoComplete={autoComplete}
            aria-invalid={error || undefined}
            aria-required={!optional || undefined}
            aria-describedby={showHelperRow ? helperId : undefined}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            onChange={handleChange}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </span>

        {hasValue && !disabled && (
          <span className="dsn-search-bar-icon-wrap dsn-search-bar-clear">
            <button
              type="button"
              className="dsn-search-bar-clear-btn"
              aria-label="Clear search"
              onClick={handleClear}
            >
              <span className="dsn-search-bar-icon" aria-hidden="true">
                <CloseIcon />
              </span>
            </button>
          </span>
        )}
      </div>

      {showHelperRow && (
        <div className="dsn-search-bar-meta">
          <div className="dsn-search-bar-helper-inner">
            {helperIcon && (
              <span className="dsn-search-bar-helper-icon" aria-hidden="true">
                {helperIcon}
              </span>
            )}
            {helperContent !== undefined && (
              <p id={helperId} className="dsn-search-bar-helper">
                {helperContent}
              </p>
            )}
          </div>
          {maxLength !== undefined && (
            <span className="dsn-search-bar-count" aria-live="polite" aria-atomic="true">
              {displayCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
