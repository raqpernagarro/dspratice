# CheckboxField

**Tier:** molecule
**Location:** `src/components/molecules/CheckboxField/CheckboxField.spec.md`
**Version:** 1.0.0

## What it is

A form-field wrapper (`<fieldset>`/`<legend>`) around a single `Checkbox`, adding a field-level label and helper/error text row around the atom.

## When to use

- Use for a single standalone checkbox that needs its own field label distinct from the checkbox's own inline label — e.g. "Notifications" (field label) with "Enable email alerts" (checkbox label).
- Use when the checkbox needs helper text or an error message attached at the field level.

## When NOT to use

- Do not use for a group of several related checkboxes → use `MultiChoice` instead, which manages a list of options with a single fieldset.
- Do not use when the checkbox doesn't need a separate field label/helper text — mount the `Checkbox` atom directly instead.

## Variant selection

This component has no `variant` prop — behavior is uniform; only content and state (`checked`, `error`, `disabled`) change.

## Spatial contract

- **Owns its padding:** yes — fieldset, legend, checkbox row, and helper row are laid out internally.
- **Owns its margin:** no — spacing relative to surrounding form fields must come from the parent layout.
- **Fills its container:** yes — the checkbox row uses `fullWidth` on the internal `Checkbox`.
- **Notes:** the helper/error row only renders when `helperText` or (`error` + `errorMessage`) is present.

## Composition rules

- ✅ Can be used inside: forms, settings panels.
- ✅ Composes `Checkbox` internally (`fullWidth`, `showTrailingIcon={false}`) — pass atom-level overrides via `checkboxProps`, not by mounting a separate `Checkbox`.
- ❌ Never mount `MultiChoice` and `CheckboxField` for the same conceptual group — pick one: `CheckboxField` for a single checkbox, `MultiChoice` for a list of them.

## Field rules

- Fields are mandatory by default. There is no visual required marker; a required asterisk cannot be rendered.
- Set `optional={true}` to append `(optional)` to the legend in `var(--color-foreground-neutral-tertiary)`. The component renders this suffix — consumers cannot restyle or reword it.
- Mandatory fields set `aria-required` by default; `optional={true}` suppresses it.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `optional` | `boolean` | Set `true` for non-mandatory fields. Renders `(optional)` on the legend. |
| `label` | `string` | The field-level legend — distinct from `checkboxLabel`. |
| `checkboxLabel` | `string` | The inline label next to the checkbox control itself. |
| `checkboxProps` | `Partial<CheckboxProps>` | Use to override/extend the internal `Checkbox`'s props (e.g. a description) rather than mounting a separate `Checkbox`. |
| `error` / `errorMessage` | `boolean` / `string` | Set together when validation fails; `errorMessage` replaces `helperText` in the helper row. |

## Common mistakes

1. **Using `CheckboxField` for multiple related checkboxes** — use `MultiChoice` instead, which is built for a list of options under one fieldset.
2. **Mounting a separate `Checkbox` alongside `CheckboxField` instead of using `checkboxProps`** — duplicates the control; pass overrides through `checkboxProps`.
3. **Setting `error={true}` without `errorMessage`** — the helper row only shows content when there's helper or error text; a silent error state leaves the user without an explanation.

## Examples

```tsx
// Most common usage
<CheckboxField
  label="Notifications"
  checkboxLabel="Enable email alerts"
  helperText="You can change this later in settings."
/>

// Non-obvious case — error state
<CheckboxField
  label="Terms"
  checkboxLabel="I agree to the terms of service"
  error
  errorMessage="You must accept the terms to continue."
/>
```
