import React, { useId, useState } from 'react';
import { Checkbox, type CheckboxProps } from '../../atoms/Checkbox';
import './CheckboxField.css';

/**
 * CheckboxField is the form-field wrapper layer for a single checkbox input.
 * It provides shared input anatomy (field label + helper/error text) and
 * composes the Checkbox atom for the interactive control row.
 */
export interface CheckboxFieldProps {
  id?: string;
  label?: string;
  checkboxLabel?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  helperText?: string;
  helperIcon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
  /** When true, appends "(optional)" to the legend and suppresses aria-required. */
  optional?: boolean;
  className?: string;
  checkboxProps?: Partial<CheckboxProps>;
  onCheckedChange?: (checked: boolean) => void;
  'aria-label'?: string;
}

/**
 * Form-field wrapper around a single Checkbox, with field label and helper/error text.
 *
 * @aiSelectWhen A single standalone checkbox needs its own field label distinct from the checkbox's inline label
 *
 * @aiAvoid Do not use for a group of related checkboxes — use MultiChoice instead
 * @aiAvoid Do not use when no field-level label/helper text is needed — mount the Checkbox atom directly instead
 *
 * @aiSpatial Owns its own padding; checkbox row fills container width
 *
 * @aiCompose Composes Checkbox internally — pass overrides via checkboxProps, never mount a separate Checkbox alongside it
 */
export function CheckboxField({
  id,
  label = 'Label',
  checkboxLabel = 'Label',
  checked,
  defaultChecked = false,
  disabled = false,
  helperText = 'Help text',
  helperIcon,
  error = false,
  errorMessage,
  optional = false,
  className,
  checkboxProps,
  onCheckedChange,
  'aria-label': ariaLabel,
}: CheckboxFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `dsn-checkbox-field-${autoId}`;
  const helperId = `${fieldId}-helper`;
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const resolvedChecked = isControlled ? checked : internalChecked;
  const helperContent = error && errorMessage ? errorMessage : helperText;

  function handleCheckedChange(nextChecked: boolean) {
    if (!isControlled) {
      setInternalChecked(nextChecked);
    }
    onCheckedChange?.(nextChecked);
  }

  return (
    <div
      className={['dsn-checkbox-field', className].filter(Boolean).join(' ')}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      <fieldset
        className="dsn-checkbox-fieldset"
        aria-label={ariaLabel}
        aria-describedby={helperContent ? helperId : undefined}
        aria-invalid={error || undefined}
        aria-required={!optional || undefined}
      >
        <legend className="dsn-checkbox-field-label">
          {label}
          {optional && (
            <span className="dsn-checkbox-field-optional"> (optional)</span>
          )}
        </legend>

        <div className="dsn-checkbox-field-control">
          <Checkbox
            fullWidth
            label={checkboxLabel}
            checked={resolvedChecked}
            disabled={disabled}
            showTrailingIcon={false}
            onCheckedChange={handleCheckedChange}
            {...checkboxProps}
          />
        </div>
      </fieldset>

      {helperContent && (
        <div className="dsn-checkbox-field-meta">
          {helperIcon && (
            <span className="dsn-checkbox-field-meta-icon-wrap" aria-hidden="true">
              <span className="dsn-checkbox-field-meta-icon">{helperIcon}</span>
            </span>
          )}
          <p id={helperId} className="dsn-checkbox-field-helper">
            {helperContent}
          </p>
        </div>
      )}
    </div>
  );
}

export default CheckboxField;
