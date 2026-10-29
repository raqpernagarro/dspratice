# ChipField

**Tier:** molecule  
**Location:** `src/components/molecules/ChipField/ChipField.spec.md`  
**Version:** 1.0.0

## What it is

A labelled form fieldset of toggleable `Chip`s where the user selects any number of options from a fixed, visible list, with a helper or error row.

## When to use

- Use for a form field where the user picks any number of options from a short, fixed list and all options should be visible at once (Pattern 2 — Chips up to 3 options)
- Use when the options are short labels that read well as chips (e.g. tags, interests, days)

## When NOT to use

- Do not use for 4 or more options in a form → use `MultiChoice` (checkbox list) or `Combobox selectionMode="multi"` instead (Pattern 2)
- Do not use when only one option can be selected → use `SingleChoice` / `Radio` or `SegmentControl` instead
- Do not use for multi-value toolbar filters → use `PopoverMenu` with checkbox-cell items instead (MultiSelectAnchored)
- Do not use for free-form values the user types (recipients, keywords) → use `Combobox selectionMode="multi"` instead
- Do not use for read-only labels → use `Tag` instead

## Variant selection

### `size` prop

| Value | Use when |
|-------|----------|
| `"md"` (default) | Standard forms |
| `"sm"` | Dense panels — never mix sizes in the same group |

## Spatial contract

- **Owns its padding:** yes — legend, chip group and helper row own their spacing
- **Owns its margin:** no — inside a `Form`, the form owns spacing between fields
- **Fills its container:** yes — chips wrap within the parent's width
- **Notes:** renders a native `fieldset` and `legend`; don't wrap it in another `Fieldset` for the same label.

## Composition rules

- ✅ Can be used inside: `Form`, `Fieldset` (as one of several fields), `Drawer` and `Modal` content
- ❌ Never combine with: extra margin or gap on the field inside a `Form` (LCB-09)
- ❌ Never place inside: a `Toolbar` — use filter patterns instead

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Always — the default is the literal "Label" |
| `options` | `ChipFieldOption[]` | Always — the default is eight placeholder "Label" options |
| `value` + `onValueChange` | `string[]` + callback | Controlled usage — an array of selected option ids |
| `helperText` | `string` | The default is the literal "Help text" — override it, or pass `''` |
| `optional` | `boolean` | The field is not mandatory |
| `error` + `errorMessage` | `boolean` + `string` | Validation on submit, e.g. "Select at least one day" |
| `options[].chipProps` | `Partial<ChipProps>` | Only for per-chip extras such as a leading icon |

## Common mistakes

1. **Too many options as chips** — see When NOT to use (Pattern 2).
2. **Chips for toolbar filters** — see When NOT to use (Pattern 2, MultiSelectAnchored).
3. **Shipping the "Label" / "Help text" defaults** — see Props reference.

## Examples

```tsx
// Most common usage
<ChipField
  label="Working days"
  options={[
    { id: 'mon', label: 'Mon' },
    { id: 'wed', label: 'Wed' },
    { id: 'fri', label: 'Fri' },
  ]}
  value={days}
  onValueChange={setDays}
  helperText="Pick the days you are in the office."
/>

// Non-obvious: optional field with an error after submit
<ChipField label="Interests" optional options={interestOptions} error={submitted && !valid} errorMessage="Select at most two interests" helperText="" />
```
