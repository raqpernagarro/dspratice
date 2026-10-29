import React, { useId } from 'react';
import { MultiChoice } from '../MultiChoice/MultiChoice';
import { SingleChoice } from '../SingleChoice/SingleChoice';
import './Fieldset.css';

export interface FieldsetProps {
  /** Required sentence-case group name rendered in the native legend. */
  legend: string;
  /** When true, appends "(optional)" to the legend in var(--color-foreground-neutral-tertiary). */
  optional?: boolean;
  /** Supplementary text below the legend and above the fields. */
  description?: string;
  /** Disables all controls in the group via native fieldset behavior. */
  disabled?: boolean;
  /** Optional root id for testing. Auto-generated when omitted. */
  id?: string;
  children?: React.ReactNode;
  className?: string;
}

function warnInvalidChildren(children: React.ReactNode): void {
  if (!import.meta.env.DEV) {
    return;
  }

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    if (child.type === SingleChoice || child.type === MultiChoice) {
      console.warn(
        'Fieldset: Do not nest SingleChoice or MultiChoice inside Fieldset — they render their own fieldset.',
      );
    }
  });
}

/**
 * Semantic form grouping wrapper with a native fieldset, legend, and vertical field stack.
 *
 * @aiSelectWhen Multiple related inputs share one conceptual group inside a Form
 *
 * @aiAvoid Do not use for page or card titles — use SectionHeader or Card title instead
 * @aiAvoid Do not nest SingleChoice or MultiChoice — they render their own fieldset
 * @aiAvoid Do not use for a single input with one label — mount the input directly
 *
 * @aiSpatial Owns legend-to-field and field-to-field rhythm; no external margin or padding
 *
 * @aiCompose Lives inside Form; contains DS input components directly, never nested Fieldsets
 */
export function Fieldset({
  legend,
  optional = false,
  description,
  disabled = false,
  id,
  children,
  className,
}: FieldsetProps) {
  const autoId = useId();
  const fieldsetId = id ?? `dsn-fieldset-${autoId}`;
  const descriptionId = description ? `${fieldsetId}-description` : undefined;

  warnInvalidChildren(children);

  return (
    <fieldset
      id={fieldsetId}
      className={['dsn-fieldset', className].filter(Boolean).join(' ')}
      disabled={disabled || undefined}
      aria-describedby={descriptionId}
    >
      <legend className="dsn-fieldset-legend">
        {legend}
        {optional ? <span className="dsn-fieldset-optional"> (optional)</span> : null}
      </legend>

      {description ? (
        <p id={descriptionId} className="dsn-fieldset-description">
          {description}
        </p>
      ) : null}

      <div className="dsn-fieldset-fields">{children}</div>
    </fieldset>
  );
}

export default Fieldset;
