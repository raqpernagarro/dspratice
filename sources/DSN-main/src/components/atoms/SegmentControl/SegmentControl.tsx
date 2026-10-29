import React from 'react';
import { SegmentControlSelector } from './SegmentControlSelector';
import './SegmentControl.css';

export interface SegmentControlOption {
  value: string;
  label: string;
  disabled?: boolean;
  showLeadingIcon?: boolean;
  leadingIcon?: React.ReactNode;
  showTrailingIcon?: boolean;
  trailingIcon?: React.ReactNode;
  'aria-label'?: string;
}

export interface SegmentControlProps {
  options: SegmentControlOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  className?: string;
  'aria-label'?: string;
}

function getFirstSelectableValue(options: SegmentControlOption[]): string {
  const firstEnabled = options.find((option) => !option.disabled);
  return (firstEnabled ?? options[0])?.value ?? '';
}

/**
 * role="radiogroup" of equal-width selectors that switches between mutually exclusive views/modes instantly, with no content panels.
 *
 * @aiSelectWhen Switching between 2–5 mutually exclusive views or display modes that take effect instantly
 * @aiSelectWhen Toggling between data representations (e.g. Chart/Table) or time ranges/filter scopes
 *
 * @aiAvoid Do not use with more than 5 options — use Select or Tabs instead
 * @aiAvoid Do not use when options represent named content sections with distinct panels — use Tabs instead
 * @aiAvoid Do not use when selection requires confirmation before taking effect — use Radio instead
 * @aiAvoid Do not use for a binary setting — use Switcher instead
 * @aiAvoid Do not use for filters that can stack or combine — use Chip instead
 *
 * @aiVariant fullWidth={false} — hugs its content (default). Always use in large containers and in bars with other controls (e.g. Toolbar filter-bar)
 * @aiVariant fullWidth={true} — spans its container; only when it is the sole element of a small bar/panel, or shares it with one or two actions
 *
 * @aiSpatial Owns its internal padding and selector layout but not its margin from siblings; place within a toolbar or page header row.
 *
 * @aiCompose Never place in the middle of body content — belongs in a toolbar or control bar
 */
export function SegmentControl({
  options,
  value,
  defaultValue,
  onChange,
  fullWidth = false,
  className,
  'aria-label': ariaLabel = 'Segment control',
}: SegmentControlProps) {
  const firstSelectableValue = React.useMemo(
    () => getFirstSelectableValue(options),
    [options],
  );
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(
    defaultValue ?? firstSelectableValue,
  );
  const selectedValue = isControlled ? value : internalValue;
  const [focusIndex, setFocusIndex] = React.useState(() => {
    const selectedIndex = options.findIndex((option) => option.value === selectedValue);
    return selectedIndex >= 0 ? selectedIndex : 0;
  });
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  React.useEffect(() => {
    if (!isControlled && options.every((option) => option.value !== internalValue)) {
      setInternalValue(firstSelectableValue);
    }
  }, [firstSelectableValue, internalValue, isControlled, options]);

  React.useEffect(() => {
    const selectedIndex = options.findIndex((option) => option.value === selectedValue);
    if (selectedIndex >= 0) {
      setFocusIndex(selectedIndex);
    }
  }, [options, selectedValue]);

  const selectValue = React.useCallback(
    (nextValue: string) => {
      const nextOption = options.find((option) => option.value === nextValue);
      if (!nextOption || nextOption.disabled) {
        return;
      }

      if (!isControlled) {
        setInternalValue(nextValue);
      }

      if (nextValue !== selectedValue) {
        onChange?.(nextValue);
      }
    },
    [isControlled, onChange, options, selectedValue],
  );

  const moveSelection = React.useCallback(
    (startIndex: number, direction: 1 | -1) => {
      if (options.length === 0) {
        return;
      }

      let index = startIndex;
      for (let attempt = 0; attempt < options.length; attempt += 1) {
        index = (index + direction + options.length) % options.length;
        if (!options[index].disabled) {
          const next = options[index];
          setFocusIndex(index);
          selectValue(next.value);
          refs.current[index]?.focus();
          return;
        }
      }
    },
    [options, selectValue],
  );

  const rootClass = ['dsn-segment-control', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} role="radiogroup" aria-label={ariaLabel} data-full-width={fullWidth}>
      {options.map((option, index) => {
        const isActive = option.value === selectedValue;
        const tabIndex = index === focusIndex ? 0 : -1;
        const selectorId = `dsn-segment-control-${option.value}`;

        return (
          <SegmentControlSelector
            key={option.value}
            id={selectorId}
            label={option.label}
            active={isActive}
            disabled={Boolean(option.disabled)}
            tabIndex={tabIndex}
            showLeadingIcon={option.showLeadingIcon}
            leadingIcon={option.leadingIcon}
            showTrailingIcon={option.showTrailingIcon}
            trailingIcon={option.trailingIcon}
            ariaLabel={option['aria-label']}
            buttonRef={(node) => {
              refs.current[index] = node;
            }}
            onSelect={() => selectValue(option.value)}
            onFocus={() => setFocusIndex(index)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                moveSelection(index, 1);
                return;
              }

              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                moveSelection(index, -1);
                return;
              }

              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                selectValue(option.value);
              }
            }}
          />
        );
      })}
    </div>
  );
}

export default SegmentControl;
