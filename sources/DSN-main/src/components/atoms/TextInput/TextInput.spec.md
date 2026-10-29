# TextInput

**Tier:** atom
**Location:** `src/components/atoms/TextInput/TextInput.spec.md`
**Version:** 1.0.0

## What it is

A single-line text input with a label, optional leading/trailing icons, helper/error text row, and an optional character counter.

## When to use

- Use for any short, free-form text value: names, email addresses, URLs, addresses, subject lines
- Use when no more specific input type applies — it is the foundational input type

## When NOT to use

- Do not use when the value is multiple lines of prose → use `TextArea` instead
- Do not use when the value is a number with increment/decrement controls → use `NumberInput` instead
- Do not use when the value is a password → use `PasswordInput` instead
- Do not use when the value is a phone number with a country code → use `PhoneInput` instead
- Do not use when the user is searching or filtering → use `SearchBar` instead
- Do not use when the user selects from a predefined list → use `Select` instead

## Variant selection

`TextInput` has no visual `variant` prop — its only state-like switch is `error`, which is driven by validation rather than chosen by the agent ahead of time.

## Spatial contract

- **Owns its padding:** yes — label, control, and helper/error row are laid out internally as a vertical stack
- **Owns its margin:** no — place spacing using the surrounding form layout
- **Fills its container:** yes — the control spans the width of its parent
- **Notes:** The helper row only renders when there is content to show

## Composition rules

- ✅ Can be used inside: forms, filter panels, table cell edit contexts
- ❌ Never place inside: a context requiring international phone entry — use `PhoneInput` instead
- ❌ Never combine with: a placeholder used as a substitute for `label`

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Omit only when an accessible name is provided via `aria-label`/`aria-labelledby` |
| `error` / `errorMessage` | `boolean` / `string` | Set both together — `errorMessage` replaces `helperText` when `error` is true |
| `maxLength` | `number` | Enables the character counter; hides `trailingIcon` since the counter occupies that slot |
| `optional` | `boolean` | Set `true` for non-mandatory fields — appends `(optional)` to the label |
| `helperText` | `string` | Format guidance when the expected format is not self-evident |

## Common mistakes

1. **Using `TextInput` for international phone numbers** — use `PhoneInput` instead
2. **Using placeholder text as a label substitute** — always set `label` or an `aria-label`
3. **Showing an error message without the `error` visual state** — set the `error` prop with `errorMessage`
4. **Writing instructive placeholders instead of format examples** — use `"e.g. Acme Inc."` not `"Enter your company name"`

## Examples

~~~tsx
<TextInput label="Company name" placeholder="e.g. Acme Inc." />

<TextInput
  label="Subject line"
  maxLength={60}
  error={!isValid}
  errorMessage="Subject line is required"
/>
~~~
