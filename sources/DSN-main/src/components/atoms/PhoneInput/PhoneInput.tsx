import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MenuCell } from '../MenuCell';
import { PopoverWrapper, isPointerInsideAnchoredPopover, focusWithoutScroll } from '../../molecules/PopoverWrapper';
import './PhoneInput.css';

export interface PhoneCountryOption {
  label: string;
  value: string;
}

export interface PhoneInputProps {
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
  helperIcon?: React.ReactNode;
  countryCode?: string;
  defaultCountryCode?: string;
  countryOptions?: PhoneCountryOption[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onCountryCodeChange?: (countryCode: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  countryCodeAriaLabel?: string;
  autoComplete?: string;
  name?: string;
  className?: string;
}

const DEFAULT_COUNTRIES: PhoneCountryOption[] = [
  { label: 'United States (+1)', value: '+1' },
  { label: 'Portugal (+351)', value: '+351' },
  { label: 'United Kingdom (+44)', value: '+44' },
  { label: 'Germany (+49)', value: '+49' },
];

function normalizeDialCode(code: string): string {
  return code.replace(/\s+/g, '').replace(/^\+/, '');
}

function parseInternationalPaste(
  pasted: string,
  options: PhoneCountryOption[],
): { countryCode?: string; localNumber: string } | null {
  const trimmed = pasted.trim();
  if (!trimmed.startsWith('+')) return null;

  const normalized = trimmed.replace(/[^\d+]/g, '');
  const digits = normalized.slice(1);
  if (!digits) return null;

  const sorted = [...options].sort(
    (a, b) => normalizeDialCode(b.value).length - normalizeDialCode(a.value).length,
  );

  const match = sorted.find((option) =>
    digits.startsWith(normalizeDialCode(option.value)),
  );

  if (!match) return null;

  const local = digits.slice(normalizeDialCode(match.value).length);
  return { countryCode: match.value, localNumber: local };
}

/**
 * Text input for international phone numbers with a country-code selector prefix.
 *
 * @aiSelectWhen Collecting a phone number that may be international
 *
 * @aiAvoid Do not use when the product only ever operates in a single locale — use a plain text input with a fixed format hint instead
 * @aiAvoid Do not use for non-phone numeric identifiers — use NumberInput or a plain text input instead
 *
 * @aiSpatial Owns its own padding; control row fills container width, country selector sits at a fixed width to the left of the field
 *
 * @aiCompose Internally composes MenuCell and PopoverWrapper for the country dropdown — never wrap in an additional popover/menu component
 */
export function PhoneInput({
  id,
  label,
  placeholder = '1234567890',
  value,
  defaultValue,
  disabled = false,
  error = false,
  optional = false,
  helperText,
  errorMessage,
  helperIcon,
  countryCode,
  defaultCountryCode = '+1',
  countryOptions = DEFAULT_COUNTRIES,
  onChange,
  onCountryCodeChange,
  onBlur,
  onFocus,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  countryCodeAriaLabel = 'Country code',
  autoComplete = 'tel',
  name,
  className,
}: PhoneInputProps) {
  const autoId = useId();
  const inputId = id ?? `dsn-phone-input-${autoId}`;
  const helperId = `${inputId}-helper`;
  const countryMenuId = `${inputId}-country-menu`;

  const [internalCode, setInternalCode] = useState(defaultCountryCode);
  const activeCode = countryCode ?? internalCode;

  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const displayValue = value ?? internalValue;
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const countryTriggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeCountryIndex, setActiveCountryIndex] = useState(-1);

  const helperContent = error && errorMessage ? errorMessage : helperText;
  const hasHelperContent = Boolean(helperText) || (error && Boolean(errorMessage));
  const describedBy = hasHelperContent ? helperId : undefined;

  const safeCountryOptions = useMemo(() => {
    if (countryOptions.length === 0) return DEFAULT_COUNTRIES;
    return countryOptions;
  }, [countryOptions]);

  function getInitialCountryIndex(preferLast = false): number {
    const selectedIndex = safeCountryOptions.findIndex((option) => option.value === activeCode);
    if (selectedIndex >= 0) {
      return selectedIndex;
    }

    if (safeCountryOptions.length === 0) {
      return -1;
    }

    return preferLast ? safeCountryOptions.length - 1 : 0;
  }

  function getNextCountryIndex(startIndex: number, direction: 1 | -1): number {
    if (safeCountryOptions.length === 0) {
      return -1;
    }
    return (startIndex + direction + safeCountryOptions.length) % safeCountryOptions.length;
  }

  function setCode(nextCode: string) {
    if (countryCode === undefined) {
      setInternalCode(nextCode);
    }
    onCountryCodeChange?.(nextCode);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const parsed = parseInternationalPaste(
      e.clipboardData.getData('text'),
      safeCountryOptions,
    );
    if (!parsed) return;

    e.preventDefault();
    setCode(parsed.countryCode ?? activeCode);
    if (value === undefined) {
      setInternalValue(parsed.localNumber);
    }
  }

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current || !isCountryMenuOpen) {
        return;
      }

      if (!isPointerInsideAnchoredPopover(event, rootRef.current, countryMenuId)) {
        setIsCountryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isCountryMenuOpen]);

  useEffect(() => {
    if (!isCountryMenuOpen || disabled) {
      setActiveCountryIndex(-1);
      return;
    }

    const initialIndex = getInitialCountryIndex();
    setActiveCountryIndex(initialIndex);
    if (initialIndex >= 0) {
      focusWithoutScroll(optionRefs.current[initialIndex]);
    }
  }, [activeCode, disabled, isCountryMenuOpen, safeCountryOptions]);

  return (
    <div
      ref={rootRef}
      className={`dsn-phone-input${className ? ` ${className}` : ''}`}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
    >
      {label && (
        <label className="dsn-phone-input-label" htmlFor={inputId}>
          {label}
          {optional && (
            <span className="dsn-phone-input-optional"> (optional)</span>
          )}
        </label>
      )}

      <div className="dsn-phone-input-control" role="group" aria-label="Phone number">
        <span className="dsn-phone-input-country-wrap">
          <button
            ref={countryTriggerRef}
            type="button"
            className="dsn-phone-input-country-visual"
            disabled={disabled}
            aria-label={countryCodeAriaLabel}
            aria-haspopup="menu"
            aria-expanded={isCountryMenuOpen}
            aria-controls={isCountryMenuOpen ? countryMenuId : undefined}
            onClick={() => setIsCountryMenuOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                event.preventDefault();
                setIsCountryMenuOpen(true);
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveCountryIndex(getInitialCountryIndex(true));
                setIsCountryMenuOpen(true);
              }
              if (event.key === 'Escape') {
                setIsCountryMenuOpen(false);
              }
            }}
          >
            <span className="dsn-phone-input-country-code">{activeCode}</span>
            <span className="dsn-phone-input-country-chevron" aria-hidden="true">
              <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
            </span>
          </button>
          {isCountryMenuOpen && !disabled && (
            <PopoverWrapper
              id={countryMenuId}
              role="menu"
              aria-label={`${countryCodeAriaLabel} options`}
              className="dsn-phone-input-country-popover"
              contentClassName="dsn-phone-input-country-popover-content"
              contentPadding="small"
              anchorRef={countryTriggerRef}
              offset={4}
              onExternalScroll={() => setIsCountryMenuOpen(false)}
              viewportMargin={16}
              matchAnchorWidth
              content={
                <div>
                  {safeCountryOptions.map((option, index) => (
                    <MenuCell
                      key={option.value}
                      ref={(node: HTMLElement | null) => {
                        optionRefs.current[index] = node;
                      }}
                      tabIndex={activeCountryIndex === index ? 0 : -1}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          const nextIndex = getNextCountryIndex(
                            activeCountryIndex >= 0 ? activeCountryIndex : getInitialCountryIndex(),
                            1,
                          );
                          setActiveCountryIndex(nextIndex);
                          focusWithoutScroll(optionRefs.current[nextIndex]);
                          return;
                        }

                        if (event.key === 'ArrowUp') {
                          event.preventDefault();
                          const previousIndex = getNextCountryIndex(
                            activeCountryIndex >= 0
                              ? activeCountryIndex
                              : getInitialCountryIndex(true),
                            -1,
                          );
                          setActiveCountryIndex(previousIndex);
                          focusWithoutScroll(optionRefs.current[previousIndex]);
                          return;
                        }

                        if (event.key === 'Home') {
                          event.preventDefault();
                          setActiveCountryIndex(0);
                          focusWithoutScroll(optionRefs.current[0]);
                          return;
                        }

                        if (event.key === 'End') {
                          event.preventDefault();
                          const lastIndex = safeCountryOptions.length - 1;
                          setActiveCountryIndex(lastIndex);
                          focusWithoutScroll(optionRefs.current[lastIndex]);
                          return;
                        }

                        if (event.key === 'Escape') {
                          event.preventDefault();
                          setIsCountryMenuOpen(false);
                          countryTriggerRef.current?.focus();
                        }
                      }}
                      className="dsn-phone-input-country-option"
                      label={option.label}
                      showLeadingIcon={false}
                      showTrailingIcon={activeCode === option.value}
                      selected={activeCode === option.value}
                      aria-label={option.label}
                      onClick={() => {
                        setCode(option.value);
                        setIsCountryMenuOpen(false);
                        countryTriggerRef.current?.focus();
                      }}
                    />
                  ))}
                </div>
              }
            />
          )}
        </span>

        <input
          type="tel"
          id={inputId}
          className="dsn-phone-input-field"
          placeholder={placeholder}
          value={displayValue}
          defaultValue={defaultValue}
          disabled={disabled}
          name={name}
          autoComplete={autoComplete}
          aria-invalid={error || undefined}
          aria-required={!optional || undefined}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      </div>

      {helperContent && (
        <div className="dsn-phone-input-meta">
          <div className="dsn-phone-input-helper-inner">
            {helperIcon && (
              <span className="dsn-phone-input-icon" aria-hidden="true">
                {helperIcon}
              </span>
            )}
            <p id={helperId} className="dsn-phone-input-helper">
              {helperContent}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhoneInput;
