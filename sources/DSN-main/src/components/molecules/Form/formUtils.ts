/**
 * DOM helpers for Form orchestration — validity scanning and failed-submit focus.
 * See Form.spec.md implementation notes for rationale.
 */

function isFocusable(element: HTMLElement): boolean {
  if (element.matches(':disabled, [aria-disabled="true"]')) {
    return false;
  }

  return element.matches(
    'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
}

function resolveFocusTarget(invalid: Element): HTMLElement | null {
  if (invalid instanceof HTMLElement && isFocusable(invalid)) {
    return invalid;
  }

  if (invalid instanceof HTMLFieldSetElement) {
    const checked = invalid.querySelector<HTMLElement>('input:checked:not([disabled])');
    if (checked && isFocusable(checked)) {
      return checked;
    }

    const firstControl = invalid.querySelector<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])',
    );
    if (firstControl && isFocusable(firstControl)) {
      return firstControl;
    }
  }

  const descendant = invalid.querySelector<HTMLElement>(
    'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );

  return descendant && isFocusable(descendant) ? descendant : null;
}

export function focusFirstInvalidField(form: HTMLFormElement): void {
  const invalidFields = form.querySelectorAll('[aria-invalid="true"]');
  if (invalidFields.length === 0) {
    return;
  }

  const focusTarget = resolveFocusTarget(invalidFields[0]);
  if (!focusTarget) {
    return;
  }

  focusTarget.focus({ preventScroll: false });
  focusTarget.scrollIntoView?.({ block: 'nearest' });
}

function isCustomTriggerComplete(element: HTMLButtonElement): boolean {
  const valueEl = element.querySelector('.dsn-select-value, .dsn-combobox-value');
  if (valueEl) {
    return !valueEl.hasAttribute('data-placeholder');
  }

  return element.textContent?.trim().length !== 0;
}

function isMandatoryControlComplete(element: Element): boolean {
  if (element instanceof HTMLFieldSetElement && element.getAttribute('aria-required') === 'true') {
    return Boolean(element.querySelector('input:checked:not([disabled])'));
  }

  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox') {
      return element.checked;
    }

    if (element.type === 'radio') {
      if (element.name) {
        const form = element.form;
        return Boolean(
          form?.querySelector(
            `input[type="radio"][name="${CSS.escape(element.name)}"]:checked:not([disabled])`,
          ),
        );
      }

      return element.checked;
    }

    return element.value.trim().length > 0;
  }

  if (element instanceof HTMLTextAreaElement) {
    return element.value.trim().length > 0;
  }

  if (element instanceof HTMLSelectElement) {
    return element.value.trim().length > 0;
  }

  if (element instanceof HTMLButtonElement && element.getAttribute('aria-required') === 'true') {
    return isCustomTriggerComplete(element);
  }

  return true;
}

export function areMandatoryFieldsComplete(form: HTMLFormElement): boolean {
  const requiredControls = form.querySelectorAll('[aria-required="true"]');

  for (const control of requiredControls) {
    if (!isMandatoryControlComplete(control)) {
      return false;
    }
  }

  return true;
}

export function getFieldKeyFromElement(element: React.ReactElement): string | undefined {
  const props = element.props as { id?: string; name?: string };
  return props.id ?? props.name;
}

export function hasValidationErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((message) => Boolean(message));
}
