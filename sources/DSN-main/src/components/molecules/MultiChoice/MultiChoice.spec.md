# MultiChoice

**Tier:** molecule
**Location:** `src/components/molecules/MultiChoice/MultiChoice.spec.md`
**Version:** 1.0.0

## What it is

A fieldset rendering a list of full-width `Checkbox` options, where each option's checked state is independent and reported via `onOptionChange(optionId, checked)`.

## When to use

- Use for a form field where the user can select any number of independent options from a visible list — none, some, or all.
- Use when all options should be visible at once (unlike `Autocomplete multi`, which hides options behind a search field) — typically a short, fixed list.

## When NOT to use

- Do not use when only one option can be selected → use `SingleChoice` instead.
- Do not use for a single standalone checkbox → use `CheckboxField` instead.
- Do not use when the list is long or dynamic and benefits from search/filter → use `Autocomplete multi`/`Combobox` with `multiSelect` instead.

## Variant selection

This component has no `variant` prop — options are supplied via the `options` array, each with its own `checked` state.

## Spatial contract

- **Owns its padding:** yes — fieldset, legend, checkbox stack, and helper row are laid out internally.
- **Owns its margin:** no — spacing relative to surrounding form fields must come from the parent layout.
- **Fills its container:** yes — each `Checkbox` option renders full-width.
- **Notes:** unlike `SingleChoice`, `MultiChoice` does not manage a single shared selection value — each option's `checked` is passed in directly via `options[].checked` and reported back per-option via `onOptionChange`; the caller owns the full checked-state array.

## Composition rules

- ✅ Can be used inside: forms, settings panels, permission/preference lists.
- ✅ Composes `Checkbox` internally for each option — pass per-option overrides via `option.checkboxProps`, not by mounting `Checkbox` separately.
- ❌ Never use for mutually exclusive options — use `SingleChoice` instead.
- ❌ Never manage checked state internally in a wrapper around `MultiChoice` while also passing `option.checked` from a stale source — the component is fully controlled per-option; the caller must update `options[].checked` in response to `onOptionChange`.

## Field rules

- Fields are mandatory by default. There is no visual required marker; a required asterisk cannot be rendered.
- Set `optional={true}` to append `(optional)` to the legend in `var(--color-foreground-neutral-tertiary)`. The component renders this suffix — consumers cannot restyle or reword it.
- Mandatory fields set `aria-required` by default; `optional={true}` suppresses it.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `optional` | `boolean` | Set `true` for non-mandatory fields. Renders `(optional)` on the legend. |
| `options` | `MultiChoiceOption[]` | Each needs a unique `id`, `label`, and `checked` (controlled per-option); use `description`/`descriptionRight` for supporting text. |
| `onOptionChange` | `(optionId: string, checked: boolean) => void` | Required to actually update state — the component is controlled; without wiring this to update `options`, checkboxes will not visibly toggle. |
| `error` / `errorMessage` | `boolean` / `string` | Set together when a minimum-selection rule is violated (e.g. "Select at least one option"). |

## Common mistakes

1. **Using `MultiChoice` for a mutually exclusive set** — use `SingleChoice` instead, which enforces single selection.
2. **Not wiring `onOptionChange` back into `options[].checked`** — since `MultiChoice` is fully controlled, omitting this update makes the checkboxes appear unresponsive to clicks.
3. **Using `MultiChoice` for a single checkbox** — use `CheckboxField` instead; `MultiChoice`'s fieldset/legend structure is designed for a list of options, not one.
4. **Using `MultiChoice` for a long or dynamically-searched list** — use `Autocomplete multi`/`Combobox` with `multiSelect` instead for lists that benefit from search/filter.

## Examples

```tsx
// Most common usage — controlled option list
const [options, setOptions] = useState(initialOptions);

<MultiChoice
  label="Notification channels"
  options={options}
  onOptionChange={(id, checked) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, checked } : o)))
  }
/>
```
