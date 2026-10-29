# OTPInput

**Tier:** atom
**Location:** `src/components/atoms/OTPInput/OTPInput.spec.md`
**Version:** 1.0.0

## What it is

A segmented input of individually-boxed digit cells for entering one-time passwords, verification codes, or PINs, with auto-advance, backspace, arrow-key navigation, and full-code paste support.

## When to use

- Use for short numeric codes (typically 4–8 characters) sent via SMS, email, or an authenticator app.
- Use `status="verifying"` while the submitted code is being checked (cells become non-interactive) and `status="correct"`/`status="error"` to reflect the result.
- Rely on the built-in auto-advance and auto-paste behavior — do not build a custom multi-field alternative for this use case.

## When NOT to use

- Do not use for passwords → use `PasswordInput` instead.
- Do not use for long codes or free-form alphanumeric values → use a standard text input instead.

## Variant selection

### `status` prop

| Value | Use when |
|-------|----------|
| `"idle"` (default) | Normal typing state — empty or partially filled. |
| `"verifying"` | The full code has been submitted and verification is in progress; all cells become non-interactive. |
| `"correct"` | Verification succeeded. |
| `"error"` | Verification failed or the code expired; pair with `errorMessage`. |

### `length` prop

| Value | Use when |
|-------|----------|
| `6` (default) | Standard verification code length. |
| Other values | Match exactly the length of the code your backend issues — the component renders one cell per unit of `length`. |

## Spatial contract

- **Owns its padding:** yes — label row, cell group, and helper row are all laid out internally.
- **Owns its margin:** no — spacing relative to surrounding form content must come from the parent layout.
- **Fills its container:** no — the cell group is sized to `length` fixed-size cells plus gaps; it does not stretch.
- **Notes:** a visually-hidden `aria-live` status region always renders alongside the cells to announce `verifying`/`correct`/`error` transitions to screen readers, even though it has no visible layout impact.

## Composition rules

- ✅ Can be used inside: login/signup verification steps, 2FA challenge screens.
- ❌ Never disable the auto-advance or auto-paste behavior — both are core to the expected OTP interaction pattern.
- ❌ Never require a separate submit button for a fixed-length code — trigger verification automatically via `onComplete` once all cells are filled.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `length` | `number` | Set to match the exact length of the code issued by the backend; defaults to `6`. |
| `status` | `'idle' \| 'verifying' \| 'correct' \| 'error'` | Drive from the verification request lifecycle; see variant table above. |
| `onComplete` | `(value: string) => void` | Use this — not a manual "check length" effect — to trigger verification once every cell is filled. |
| `labelAction` | `React.ReactNode` | Use for a "Resend code" / "Try again" action, typically shown when `status="error"`. |

## Common mistakes

1. **Requiring a separate submit button** — `input-password-otp-number-phone.md` states auto-submit should trigger verification automatically for standard OTP flows once the last cell is filled; use `onComplete` instead of adding a submit control.
2. **Not handling multi-character paste** — the component already fills all cells from a single paste event; do not intercept `onPaste` to implement single-character-only pasting.
3. **Showing a generic error** — distinguish wrong code vs. expired code in `errorMessage` ("Incorrect code — please try again" vs. "This code has expired — request a new one"), per the source doc's content guidelines.
4. **Using `PasswordInput` instead of `OTPInput` for a numeric code** — the source doc explicitly separates the two use cases.

## Examples

```tsx
// Most common usage
<OTPInput
  length={6}
  label="Enter the code we sent to +351 9•• ••• 789"
  helperText="It expires in 10 minutes."
  onComplete={verifyCode}
/>

// Non-obvious case — error state with resend action
<OTPInput
  length={6}
  label="Verification code"
  status="error"
  errorMessage="This code has expired — request a new one."
  labelAction={<a href="#" onClick={resend}>Resend</a>}
/>
```
