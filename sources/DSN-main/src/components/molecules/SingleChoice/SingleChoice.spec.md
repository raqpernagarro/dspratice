# SingleChoice

**Tier:** molecule
**Location:** `src/components/molecules/SingleChoice/SingleChoice.spec.md`
**Version:** 1.0.0

## What it is

A `role="radiogroup"` fieldset rendering a list of full-width `Radio` options, where exactly one option can be selected via `value`/`onValueChange`.

## When to use

- Use for a form field where the user picks exactly one option from a visible list of choices, each with its own label (and optional left/right description).
- Use when all options should be visible at once (unlike `Select`, which hides options until opened) — typically fewer than ~7 options.

## When NOT to use

- Do not use when the user can select more than one option → use `MultiChoice` instead.
- Do not use when there are many options and space is constrained → use `Select` instead.
- Do not use for an instant, no-confirmation mode/view switch (not a form field) → use `SegmentControl` instead.
- Do not use for menu-style selection inside a popover/dropdown with mixed item kinds → use `ChoiceList` instead.

## Variant selection

This component has no `variant` prop — behavior is uniform; options are supplied via the `options` array.

## Spatial contract

- **Owns its padding:** yes — fieldset, legend, radio stack, and helper row are laid out internally.
- **Owns its margin:** no — spacing relative to surrounding form fields must come from the parent layout.
- **Fills its container:** yes — each `Radio` option renders full-width (`dsn-radio--full-width`).
- **Notes:** selection state (`value`/`defaultValue`) is managed by `SingleChoice` itself — individual `Radio` options don't need (and shouldn't receive) their own `checked` prop via `option.radioProps`.

## Composition rules

- ✅ Can be used inside: forms, settings panels.
- ✅ Composes `Radio` internally for each option — pass per-option overrides via `option.radioProps`, not by mounting `Radio` separately.
- ❌ Never pass `checked` via `option.radioProps` — `SingleChoice` computes each option's checked state from `value`/`selectedValue` internally; an overridden `checked` would conflict with that.
- ❌ Never use for a multi-select scenario — use `MultiChoice` instead.

## Field rules

- Fields are mandatory by default. There is no visual required marker; a required asterisk cannot be rendered.
- Set `optional={true}` to append `(optional)` to the legend in `var(--color-foreground-neutral-tertiary)`. The component renders this suffix — consumers cannot restyle or reword it.
- Mandatory fields set `aria-required` by default; `optional={true}` suppresses it.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `optional` | `boolean` | Set `true` for non-mandatory fields. Renders `(optional)` on the legend. |
| `options` | `SingleChoiceOption[]` | Each needs a unique `id` and `label`; use `description`/`descriptionRight` for supporting text per option. |
| `value` / `defaultValue` / `onValueChange` | `string` / `string` / `(value: string) => void` | Use `value`+`onValueChange` for controlled selection; `defaultValue` for uncontrolled. |
| `error` / `errorMessage` | `boolean` / `string` | Set together when no option (or an invalid one) is selected and the field is required. |

## Common mistakes

1. **Using `SingleChoice` when multiple selections are allowed** — use `MultiChoice` instead; `SingleChoice` enforces exactly one selected value via `role="radiogroup"`.
2. **Passing `checked` through `option.radioProps`** — conflicts with the internally computed checked state; control selection via `value`/`onValueChange` instead.
3. **Using `SingleChoice` for an instant view/mode switch with no form-submission context** — use `SegmentControl` instead, which is designed for that immediate-effect pattern.

## Examples

```tsx
// Most common usage — controlled selection
<SingleChoice
  label="Delivery method"
  options={[
    { id: 'standard', label: 'Standard shipping', description: '5-7 business days' },
    { id: 'express', label: 'Express shipping', description: '1-2 business days' },
  ]}
  value={method}
  onValueChange={setMethod}
/>

// Non-obvious case — with a disabled option
<SingleChoice
  label="Plan"
  options={[
    { id: 'free', label: 'Free' },
    { id: 'pro', label: 'Pro' },
    { id: 'enterprise', label: 'Enterprise', disabled: true, description: 'Contact sales' },
  ]}
  defaultValue="free"
/>
```
