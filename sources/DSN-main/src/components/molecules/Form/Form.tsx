import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Fieldset } from '../Fieldset/Fieldset';
import {
  areMandatoryFieldsComplete,
  focusFirstInvalidField,
  getFieldKeyFromElement,
  hasValidationErrors,
} from './formUtils';
import './Form.css';

export interface FormProps {
  /** Called when submit fires and onValidate returns no errors. */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  /** Return field-id → error message map on submit. Empty object = valid. */
  onValidate?: () => Record<string, string | undefined>;
  /** Controlled error messages keyed by input id or name. */
  fieldErrors?: Record<string, string | undefined>;
  /** When true, exposes mandatory-field completeness via onValidityChange. */
  disableSubmitUntilValid?: boolean;
  /** Notifies when all mandatory fields have values. */
  onValidityChange?: (isValid: boolean) => void;
  /** v1 only supports submit-time validation. */
  validateOn?: 'submit';
  /** Disables all fields and blocks submit. */
  disabled?: boolean;
  /** Form element id; pairs with submit button form attribute when needed. */
  id?: string;
  children?: React.ReactNode;
  className?: string;
  /** Suppress native browser validation UI; DSN validation only. */
  noValidate?: boolean;
}

function injectFormFieldProps(
  children: React.ReactNode,
  options: {
    errors: Record<string, string | undefined>;
    disabled?: boolean;
  },
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    const fieldKey = getFieldKeyFromElement(child);
    const errorMessage = fieldKey ? options.errors[fieldKey] : undefined;
    const isFieldsetGroup = child.type === Fieldset;
    const nextChildren =
      isFieldsetGroup || child.props.children
        ? injectFormFieldProps(child.props.children, options)
        : undefined;

    const extraProps: Record<string, unknown> = {};

    if (options.disabled) {
      extraProps.disabled = true;
    }

    if (errorMessage) {
      extraProps.error = true;
      extraProps.errorMessage = errorMessage;
    }

    if (
      Object.keys(extraProps).length > 0 ||
      nextChildren !== child.props.children
    ) {
      return React.cloneElement(child, extraProps, nextChildren);
    }

    return child;
  });
}

/**
 * Semantic form wrapper that owns field-to-field vertical rhythm and submit orchestration.
 *
 * @aiSelectWhen Any submittable group of fields needs consistent spacing, validation, and CTA wiring
 *
 * @aiAvoid Do not use for read-only detail views or filter toolbars
 * @aiAvoid Do not add margin or gap on inputs inside Form — Form owns field rhythm
 * @aiAvoid Do not nest Form inside Form
 *
 * @aiSpatial Owns vertical rhythm between direct children via --space-md
 *
 * @aiCompose Contains DS inputs and Fieldset directly; primary actions live outside in Card bottom bar
 */
export function Form({
  onSubmit,
  onValidate,
  fieldErrors,
  disableSubmitUntilValid = true,
  onValidityChange,
  validateOn = 'submit',
  disabled = false,
  id,
  children,
  className,
  noValidate = true,
}: FormProps) {
  const autoId = useId();
  const formId = id ?? `dsn-form-${autoId}`;
  const formRef = useRef<HTMLFormElement>(null);
  const [internalErrors, setInternalErrors] = useState<Record<string, string | undefined>>({});
  const [shouldFocusInvalid, setShouldFocusInvalid] = useState(false);
  const resolvedErrors = { ...internalErrors, ...(fieldErrors ?? {}) };

  useEffect(() => {
    if (!disableSubmitUntilValid || !onValidityChange || !formRef.current) {
      return;
    }

    const form = formRef.current;

    function reportValidity() {
      onValidityChange?.(areMandatoryFieldsComplete(form));
    }

    reportValidity();

    form.addEventListener('input', reportValidity);
    form.addEventListener('change', reportValidity);

    const observer = new MutationObserver(reportValidity);
    observer.observe(form, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-placeholder', 'value', 'checked', 'aria-required'],
      childList: true,
    });

    return () => {
      form.removeEventListener('input', reportValidity);
      form.removeEventListener('change', reportValidity);
      observer.disconnect();
    };
  }, [children, disableSubmitUntilValid, onValidityChange]);

  useLayoutEffect(() => {
    if (!shouldFocusInvalid || !formRef.current) {
      return;
    }

    focusFirstInvalidField(formRef.current);
    setShouldFocusInvalid(false);
  }, [shouldFocusInvalid, resolvedErrors]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const validationResult = onValidate?.() ?? {};
    const submitFailed = hasValidationErrors(validationResult);

    setInternalErrors(validationResult);

    if (submitFailed) {
      setShouldFocusInvalid(true);
      return;
    }

    setInternalErrors({});
    onSubmit?.(event);
  }

  const renderedChildren = injectFormFieldProps(children, {
    errors: resolvedErrors,
    disabled,
  });

  return (
    <form
      ref={formRef}
      id={formId}
      className={['dsn-form', className].filter(Boolean).join(' ')}
      noValidate={noValidate}
      data-validate-on={validateOn}
      onSubmit={handleSubmit}
    >
      {renderedChildren}
    </form>
  );
}

export default Form;
