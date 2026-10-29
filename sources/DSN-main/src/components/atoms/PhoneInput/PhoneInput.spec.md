# PhoneInput

**Tier:** atom
**Location:** `src/components/atoms/PhoneInput/PhoneInput.spec.md`
**Version:** 1.0.0

## What it is

A labeled text input for phone numbers with a country-code selector prefix (dropdown menu of `PhoneCountryOption`s) and a local-number field, supporting full international-number paste.

## When to use

- Use whenever collecting a phone number that may be international — the country selector ensures the number is captured with the correct dial code.
- Provide `countryOptions` explicitly when the product needs a country list narrower or different from the built-in default (`US`, `PT`, `UK`, `DE`).
- Rely on `onPaste`'s built-in international-number parsing — pasting a full `+`-prefixed number auto-populates both the country code and the local number field.

## When NOT to use

- Do not use when the product only ever operates in a single country/locale with no need for a country selector → use a plain text input with a fixed format hint instead.
- Do not use for non-phone numeric identifiers → use `NumberInput` or a plain text input instead.

## Variant selection

This component has no `variant` prop. Its only configurable list is `countryOptions`.

## Spatial contract

- **Owns its padding:** yes — label, control (country selector + field), and helper rows are laid out internally.
- **Owns its margin:** no — spacing relative to surrounding form fields must come from the parent layout.
- **Fills its container:** yes — the control row stretches to the parent's width; the country selector sits at a fixed width to the left of the number field.
- **Notes:** the country dropdown renders via `PopoverWrapper` and `MenuCell` internally — do not wrap `PhoneInput` in an additional popover/menu component.

## Composition rules

- ✅ Can be used inside: forms, registration flows, contact/profile settings.
- ✅ Internally composes `MenuCell` (per-country options) and `PopoverWrapper` (dropdown positioning) — these are implementation details, not separate components to mount alongside it.
- ❌ Never format the placeholder generically — match it to the selected country's local number format (e.g. `"912 345 678"` for PT, `"(555) 000-0000"` for US), per the source doc's content guidelines.

## Field rules

- Fields are mandatory by default. There is no visual required marker; a required asterisk cannot be rendered.
- Set `optional={true}` to append `(optional)` to the label in `var(--color-foreground-neutral-tertiary)`. The component renders this suffix — consumers cannot restyle or reword it.
- Mandatory fields set `aria-required` by default; `optional={true}` suppresses it.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `optional` | `boolean` | Set `true` for non-mandatory fields. Renders `(optional)` on the label. |
| `countryOptions` | `PhoneCountryOption[]` | Set when the product needs a specific/narrower country list; falls back to a small built-in default (`US`, `PT`, `UK`, `DE`) if empty. |
| `defaultCountryCode` | `string` | Pre-select the user's detected locale where possible to reduce friction for the majority case; defaults to `"+1"`. |
| `onCountryCodeChange` | `(countryCode: string) => void` | Set when the country selection must be tracked alongside the number (e.g. to store the dial code separately in form state). |
| `countryCodeAriaLabel` | `string` | Override the default `"Country code"` label if the surrounding form has more specific terminology. |

## Common mistakes

1. **Hardcoding a placeholder format that doesn't match the selected country** — the source doc requires the placeholder to reflect the selected country's local format, not a single generic pattern.
2. **Not pre-selecting a sensible default country** — the source doc recommends detecting and pre-selecting the user's locale to reduce friction; don't leave `defaultCountryCode` unset in user-facing forms without considering the target locale.
3. **Validating on every keystroke** — the source doc specifies phone number format validation should happen on blur, not on every keystroke.

## Examples

```tsx
// Most common usage — default country list
<PhoneInput label="Phone number" defaultCountryCode="+351" />

// Non-obvious case — restricted country list with tracked code
<PhoneInput
  label="Phone number"
  countryOptions={[{ label: 'Portugal (+351)', value: '+351' }, { label: 'Spain (+34)', value: '+34' }]}
  onCountryCodeChange={setDialCode}
/>
```
