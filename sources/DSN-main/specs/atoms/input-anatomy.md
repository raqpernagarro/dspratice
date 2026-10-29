# Input anatomy

All input components in DS-Ngr share a common structural anatomy and a consistent set of conventions. This document defines the shared rules. Individual input docs define the specific behavior and variants of each component type — they inherit everything here unless explicitly noted otherwise.

---

## Shared anatomy

Every input is composed of the same set of structural elements. Not all elements are required in every context — the minimum is a control and a label.

```
[Label]              ← always required
[Control]            ← the interactive input area
[Helper text]        ← optional, below the control
[Error message]      ← replaces helper text when state is Error
```

### Label
- A semantic label is always required — every input must have one for accessibility. A visible label above the control is not always required.
- **Visible label above the control** — the default and preferred pattern. Use in all standard form contexts.
- **Visible label to the left of the control** — use in `Horizontal input` layouts.
- **No visible label** — acceptable when context makes the input's purpose unambiguous: a search bar inside a clearly scoped search page, an inline edit field within a data row, a lone filter input inside a labeled panel. In these cases, provide the label semantically via `aria-label` or `aria-labelledby` so it is accessible without being visible.
- Describes what the field contains — not what the user should do: "Email address" not "Enter your email address".
- Use sentence case: "Phone number" not "Phone Number".
- Fields are mandatory by default. Set `optional={true}` on non-mandatory fields — the component appends `(optional)` to the label. No required marker exists. See AI.md LCB-08.
- Do not use placeholder text as a label substitute — placeholders disappear on input and are not accessible.

### Control
- The interactive element the user types into, selects from, or manipulates.
- Must have a visible boundary (border, background, or both) in its default state — do not use invisible hit areas.
- Must clearly communicate its current state through visual treatment — see States below.

### Helper text
- Optional. Placed below the control.
- Provides brief formatting guidance, constraints, or context that helps the user complete the field correctly: "Must be at least 8 characters", "We'll only use this to send receipts".
- Do not repeat the label in helper text.
- Keep to one line where possible. Two lines maximum.
- Helper text disappears and is replaced by the error message when the field is in Error state.

### Error message
- Replaces helper text when the field has a validation error.
- Must be specific — tell the user what is wrong and how to fix it: "Email address is invalid" not "Invalid input". "Password must be at least 8 characters" not "Too short".
- Shown below the control, in the same position as helper text.
- Accompanied by a visual error treatment on the control itself — never show an error message without also styling the control as errored.
- Error messages must remain visible until the user has corrected the issue and the field re-validates — do not hide errors on blur alone.

---

## Shared states

All text-based inputs share this core set of states. Individual components may have additional or modified states — these are documented in each component's own doc.

| State | Description |
|---|---|
| `Empty` | Default resting state. No value entered. Placeholder text may be visible. |
| `Hover` | Pointer is over the control. Visual feedback that the field is interactive. |
| `Active` | The user is actively typing. The cursor is present in the field. |
| `Filled` | The field has a value and does not have focus. The user has moved on. |
| `Focused` | The field has keyboard focus but the user is not actively typing. Distinct from Active in some inputs. |
| `Error` | The field has a validation error. Error message is shown below. |
| `Disabled` | The field is non-interactive. Value is preserved but cannot be changed. |

**On Empty vs Filled:** AI agents must treat these as distinct states — they may look similar visually but `Empty` never has a value, `Filled` always does. Generating code that conflates them produces incorrect initial state logic.

**On Active vs Focused:** Some inputs distinguish between Active (cursor present, user typing) and Focused (keyboard focus, cursor not necessarily present). Where both exist in Figma, they must be mapped to separate interaction states in code.

**On Disabled:** Always use `disabled` attribute or `aria-disabled="true"`. Do not simulate disabled state via read-only styling — the semantics matter for form submission and assistive technologies.

---

## Validation

- Validate on blur (when the user leaves the field) for most inputs — not on every keystroke. Real-time validation on every keystroke creates anxiety and is disruptive.
- Exception: real-time validation is appropriate for password strength indicators, character count limits, and search/filter inputs where instant feedback is the core interaction.
- For OTP inputs, validate each digit as it is entered — partial validation is the expected interaction model.
- Never submit a form with unfixed errors. If submit is triggered with errors present, scroll to the first errored field and shift focus to it.
- Show all errors at once on submit — do not reveal errors one by one as the user fixes them (unless inline validation was already active).

---

## Placeholder text

- Placeholder text is supplementary — it provides an example of expected input format, not a label.
- Use sparingly. If the label is clear, placeholder is often unnecessary.
- Never use placeholder text as the only label — it disappears on input, fails WCAG contrast requirements in most browsers at default styling, and is not reliably announced by screen readers.
- Placeholders must be clearly distinguishable from user-entered values — lower contrast, different style.
- Examples of good placeholder text: "e.g. john@example.com", "+351 912 345 678", "DD/MM/YYYY"

---

## Sizing

Inputs have the standard control height. 

---

## Accessibility — shared rules

These apply to all inputs:

- Every input must have a programmatic label — either a `<label>` element with `for`/`id` association, or `aria-label` / `aria-labelledby`.
- Helper text and error messages must be associated with the input via `aria-describedby` so screen readers announce them when the field receives focus.
- Error state must use `aria-invalid="true"` on the control. Do not rely on visual treatment alone.
- `Disabled` inputs should use the native `disabled` attribute or `aria-disabled="true"`. Disabled inputs should not be in the tab order.
- Mandatory fields set `aria-required="true"` by default; `optional={true}` suppresses it. No required marker exists. See AI.md LCB-08.
- Do not use `autocomplete="off"` without a strong reason — autofill helps users and disabling it without justification is a friction point.
- Focus indicators must meet WCAG AA contrast requirements.
- Error messages must not disappear automatically — they must remain until the error is resolved.
