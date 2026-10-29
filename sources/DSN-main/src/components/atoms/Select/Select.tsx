import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { MenuCell } from '../MenuCell';
import { SearchBar } from '../SearchBar';
import {
  PopoverWrapper,
  isPointerInsideAnchoredPopover,
  focusWithoutScroll,
  scrollIntoPopoverView,
} from '../../molecules/PopoverWrapper';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  /** Optional right-aligned meta text for this option in the menu (e.g. a count). */
  descriptionRight?: string;
  disabled?: boolean;
  /** Optional leading visual for this option in the menu (e.g. a flag or color swatch). */
  icon?: React.ReactNode;
}

/**
 * Lists longer than this get a search field in the popover by default. 10 is where a list
 * stops fitting the popover's max-height (`--popover-height-max`, ~9 rows) and starts
 * to scroll — once users have to scroll, they get to type instead.
 */
export const SELECT_SEARCH_THRESHOLD = 10;

export interface SelectProps {
  id?: string;
  /** Optional visible label above the control. Omit to use only the control (e.g. inline); ensure aria-label is set for accessibility. */
  label?: string;
  placeholder?: string;
  options?: SelectOption[];
  value?: string;
  defaultValue?: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  error?: boolean;
  /** When true, appends "(optional)" to the label and suppresses aria-required. */
  optional?: boolean;
  helperText?: string;
  errorMessage?: string;
  /** Optional icon next to help text. Only shown when helperText or errorMessage is present. */
  helperIcon?: React.ReactNode;
  /** When true, shows a leading icon in the control. Pass leadingIcon with a contextual icon (e.g. matching the label). */
  icon?: boolean;
  /** Icon shown at the start of the control when icon is true. Should be contextual with the label (e.g. globe for "Country"). */
  leadingIcon?: React.ReactNode;
  className?: string;
  name?: string;
  onChange?: (value: string, option: SelectOption) => void;
  onOpenChange?: (open: boolean) => void;
  /**
   * Shows a search field in the popover that filters options by label.
   * Defaults to `true` when there are more than `SELECT_SEARCH_THRESHOLD` (10) options.
   */
  searchable?: boolean;
  /** Placeholder for the popover search field. */
  searchPlaceholder?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Select({
  id,
  label,
  placeholder = 'Placeholder',
  options = [],
  value,
  defaultValue,
  open,
  defaultOpen = false,
  disabled = false,
  error = false,
  optional = false,
  helperText,
  errorMessage,
  helperIcon,
  icon = false,
  leadingIcon,
  className,
  name,
  onChange,
  onOpenChange,
  searchable,
  searchPlaceholder = 'Search',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? `dsn-select-${autoId}`;
  const listboxId = `${selectId}-listbox`;
  const helperId = `${selectId}-helper`;
  const labelId = `${selectId}-label`;

  const hasLabel = label != null && label !== '';
  const showLeadingIcon = Boolean(icon && leadingIcon);

  const isValueControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const selectedValue = isValueControlled ? value : internalValue;

  const isOpenControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isOpenControlled ? open : internalOpen;

  const rootRef = useRef<HTMLDivElement>(null);
  const controlWrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLElement | null>>([]);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState('');
  const isSearchable = searchable ?? options.length > SELECT_SEARCH_THRESHOLD;
  const normalizedQuery = query.trim().toLowerCase();
  // Navigation, refs and rendering all work on the filtered list.
  const visibleOptions = useMemo(
    () =>
      isSearchable && normalizedQuery
        ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
        : options,
    [isSearchable, normalizedQuery, options],
  );
  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );

  const helperContent = error && errorMessage ? errorMessage : helperText;
  const optionsLabel = hasLabel ? `${label} options` : ariaLabel ? `${ariaLabel} options` : 'Options';

  const getNextEnabledIndex = useCallback(
    (startIndex: number, direction: 1 | -1) => {
      if (visibleOptions.length === 0) {
        return -1;
      }

      let index = startIndex;
      for (let attempt = 0; attempt < visibleOptions.length; attempt += 1) {
        index = (index + direction + visibleOptions.length) % visibleOptions.length;
        if (!visibleOptions[index]?.disabled) {
          return index;
        }
      }
      return -1;
    },
    [visibleOptions],
  );

  const getInitialActiveIndex = useCallback(
    (preferLast = false) => {
      if (visibleOptions.length === 0) {
        return -1;
      }

      const selectedIndex = visibleOptions.findIndex(
        (option) => option.value === selectedValue && !option.disabled,
      );
      if (selectedIndex >= 0) {
        return selectedIndex;
      }

      if (preferLast) {
        for (let index = visibleOptions.length - 1; index >= 0; index -= 1) {
          if (!visibleOptions[index]?.disabled) {
            return index;
          }
        }
        return -1;
      }

      return visibleOptions.findIndex((option) => !option.disabled);
    },
    [visibleOptions, selectedValue],
  );

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isOpenControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isOpenControlled, onOpenChange],
  );

  function handleSelect(option: SelectOption) {
    if (option.disabled || disabled) {
      return;
    }

    if (!isValueControlled) {
      setInternalValue(option.value);
    }
    onChange?.(option.value, option);
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }
      if (!isPointerInsideAnchoredPopover(event, rootRef.current, listboxId)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [setOpen]);

  const focusSearch = useCallback(() => {
    focusWithoutScroll(searchWrapRef.current?.querySelector('input'));
  }, []);

  // Runs on open only — typing in the search field must not steal focus back to an option.
  useEffect(() => {
    if (!isOpen || disabled) {
      setActiveIndex(-1);
      setQuery('');
      return;
    }

    const initialIndex = getInitialActiveIndex();
    setActiveIndex(initialIndex);
    if (isSearchable) {
      // Keep the selected option in view under the search field, but type-to-filter first.
      if (initialIndex >= 0) {
        scrollIntoPopoverView(optionRefs.current[initialIndex]);
      }
      focusSearch();
    } else if (initialIndex >= 0) {
      focusWithoutScroll(optionRefs.current[initialIndex]);
    }
  }, [disabled, isOpen]);

  useEffect(() => {
    if (isOpen && isSearchable) {
      setActiveIndex(getInitialActiveIndex());
    }
  }, [normalizedQuery]);

  return (
    <div
      ref={rootRef}
      className={['dsn-select', className].filter(Boolean).join(' ')}
      data-disabled={disabled || undefined}
      data-error={error || undefined}
      data-open={isOpen || undefined}
    >
      {hasLabel && (
        <label className="dsn-select-label" id={labelId} htmlFor={selectId}>
          {label}
          {optional && (
            <span className="dsn-select-optional"> (optional)</span>
          )}
        </label>
      )}

      <div ref={controlWrapRef} className="dsn-select-control-wrap">
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          className="dsn-select-control"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby ?? (hasLabel ? labelId : undefined)}
          aria-invalid={error || undefined}
          aria-required={!optional || undefined}
          aria-describedby={helperContent ? helperId : undefined}
          onClick={() => setOpen(!isOpen)}
          onKeyDown={(event) => {
            if (
              event.key === 'ArrowDown' ||
              event.key === 'ArrowUp' ||
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              event.preventDefault();
              if (event.key === 'ArrowUp') {
                setActiveIndex(getInitialActiveIndex(true));
              }
              setOpen(true);
            }
            if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          {showLeadingIcon && (
            <span className="dsn-select-icon-wrap" aria-hidden="true">
              <span className="dsn-select-icon">{leadingIcon}</span>
            </span>
          )}

          <span className="dsn-select-label-wrap">
            <span className="dsn-select-value" data-placeholder={!selectedOption || undefined}>
              {selectedOption?.label ?? placeholder}
            </span>
          </span>

          <span className="dsn-select-icon-wrap" aria-hidden="true">
            <span className="dsn-select-icon">
              <ChevronDownIcon />
            </span>
          </span>
        </button>

        {isOpen && !disabled && (
          <PopoverWrapper
            id={listboxId}
            // With a search field the panel is a dialog wrapping the listbox (a listbox may only own options).
            role={isSearchable ? 'dialog' : 'listbox'}
            aria-label={optionsLabel}
            className="dsn-select-popover"
            contentClassName="dsn-select-popover-stack"
            contentPadding="small"
            anchorRef={controlWrapRef}
            offset={4}
            onExternalScroll={() => setOpen(false)}
            viewportMargin={16}
            matchAnchorWidth
            search={
              isSearchable ? (
                <div
                  ref={searchWrapRef}
                  className="dsn-select-search"
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      const firstIndex = visibleOptions.findIndex((item) => !item.disabled);
                      setActiveIndex(firstIndex);
                      if (firstIndex >= 0) {
                        focusWithoutScroll(optionRefs.current[firstIndex]);
                      }
                    } else if (event.key === 'Enter') {
                      event.preventDefault();
                      const match = visibleOptions[activeIndex] ?? visibleOptions.find((item) => !item.disabled);
                      if (match && !match.disabled) {
                        handleSelect(match);
                      }
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      setOpen(false);
                      triggerRef.current?.focus();
                    }
                  }}
                >
                  <SearchBar
                    variant="ghost"
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onClear={() => setQuery('')}
                    autoComplete="off"
                  />
                </div>
              ) : undefined
            }
            content={
              <div
                role={isSearchable ? 'listbox' : undefined}
                aria-label={isSearchable ? optionsLabel : undefined}
              >
                {visibleOptions.map((option, index) => (
                  <MenuCell
                    key={option.value}
                    tabIndex={activeIndex === index ? 0 : -1}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        const nextIndex = getNextEnabledIndex(
                          activeIndex >= 0 ? activeIndex : getInitialActiveIndex(),
                          1,
                        );
                        setActiveIndex(nextIndex);
                        if (nextIndex >= 0) {
                          focusWithoutScroll(optionRefs.current[nextIndex]);
                        }
                        return;
                      }

                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        // From the first option, ArrowUp returns to the search field.
                        if (isSearchable && index === visibleOptions.findIndex((item) => !item.disabled)) {
                          focusSearch();
                          return;
                        }
                        const previousIndex = getNextEnabledIndex(
                          activeIndex >= 0 ? activeIndex : getInitialActiveIndex(true),
                          -1,
                        );
                        setActiveIndex(previousIndex);
                        if (previousIndex >= 0) {
                          focusWithoutScroll(optionRefs.current[previousIndex]);
                        }
                        return;
                      }

                      if (event.key === 'Home') {
                        event.preventDefault();
                        const firstIndex = visibleOptions.findIndex((item) => !item.disabled);
                        setActiveIndex(firstIndex);
                        if (firstIndex >= 0) {
                          focusWithoutScroll(optionRefs.current[firstIndex]);
                        }
                        return;
                      }

                      if (event.key === 'End') {
                        event.preventDefault();
                        let lastIndex = -1;
                        for (let index = visibleOptions.length - 1; index >= 0; index -= 1) {
                          if (!visibleOptions[index]?.disabled) {
                            lastIndex = index;
                            break;
                          }
                        }
                        setActiveIndex(lastIndex);
                        if (lastIndex >= 0) {
                          focusWithoutScroll(optionRefs.current[lastIndex]);
                        }
                        return;
                      }

                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setOpen(false);
                        triggerRef.current?.focus();
                      }
                    }}
                    ref={(node: HTMLElement | null) => {
                      optionRefs.current[index] = node;
                    }}
                    className="dsn-select-option"
                    label={option.label}
                    description={option.description}
                    showDescription={Boolean(option.description)}
                    descriptionRight={option.descriptionRight}
                    showDescriptionRight={Boolean(option.descriptionRight)}
                    showLeadingIcon={option.icon != null}
                    leadingIcon={option.icon}
                    showTrailingIcon={selectedValue === option.value}
                    selected={selectedValue === option.value}
                    disabled={option.disabled}
                    role="option"
                    aria-selected={selectedValue === option.value}
                    onClick={() => handleSelect(option)}
                  />
                ))}
                {visibleOptions.length === 0 && (
                  <p className="dsn-select-empty" role="status">
                    No results
                  </p>
                )}
              </div>
            }
          />
        )}
      </div>

      {name && <input type="hidden" name={name} value={selectedValue ?? ''} />}

      {helperContent && (
        <div className="dsn-select-meta">
          {helperIcon != null && (
            <span className="dsn-select-meta-icon-wrap" aria-hidden="true">
              <span className="dsn-select-meta-icon">{helperIcon}</span>
            </span>
          )}
          <p id={helperId} className="dsn-select-helper">
            {helperContent}
          </p>
        </div>
      )}

    </div>
  );
}

export default Select;
