# PasswordRequirement

**Tier:** atom
**Location:** `src/components/atoms/PasswordInput/PasswordRequirement.spec.md`
**Version:** 1.0.0

## What it is

A single-row status indicator (`role="status"`) showing one password rule and whether it is currently satisfied, rendered as a radio-style dot (unmet) or a filled checkmark (met).

## When to use

- Use in a list below `PasswordInput` on registration or change-password forms to give live, per-rule feedback as the user types.
- Use one `PasswordRequirement` per distinct rule (length, number, uppercase, symbol, etc.) rather than combining multiple rules into a single label.

## When NOT to use

- Do not use as a general-purpose checklist item outside a password-strength context → use a plain list with `Checkbox` or an icon instead.
- Do not use to display the error message for a failed submission → use `PasswordInput`'s `errorMessage` prop instead; `PasswordRequirement` reflects live per-rule status, not submission errors.

## Variant selection

This component has no `variant` prop. Its only state-driving prop is `met`.

## Spatial contract

- **Owns its padding:** no — it is a single row (icon + label) with no internal padding of its own.
- **Owns its margin:** no — spacing between stacked `PasswordRequirement` rows must come from the parent layout (e.g. flex `gap`).
- **Fills its container:** no — sized intrinsically to its icon + label content.
- **Notes:** the whole row re-renders its accessible name via `aria-label="{label}: satisfied|not satisfied"` — do not add a separate visually-hidden status text alongside it.

## Composition rules

- ✅ Can be used inside: a requirements list directly below `PasswordInput`.
- ❌ Never use standalone without an adjacent `PasswordInput` — it only makes sense as live feedback for a password field being typed.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | The requirement text, e.g. `"8+ characters"` — keep it short and specific to one rule. |
| `met` | `boolean` | Recompute on every keystroke of the associated `PasswordInput`; drives both the icon and the accessible status text. |

## Common mistakes

1. **Combining multiple rules into one `PasswordRequirement` label** (e.g. `"8+ characters and a number"`) — each rule should be its own row so the user can see exactly which ones remain unmet, consistent with `input-password-otp-number-phone.md`'s guidance to show requirements upfront rather than after the fact.
2. **Using `PasswordRequirement` to show a post-submission validation error** — it is a live per-keystroke indicator, not an error message; use `PasswordInput`'s `errorMessage` for submission failures.

## Examples

```tsx
// Most common usage — live requirement list under a new-password field
<PasswordRequirement label="8+ characters" met={value.length >= 8} />
<PasswordRequirement label="Contains a number" met={/\d/.test(value)} />
<PasswordRequirement label="Contains an uppercase letter" met={/[A-Z]/.test(value)} />
```
