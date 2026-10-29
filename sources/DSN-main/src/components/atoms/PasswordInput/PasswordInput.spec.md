# PasswordInput

**Tier:** atom
**Location:** `src/components/atoms/PasswordInput/PasswordInput.spec.md`
**Version:** 1.0.0

## What it is

A labeled text input that masks its value by default, with a leading lock icon and a show/hide visibility toggle, used exclusively for passwords and other sensitive credentials.

## When to use

- Use only for passwords and sensitive values that must be masked by default.
- Use `autoComplete="current-password"` for login fields and `autoComplete="new-password"` for registration/change-password fields (the component defaults to `"current-password"`).
- Pair with `PasswordRequirement` rows below the field for new-password/change-password contexts to show live requirement status.

## When NOT to use

- Do not use for PINs or one-time verification codes → use `OTPInput` instead.
- Do not use for any non-sensitive text value → use a standard text input instead.

## Variant selection

This component has no `variant` prop — visual treatment is uniform; only content and state change.

## Spatial contract

- **Owns its padding:** yes — label, control, and helper rows are laid out internally; the lock icon, input field, optional trailing icon, and show/hide toggle all sit inside the control row.
- **Owns its margin:** no — spacing relative to surrounding form fields must come from the parent layout.
- **Fills its container:** yes — the control stretches to the width of its parent; height is intrinsic to padding + line-height.
- **Notes:** the helper/error row only renders when `helperText` or (`error` + `errorMessage`) is present — do not add an empty helper row wrapper around it.

## Composition rules

- ✅ Can be used inside: forms, registration/login flows, settings panels.
- ✅ Pair with `PasswordRequirement` for new-password contexts to surface live requirement feedback.
- ❌ Never log or persist the field's value outside the form submission flow.
- ❌ Never disable the show/hide toggle — forcing users to type blind increases input errors.

## Field rules

- Fields are mandatory by default. There is no visual required marker; a required asterisk cannot be rendered.
- Set `optional={true}` to append `(optional)` to the label in `var(--color-foreground-neutral-tertiary)`. The component renders this suffix — consumers cannot restyle or reword it.
- Mandatory fields set `aria-required` by default; `optional={true}` suppresses it.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `optional` | `boolean` | Set `true` for non-mandatory fields. Renders `(optional)` on the label. |
| `autoComplete` | `string` | Set `"new-password"` for registration/change-password forms; leave as default `"current-password"` for login. Never set `"off"` — password managers depend on these values. |
| `error` / `errorMessage` | `boolean` / `string` | Set together when validation fails; `errorMessage` replaces `helperText` in the helper row and drives the error visual treatment. |
| `helperText` | `string` | Use to list password requirements upfront on new-password fields — don't make users guess the rules after a rejected attempt. |
| `trailingIcon` | `React.ReactNode` | Optional 16×16 icon rendered between the field and the show/hide toggle — rarely needed; do not use it to duplicate the lock icon. |
| `leadingIcon` / `showLeadingIcon` | `React.ReactNode` / `boolean` | Figma: `Leading icon` / `Show leading icon`. Defaults to the lock icon; replace only when a different glyph carries clearer meaning (e.g. a key for API secrets). |
| `labelAction` | `React.ReactNode` | Use for a "Forgot password?" link next to the label on login forms. |

## Common mistakes

1. **Setting `autoComplete="off"`** — `input-password-otp-number-phone.md` explicitly calls this out: password managers depend on `current-password`/`new-password` autocomplete values; never disable autocomplete.
2. **Using `PasswordInput` for OTP/PIN entry** — the source doc's "when to use" section for OTP explicitly separates the two; use `OTPInput` for short verification codes instead.
3. **Showing a generic error like "Invalid password"** — `input-password-otp-number-phone.md` requires specific errors, e.g. "Password must include at least one uppercase letter".
4. **Omitting `errorMessage` while relying only on `error`** — the component only renders the helper row when there is helper or error content; a silent `error={true}` with no message leaves users with no explanation.

## Examples

```tsx
// Most common usage — login field
<PasswordInput
  label="Password"
  autoComplete="current-password"
  labelAction={<a href="/forgot-password">Forgot password?</a>}
/>

// Non-obvious case — new password with live requirement feedback
<>
  <PasswordInput
    label="New password"
    autoComplete="new-password"
    helperText="Must be at least 8 characters and include a number."
  />
  <PasswordRequirement label="8+ characters" met={hasLength} />
  <PasswordRequirement label="Contains a number" met={hasNumber} />
</>
```
