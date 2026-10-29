import React, { useId, useState } from 'react';
import { Chip, ChipGroup, type ChipProps, type ChipSize } from '../../atoms/Chip';
import './ChipField.css';

export interface ChipFieldOption {
  id: string;
  label: string;
  disabled?: boolean;
  chipProps?: Partial<ChipProps>;
}

export interface ChipFieldProps {
  id?: string;
  label?: string;
  options?: ChipFieldOption[];
  value?: string[];
  defaultValue?: string[];
  helperText?: string;
  helperIcon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
  /** When true, appends "(optional)" to the legend and suppresses aria-required. */
  optional?: boolean;
  disabled?: boolean;
  size?: ChipSize;
  className?: string;
  onValueChange?: (value: string[]) => void;
  'aria-label'?: string;
}

const DEFAULT_OPTIONS: ChipFieldOption[] = Array.from({ length: 8 }, (_, index) => ({
  id: `option-${index + 1}`,
  label: 'Label',
}));

/**
 * Labelled fieldset of toggleable chips for picking any number of options from a short, fixed, visible list.
 *
 * @aiSelectWhen A form field needs multi-select from up to 3 short, visible options
 *
 * @aiAvoid Do not use for 4+ options — use MultiChoice or Combobox selectionMode="multi" instead
 * @aiAvoid Do not use for single selection — use SingleChoice or SegmentControl instead
 * @aiAvoid Do not use for toolbar filters — use PopoverMenu with checkbox-cell items instead
 * @aiAvoid Do not use for free-form typed values — use Combobox selectionMode="multi" instead
 *
 * @aiVariant size="md" — standard forms; size="sm" — dense panels
 *
 * @aiSpatial Owns its legend, chip group and helper spacing; chips wrap within the parent's width.
 *
 * @aiCompose Always pass label, options and helperText — the defaults are placeholders ("Label", "Help text")
 */
export function ChipField({
  id,
  label = 'Label',
  options = DEFAULT_OPTIONS,
  value,
  defaultValue = [],
  helperText = 'Help text',
  helperIcon,
  error = false,
  errorMessage,
  optional = false,
  disabled = false,
  size = 'md',
  className,
  onValueChange,
  'aria-label': ariaLabel,
}: ChipFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `dsn-chip-field-${autoId}`;
  const helperId = `${fieldId}-helper`;
  const helperContent = error && errorMessage ? errorMessage : helperText;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const selectedValues = isControlled ? value : internalValue;
  const selectedValueSet = new Set(selectedValues);

  function handleToggle(optionId: string) {
    const nextValues = selectedValueSet.has(optionId)
      ? selectedValues.filter((valueItem) => valueItem !== optionId)
      : [...selectedValues, optionId];

    if (!isControlled) {
      setInternalValue(nextValues);
    }
    onValueChange?.(nextValues);
  }

  return (
    <div
      className={['dsn-chip-field', className].filter(Boolean).join(' ')}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      <fieldset
        className="dsn-chip-fieldset"
        aria-label={ariaLabel}
        aria-describedby={helperContent ? helperId : undefined}
        aria-invalid={error || undefined}
        aria-required={!optional || undefined}
      >
        <legend className="dsn-chip-field-label">
          {label}
          {optional && (
            <span className="dsn-chip-field-optional"> (optional)</span>
          )}
        </legend>

        <ChipGroup label={label} className="dsn-chip-field-group">
          {options.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              size={size}
              selected={selectedValueSet.has(option.id)}
              disabled={disabled || option.disabled}
              onClick={() => handleToggle(option.id)}
              {...option.chipProps}
            />
          ))}
        </ChipGroup>
      </fieldset>

      {helperContent && (
        <div className="dsn-chip-field-meta">
          {helperIcon && (
            <span className="dsn-chip-field-meta-icon-wrap" aria-hidden="true">
              <span className="dsn-chip-field-meta-icon">{helperIcon}</span>
            </span>
          )}
          <p id={helperId} className="dsn-chip-field-helper">
            {helperContent}
          </p>
        </div>
      )}
    </div>
  );
}

export default ChipField;
