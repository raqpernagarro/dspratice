import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, CircleX } from 'lucide-react';
import { Chip } from '../Chip';
import { MenuCell } from '../MenuCell';
import { PopoverWrapper, isPointerInsideAnchoredPopover, focusWithoutScroll } from '../../molecules/PopoverWrapper';
import './Combobox.css';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  selectionMode?: 'single' | 'multi';
  id?: string;
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  options?: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  values?: string[];
  defaultValues?: string[];
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  showHelper?: boolean;
  errorMessage?: string;
  /** When true, appends "(optional)" to the label and suppresses aria-required. */
  optional?: boolean;
  helperIcon?: React.ReactNode;
  className?: string;
  name?: string;
  onChange?: (value: string, option: ComboboxOption) => void;
  onValuesChange?: (values: string[], options: ComboboxOption[]) => void;
  onOpenChange?: (open: boolean) => void;
  onInputChange?: (query: string) => void;
  /** Gap between trigger and dropdown (default 4 = --space-tiny). Use for consistent alignment e.g. inside DateTimePicker. */
  popoverOffset?: number;
  /** When false, hides the clear (X) button. Defaults to true. */
  showClearButton?: boolean;
  /** Called after Enter commits or closes the listbox. Receives the current input query. */
  onEnter?: (query: string) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function Combobox({
  selectionMode = 'single',
  id,
  label = 'Label',
  showLabel = true,
  placeholder = 'Placeholder',
  options = [],
  value,
  defaultValue,
  values,
  defaultValues = [],
  open,
  defaultOpen = false,
  disabled = false,
  error = false,
  optional = false,
  helperText = 'Help text',
  showHelper = true,
  errorMessage,
  helperIcon,
  className,
  name,
  onChange,
  onValuesChange,
  onOpenChange,
  onInputChange,
  popoverOffset,
  showClearButton = true,
  onEnter,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: ComboboxProps) {
  const isMulti = selectionMode === 'multi';
  const autoId = useId();
  const comboboxId = id ?? `dsn-combobox-${autoId}`;
  const listboxId = `${comboboxId}-listbox`;
  const helperId = `${comboboxId}-helper`;
  const labelId = `${comboboxId}-label`;
  const selectedDescriptionId = `${comboboxId}-selected`;
  const liveRegionId = `${comboboxId}-live`;

  const isValueControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const selectedValue = isValueControlled ? value : internalValue;
  const selectedOption = useMemo<ComboboxOption | undefined>(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );

  const isValuesControlled = values !== undefined;
  const [internalValues, setInternalValues] = useState<string[]>(defaultValues);
  const committedValues = useMemo(
    () =>
      (isValuesControlled ? values ?? [] : internalValues).filter((valueItem) =>
        options.some((option) => option.value === valueItem),
      ),
    [internalValues, isValuesControlled, options, values],
  );
  const committedValueSet = useMemo(() => new Set(committedValues), [committedValues]);

  const committedOptions = useMemo(
    () => options.filter((option) => committedValueSet.has(option.value)),
    [committedValueSet, options],
  );

  const [query, setQuery] = useState(isMulti ? '' : selectedOption?.label ?? '');
  const [listFilter, setListFilter] = useState('');
  useEffect(() => {
    if (!isMulti) {
      if (isValueControlled) {
        if (!selectedValue) {
          setQuery('');
          return;
        }
        const matchedOption = options.find((option) => option.value === selectedValue);
        if (matchedOption) {
          setQuery(matchedOption.label);
        }
        return;
      }
      setQuery(selectedOption?.label ?? '');
    }
  }, [isMulti, isValueControlled, options, selectedOption?.label, selectedValue]);

  useEffect(() => {
    if (isMulti && !isValuesControlled) {
      const sanitized = internalValues.filter((valueItem) =>
        options.some((option) => option.value === valueItem),
      );
      if (sanitized.length !== internalValues.length) {
        setInternalValues(sanitized);
      }
    }
  }, [internalValues, isMulti, isValuesControlled, options]);

  const isOpenControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isOpenControlled ? open : internalOpen;

  const rootRef = useRef<HTMLDivElement>(null);
  const controlWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressNextFocusOpenRef = useRef(false);
  const previousOpenRef = useRef(false);
  const optionRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [liveMessage, setLiveMessage] = useState('');

  const helperContent = error && errorMessage ? errorMessage : helperText;
  const normalizedListFilter = listFilter.trim().toLowerCase();
  const filteredOptions = useMemo(
    () =>
      normalizedListFilter.length === 0
        ? options
        : options.filter((option) => option.label.toLowerCase().includes(normalizedListFilter)),
    [normalizedListFilter, options],
  );

  const getNextEnabledIndex = useCallback(
    (startIndex: number, direction: 1 | -1) => {
      if (filteredOptions.length === 0) {
        return -1;
      }

      let index = startIndex;
      for (let attempt = 0; attempt < filteredOptions.length; attempt += 1) {
        index = (index + direction + filteredOptions.length) % filteredOptions.length;
        if (!filteredOptions[index]?.disabled) {
          return index;
        }
      }
      return -1;
    },
    [filteredOptions],
  );

  const getInitialActiveIndex = useCallback(
    (preferLast = false) => {
      if (filteredOptions.length === 0) {
        return -1;
      }

      const selectedIndex = filteredOptions.findIndex(
        (option) => option.value === selectedValue && !option.disabled,
      );
      if (selectedIndex >= 0) {
        return selectedIndex;
      }

      if (preferLast) {
        for (let index = filteredOptions.length - 1; index >= 0; index -= 1) {
          if (!filteredOptions[index]?.disabled) {
            return index;
          }
        }
        return -1;
      }

      return filteredOptions.findIndex((option) => !option.disabled);
    },
    [filteredOptions, selectedValue],
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

  const normalizeValueOrder = useCallback(
    (rawValues: string[]) => {
      const nextSet = new Set(rawValues);
      return options
        .filter((option) => nextSet.has(option.value))
        .map((option) => option.value);
    },
    [options],
  );

  const removeCommittedValue = useCallback(
    (nextValue: string) => {
      const removedOption = options.find((option) => option.value === nextValue);
      const nextCommitted = committedValues.filter((valueItem) => valueItem !== nextValue);
      if (!isValuesControlled) {
        setInternalValues(nextCommitted);
      }
      onValuesChange?.(
        nextCommitted,
        options.filter((option) => nextCommitted.includes(option.value)),
      );
      if (removedOption) {
        setLiveMessage(`Removed ${removedOption.label}`);
      }
    },
    [committedValues, isValuesControlled, onValuesChange, options],
  );

  const toggleCommittedValue = useCallback(
    (option: ComboboxOption) => {
      if (option.disabled || disabled) {
        return;
      }
      if (committedValueSet.has(option.value)) {
        removeCommittedValue(option.value);
      } else {
        const nextCommitted = normalizeValueOrder([...committedValues, option.value]);
        if (!isValuesControlled) {
          setInternalValues(nextCommitted);
        }
        onValuesChange?.(
          nextCommitted,
          options.filter((opt) => nextCommitted.includes(opt.value)),
        );
        setLiveMessage(`Added ${option.label}`);
      }
      inputRef.current?.focus();
    },
    [
      committedValueSet,
      committedValues,
      disabled,
      isValuesControlled,
      normalizeValueOrder,
      onValuesChange,
      options,
      removeCommittedValue,
    ],
  );

  function handleSelect(option: ComboboxOption) {
    if (option.disabled || disabled) {
      return;
    }

    if (!isValueControlled) {
      setInternalValue(option.value);
    }
    setQuery(option.label);
    setListFilter('');
    onInputChange?.(option.label);
    onChange?.(option.value, option);
    setOpen(false);
    suppressNextFocusOpenRef.current = true;
    inputRef.current?.focus();
  }

  function commitQueryValue() {
    const trimmed = query.trim();
    if (!trimmed) {
      setOpen(false);
      return;
    }

    const matched = options.find(
      (option) =>
        option.value === trimmed || option.label.toLowerCase() === trimmed.toLowerCase(),
    );

    if (matched) {
      handleSelect(matched);
      return;
    }

    if (!isValueControlled) {
      setInternalValue(trimmed);
    }
    onInputChange?.(trimmed);
    onChange?.(trimmed, { value: trimmed, label: trimmed });
    setOpen(false);
    suppressNextFocusOpenRef.current = true;
    inputRef.current?.focus();
  }

  function clearSelection() {
    if (isMulti) {
      setQuery('');
      setListFilter('');
      onInputChange?.('');
      setOpen(true);
      inputRef.current?.focus();
      return;
    }

    if (!isValueControlled) {
      setInternalValue('');
    }
    setQuery('');
    setListFilter('');
    onInputChange?.('');
    setOpen(true);
    inputRef.current?.focus();
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

  useEffect(() => {
    if (!isOpen || disabled) {
      setActiveIndex(-1);
      previousOpenRef.current = isOpen;
      return;
    }

    if (!previousOpenRef.current) {
      setListFilter('');
    }
    previousOpenRef.current = isOpen;
    setActiveIndex(getInitialActiveIndex());
  }, [disabled, getInitialActiveIndex, isOpen]);

  useEffect(() => {
    if (isMulti && isOpen && filteredOptions.length > 0) {
      const firstUnselectedIndex = filteredOptions.findIndex(
        (option) => !option.disabled && !committedValueSet.has(option.value),
      );
      const index =
        firstUnselectedIndex >= 0 ? firstUnselectedIndex : getNextEnabledIndex(-1, 1);
      if (index >= 0) {
        setActiveIndex(index);
      }
    }
  }, [isMulti, isOpen, filteredOptions, committedValueSet, getNextEnabledIndex]);


  return (
    <div
      ref={rootRef}
      className={['dsn-combobox', className].filter(Boolean).join(' ')}
      data-disabled={disabled || undefined}
      data-error={error || undefined}
      data-open={isOpen || undefined}
      data-filled={(isMulti ? committedOptions.length > 0 : Boolean(selectedOption)) || undefined}
    >
      {showLabel && (
        <label className="dsn-combobox-label" id={labelId} htmlFor={comboboxId}>
          {label}
          {optional && (
            <span className="dsn-combobox-optional"> (optional)</span>
          )}
        </label>
      )}

      {isMulti && committedOptions.length > 0 && (
        <div className="dsn-combobox-chip-stack" role="list" aria-label="Selected items">
          {committedOptions.map((option) => (
            <div key={option.value} role="listitem">
              <Chip
                size="md"
                label={option.label}
                showLeadingIcon={false}
                showTrailingIcon={false}
                onDismiss={() => removeCommittedValue(option.value)}
                dismissFocusFallback={inputRef}
              />
            </div>
          ))}
        </div>
      )}

      <div ref={controlWrapRef} className="dsn-combobox-control-wrap">
        <div className="dsn-combobox-control">
          <div className="dsn-combobox-input-row">
          <span className="dsn-combobox-value-wrap">
            <input
              ref={inputRef}
              id={comboboxId}
              className="dsn-combobox-input"
              type="text"
              role="combobox"
              autoComplete="off"
              disabled={disabled}
              value={query}
              placeholder={placeholder}
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledby ?? (showLabel ? labelId : undefined)}
              aria-invalid={error || undefined}
              aria-required={!optional || undefined}
              aria-describedby={
                [helperContent ? helperId : null, isMulti ? selectedDescriptionId : null]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              onFocus={() => {
                if (suppressNextFocusOpenRef.current) {
                  suppressNextFocusOpenRef.current = false;
                  return;
                }
                if (!disabled) {
                  setOpen(true);
                }
              }}
              onBlur={(event) => {
                if (isMulti) {
                  const nextFocusedElement = event.relatedTarget as Node | null;
                  if (nextFocusedElement && rootRef.current?.contains(nextFocusedElement)) {
                    return;
                  }
                  if (nextFocusedElement && document.getElementById(listboxId)?.contains(nextFocusedElement)) {
                    return;
                  }
                  setOpen(false);
                }
              }}
              onClick={() => {
                if (!disabled) {
                  setOpen(true);
                }
              }}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                setListFilter(nextQuery);
                onInputChange?.(nextQuery);
                if (!isOpen) {
                  setOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && isMulti && query.length === 0 && committedValues.length > 0) {
                  event.preventDefault();
                  removeCommittedValue(committedValues[committedValues.length - 1]);
                  return;
                }

                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  if (!isOpen) {
                    setOpen(true);
                    return;
                  }
                  const nextIndex = getNextEnabledIndex(
                    activeIndex >= 0 ? activeIndex : getInitialActiveIndex(),
                    1,
                  );
                  setActiveIndex(nextIndex);
                  if (nextIndex >= 0) {
                    focusWithoutScroll(optionRefs.current[nextIndex]);
                  }
                }

                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  if (!isOpen) {
                    setOpen(true);
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
                }

                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (isMulti) {
                    if (isOpen && activeIndex >= 0) {
                      const option = filteredOptions[activeIndex];
                      if (option && !option.disabled) {
                        toggleCommittedValue(option);
                      }
                    }
                  } else if (isOpen && activeIndex >= 0) {
                    const option = filteredOptions[activeIndex];
                    if (option) {
                      handleSelect(option);
                    }
                  } else if (!isMulti) {
                    commitQueryValue();
                  }
                  onEnter?.(query);
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  if (isMulti) {
                    setOpen(false);
                    inputRef.current?.focus();
                  } else {
                    setOpen(false);
                  }
                }
              }}
            />
          </span>

          {showClearButton && Boolean(query) && !disabled && (
            <button
              type="button"
              className="dsn-combobox-clear"
              aria-label={isMulti ? 'Clear search' : 'Clear selection'}
              onClick={clearSelection}
            >
              <CircleX size={16} aria-hidden="true" />
            </button>
          )}

          <span className="dsn-combobox-chevron" aria-hidden="true">
            <ChevronDown size={16} />
          </span>
        </div>
        </div>

        {isMulti && (
          <>
            <span id={selectedDescriptionId} className="dsn-combobox-sr-only">
              {committedOptions.length === 0
                ? 'No items selected'
                : `Selected: ${committedOptions.map((o) => o.label).join(', ')}`}
            </span>
            <span id={liveRegionId} className="dsn-combobox-sr-only" aria-live="polite" aria-atomic="true">
              {liveMessage}
            </span>
          </>
        )}

        {isOpen && !disabled && (
          <PopoverWrapper
            id={listboxId}
            role="listbox"
            aria-label={`${label} options`}
            multiselectable={isMulti || undefined}
            className="dsn-combobox-popover"
            contentClassName="dsn-combobox-popover-stack"
            contentPadding="small"
            anchorRef={controlWrapRef}
            offset={popoverOffset ?? 4}
            onExternalScroll={() => setOpen(false)}
            viewportMargin={16}
            matchAnchorWidth
            content={
              <div className="dsn-combobox-popover-list">
                {filteredOptions.length === 0 ? (
                  <div className="dsn-combobox-empty">No options</div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <MenuCell
                      key={option.value}
                      tabIndex={activeIndex === index ? 0 : -1}
                      ref={(node: HTMLElement | null) => {
                        optionRefs.current[index] = node;
                      }}
                      className="dsn-combobox-option"
                      label={option.label}
                      description={option.description}
                      showDescription={Boolean(option.description)}
                      showLeadingIcon={false}
                      showTrailingIcon={isMulti ? committedValueSet.has(option.value) : selectedValue === option.value}
                      selected={isMulti ? committedValueSet.has(option.value) : selectedValue === option.value}
                      disabled={option.disabled}
                      role="option"
                      aria-selected={
                        isMulti ? committedValueSet.has(option.value) : selectedValue === option.value
                      }
                      onClick={() => (isMulti ? toggleCommittedValue(option) : handleSelect(option))}
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

                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (isMulti) {
                            if (!option.disabled) {
                              toggleCommittedValue(option);
                            }
                          } else {
                            handleSelect(option);
                          }
                          return;
                        }

                        if (event.key === 'Escape') {
                          event.preventDefault();
                          setOpen(false);
                          inputRef.current?.focus();
                        }
                      }}
                    />
                  ))
                )}
              </div>
            }
          />
        )}
      </div>

      {name &&
        (isMulti
          ? committedValues.map((valueItem) => (
              <input key={valueItem} type="hidden" name={name} value={valueItem} />
            ))
          : <input type="hidden" name={name} value={selectedValue ?? ''} />)}

      {showHelper && helperContent && (
        <div className="dsn-combobox-meta">
          {helperIcon && (
            <span className="dsn-combobox-meta-icon-wrap" aria-hidden="true">
              <span className="dsn-combobox-meta-icon">{helperIcon}</span>
            </span>
          )}
          <p id={helperId} className="dsn-combobox-helper">
            {helperContent}
          </p>
        </div>
      )}
    </div>
  );
}

export default Combobox;
