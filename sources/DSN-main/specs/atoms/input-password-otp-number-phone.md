# Input / Password

A text input that obscures its value by default. Used exclusively for passwords and other sensitive credentials.

---

## When to use

Use Password input only for passwords and sensitive values that must be masked. Do not use it for PINs or OTPs — use OTP input for those.

---

## States

| State | Description |
|---|---|
| `Empty` | No value, masked display. |
| `Hover` | Pointer over the field. |
| `Active` | User is typing. Characters are obscured as entered. |
| `Filled` | Value entered, focus moved away. Masked. |
| `Revealed` | User has toggled visibility — value is shown as plain text. |
| `Focused` | Field has focus, no active typing. |
| `Error` | Validation error — incorrect password, requirements not met. |
| `Disabled` | Non-interactive. |

`Revealed` is the only state unique to Password input. It applies when the user activates the show/hide toggle. The toggle must switch back to masked when the field loses focus, or persist based on explicit product decision — define this consistently.

---

## Rules

- Always include a show/hide visibility toggle. Forcing users to type blind increases errors and friction.
- Never store or log password field values.
- For new password fields (registration, password change), show a strength indicator and requirements list — not just an error after the fact.
- For confirm password fields, validate that it matches the primary field on blur of the confirm field — not on every keystroke.
- Always neutralize browser autofill styling in native password inputs (especially in Chrome and Safari) using `-webkit-autofill` overrides so autofill does not paint an incorrect background color.
- Autocomplete: use `autocomplete="current-password"` for login fields, `autocomplete="new-password"` for registration. Do not use `autocomplete="off"` — password managers depend on these attributes.

## Accessibility

- The show/hide toggle must have `aria-label` that reflects current state: "Show password" / "Hide password".
- Use `aria-describedby` to associate the requirements list with the input when present.
- When `Revealed`, the input type switches from `password` to `text` — ensure this change is announced: `aria-live` region or `aria-label` update.

## Content guidelines

- Label: "Password", "New password", "Confirm new password".
- Helper text: list the password requirements upfront — don't make users guess. "Must be at least 8 characters and include a number."
- Error: specific. "Password must include at least one uppercase letter" not "Invalid password".

---

# Input / OTP

A segmented input for one-time passwords, verification codes, and PIN entry. Each character occupies a separate field, providing clear visual progress and reducing input errors.

---

## When to use

Use OTP input for short numeric or alphanumeric codes sent to the user via SMS, email, or authenticator app. Typically 4–8 characters.

Do not use for passwords — use Password input. Do not use for long codes — use a text input.

---

## States

| State | Description |
|---|---|
| `Empty` | All fields empty, awaiting input. |
| `Partially filled` | Some fields have values, input is in progress. |
| `Verifying` | Code submitted, verification in progress. All fields non-interactive. |
| `Correct` | Verification succeeded. Visual success treatment. |
| `Error` | Verification failed or code expired. Error message shown. |
| `Disabled` | Non-interactive. |

---

## Interaction

- Auto-advance: when a character is entered in one field, focus automatically moves to the next. This is a core OTP interaction pattern — do not disable it.
- Auto-submit: when the last field is filled, trigger verification automatically if the code length is fixed and known. Do not require a separate submit action for standard OTP flows.
- Paste handling: pasting a full code must populate all fields at once — handle clipboard input that fills multiple fields in a single paste event.
- Backspace: moves focus to the previous field and clears it.

## Accessibility

- The full OTP input group must have a `role="group"` with `aria-label` describing the context: "Enter 6-digit verification code".
- Each individual field should have `aria-label` indicating its position: "Digit 1 of 6".
- The `Verifying` state must announce progress to screen readers via `aria-live`.
- The `Correct` and `Error` states must be announced — do not rely on visual treatment alone.

## Content guidelines

- Label: "Verification code", "One-time password", "Enter the code we sent to [masked contact]".
- Clarify the source and expiry: "We sent a 6-digit code to +351 9•• ••• 789. It expires in 10 minutes."
- Error: distinguish between wrong code and expired code. "Incorrect code — please try again" vs "This code has expired — request a new one".
- Provide a resend action alongside the input for expiry scenarios.

---

# Input / Number input

A text input constrained to numeric values, with optional increment and decrement controls.

---

## When to use

Use Number input for quantities, counts, durations, or any numeric value the user enters or adjusts. The stepper controls (+ / −) are particularly useful for small integer ranges.

**Do not use when:**
- The value is a currency amount — currency formatting and decimal rules are complex; use a dedicated currency input or a plain text input with explicit formatting guidance instead.
- The value is a range between two points — use Slider instead.
- The value is a large numeric ID or code where increment/decrement makes no sense — use a plain text input.

---

## States

Empty · Hover · Active · Filled · Focused · Error · Disabled

---

## Rules

- Always define and enforce min/max values where applicable. Do not silently clamp — show an error when the user exceeds bounds.
- Stepper controls (+ / −) should disable when the value reaches the min or max boundary.
- Allow direct keyboard entry in addition to stepper controls — never make steppers the only input method.
- Format displayed values consistently — if the field shows "1,000" with a thousands separator, the user must be able to type "1000" without the separator and have it accepted.

## Content guidelines

- Label: "Quantity", "Number of seats", "Duration (days)".
- Helper text: state the valid range when it matters. "Between 1 and 100".
- Error: "Quantity cannot exceed 50" not "Invalid value".
- Units: if the value has a unit (days, km, kg), display it as a suffix or in the label — not as placeholder text that disappears.

---

# Input / Phone number

A text input for international phone numbers, with a country code selector prefix.

---

## When to use

Use Phone number input whenever collecting a phone number that may be international. The country code selector ensures the number is formatted and stored correctly.

---

## States

Empty · Hover · Active · Filled · Focused · Error · Disabled

---

## Structure

The input consists of two parts:
- **Country code selector** — a compact dropdown for selecting the country prefix (e.g. +351, +44, +1). Triggers a searchable list of countries.
- **Number field** — the local phone number, formatted according to the selected country's conventions.

---

## Rules

- Pre-select the user's locale as the default country code where detectable — reduce friction for the majority case.
- Format the number field's placeholder according to the selected country's format: "912 345 678" for PT, "(555) 000-0000" for US.
- Allow the user to paste a full international number (including the + prefix) and auto-populate both the country selector and number field.
- Validate the phone number format for the selected country on blur — not on every keystroke.

## Accessibility

- The country code selector must have `aria-label="Country code"` or equivalent.
- The number field must have `aria-label` that includes the selected country context, or be grouped with the selector via `role="group"` and `aria-label="Phone number"`.
- Use `autocomplete="tel"` on the number field and `autocomplete="tel-country-code"` on the selector.

## Content guidelines

- Label: "Phone number" — not "Mobile number" unless the product explicitly requires mobile only.
- Helper text: only if the format is non-obvious in context.
- Error: "Enter a valid phone number for the selected country".
