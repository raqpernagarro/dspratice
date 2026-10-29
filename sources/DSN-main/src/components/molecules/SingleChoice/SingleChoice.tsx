import React, { useId, useState } from 'react';
import { Radio, type RadioProps } from '../../atoms/Radio';
import './SingleChoice.css';

export interface SingleChoiceOption {
  id: string;
  label: string;
  disabled?: boolean;
  description?: string;
  descriptionRight?: string;
  radioProps?: Partial<RadioProps>;
}

export interface SingleChoiceProps {
  id?: string;
  label?: string;
  options?: SingleChoiceOption[];
  value?: string;
  defaultValue?: string;
  helperText?: string;
  helperIcon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
  /** When true, appends "(optional)" to the legend and suppresses aria-required. */
  optional?: boolean;
  disabled?: boolean;
  className?: string;
  onValueChange?: (value: string) => void;
  'aria-label'?: string;
}

const DEFAULT_OPTIONS: SingleChoiceOption[] = Array.from({ length: 6 }, (_, index) => ({
  id: `option-${index + 1}`,
  label: 'Label',
}));

/**
 * role="radiogroup" fieldset of full-width Radio options with a single selected value.
 *
 * @aiSelectWhen A form field where the user picks exactly one option from a visible list
 *
 * @aiAvoid Do not use when more than one option can be selected — use MultiChoice instead
 * @aiAvoid Do not use for many options in constrained space — use Select instead
 * @aiAvoid Do not use for an instant, no-confirmation mode switch — use SegmentControl instead
 * @aiAvoid Do not use for menu-style selection with mixed item kinds — use ChoiceList instead
 *
 * @aiSpatial Owns its own padding; each Radio option renders full-width
 *
 * @aiCompose Composes Radio internally per option — never pass checked via option.radioProps, control selection via value/onValueChange instead
 */
export function SingleChoice({
  id,
  label = 'Label',
  options = DEFAULT_OPTIONS,
  value,
  defaultValue,
  helperText = 'Help text',
  helperIcon,
  error = false,
  errorMessage,
  optional = false,
  disabled = false,
  className,
  onValueChange,
  'aria-label': ariaLabel,
}: SingleChoiceProps) {
  const autoId = useId();
  const fieldId = id ?? `dsn-single-choice-${autoId}`;
  const legendId = `${fieldId}-legend`;
  const helperId = `${fieldId}-helper`;
  const helperContent = error && errorMessage ? errorMessage : helperText;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const selectedValue = isControlled ? value : internalValue;

  function handleSelect(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  return (
    <div
      className={['dsn-single-choice', className].filter(Boolean).join(' ')}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      <fieldset
        className="dsn-single-choice-fieldset"
        aria-label={ariaLabel}
        aria-describedby={helperContent ? helperId : undefined}
        aria-invalid={error || undefined}
        aria-required={!optional || undefined}
      >
        <legend id={legendId} className="dsn-single-choice-label">
          {label}
          {optional && (
            <span className="dsn-single-choice-optional"> (optional)</span>
          )}
        </legend>

        <div className="dsn-single-choice-stack" role="radiogroup" aria-labelledby={legendId}>
          {options.map((option) => (
            <Radio
              key={option.id}
              className="dsn-radio--full-width"
              label={option.label}
              checked={selectedValue === option.id}
              disabled={disabled || option.disabled}
              showTrailingIcon={false}
              showDescription={Boolean(option.description)}
              description={option.description}
              showDescriptionRight={Boolean(option.descriptionRight)}
              descriptionRight={option.descriptionRight}
              onCheckedChange={(nextChecked) => {
                if (nextChecked) {
                  handleSelect(option.id);
                }
              }}
              {...option.radioProps}
            />
          ))}
        </div>
      </fieldset>

      {helperContent && (
        <div className="dsn-single-choice-meta">
          {helperIcon && (
            <span className="dsn-single-choice-meta-icon-wrap" aria-hidden="true">
              <span className="dsn-single-choice-meta-icon">{helperIcon}</span>
            </span>
          )}
          <p id={helperId} className="dsn-single-choice-helper">
            {helperContent}
          </p>
        </div>
      )}
    </div>
  );
}

export default SingleChoice;
