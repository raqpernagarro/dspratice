import React, { useId } from 'react';
import { Checkbox, type CheckboxProps } from '../../atoms/Checkbox';
import './MultiChoice.css';

export interface MultiChoiceOption {
  id: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  description?: string;
  descriptionRight?: string;
  checkboxProps?: Partial<CheckboxProps>;
}

export interface MultiChoiceProps {
  id?: string;
  label?: string;
  options?: MultiChoiceOption[];
  helperText?: string;
  helperIcon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
  /** When true, appends "(optional)" to the legend and suppresses aria-required. */
  optional?: boolean;
  disabled?: boolean;
  className?: string;
  onOptionChange?: (optionId: string, checked: boolean) => void;
  'aria-label'?: string;
}

const DEFAULT_OPTIONS: MultiChoiceOption[] = Array.from({ length: 6 }, (_, index) => ({
  id: `option-${index + 1}`,
  label: 'Label',
  checked: false,
}));

/**
 * Fieldset of full-width Checkbox options with independent per-option checked state.
 *
 * @aiSelectWhen A form field where the user can select any number of independent options
 *
 * @aiAvoid Do not use when only one option can be selected — use SingleChoice instead
 * @aiAvoid Do not use for a single standalone checkbox — use CheckboxField instead
 * @aiAvoid Do not use for a long or dynamically-searched list — use Autocomplete multi or Combobox with multiSelect instead
 *
 * @aiSpatial Owns its own padding; each Checkbox option renders full-width
 *
 * @aiCompose Composes Checkbox internally per option — fully controlled via options[].checked; wire onOptionChange back into that array or checkboxes will appear unresponsive
 */
export function MultiChoice({
  id,
  label = 'Label',
  options = DEFAULT_OPTIONS,
  helperText = 'Help text',
  helperIcon,
  error = false,
  errorMessage,
  optional = false,
  disabled = false,
  className,
  onOptionChange,
  'aria-label': ariaLabel,
}: MultiChoiceProps) {
  const autoId = useId();
  const fieldId = id ?? `dsn-multi-choice-${autoId}`;
  const helperId = `${fieldId}-helper`;
  const helperContent = error && errorMessage ? errorMessage : helperText;

  return (
    <div
      className={['dsn-multi-choice', className].filter(Boolean).join(' ')}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      <fieldset
        className="dsn-multi-choice-fieldset"
        aria-label={ariaLabel}
        aria-describedby={helperContent ? helperId : undefined}
        aria-invalid={error || undefined}
        aria-required={!optional || undefined}
      >
        <legend className="dsn-multi-choice-label">
          {label}
          {optional && (
            <span className="dsn-multi-choice-optional"> (optional)</span>
          )}
        </legend>

        <div className="dsn-multi-choice-stack">
          {options.map((option) => (
            <Checkbox
              key={option.id}
              fullWidth
              label={option.label}
              checked={option.checked}
              disabled={disabled || option.disabled}
              showTrailingIcon={false}
              showDescription={Boolean(option.description)}
              description={option.description}
              showDescriptionRight={Boolean(option.descriptionRight)}
              descriptionRight={option.descriptionRight}
              onCheckedChange={(nextChecked) => onOptionChange?.(option.id, nextChecked)}
              {...option.checkboxProps}
            />
          ))}
        </div>
      </fieldset>

      {helperContent && (
        <div className="dsn-multi-choice-meta">
          {helperIcon && (
            <span className="dsn-multi-choice-meta-icon-wrap" aria-hidden="true">
              <span className="dsn-multi-choice-meta-icon">{helperIcon}</span>
            </span>
          )}
          <p id={helperId} className="dsn-multi-choice-helper">
            {helperContent}
          </p>
        </div>
      )}
    </div>
  );
}

export default MultiChoice;
