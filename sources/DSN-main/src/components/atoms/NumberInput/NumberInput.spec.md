# NumberInput

**Tier:** atom
**Location:** `src/components/atoms/NumberInput/NumberInput.spec.md`
**Version:** 1.0.0

## What it is

A labeled numeric text input with increment/decrement stepper buttons, `min`/`max` boundary clamping on blur, and keyboard arrow-key support.

## When to use

- Use for quantities, counts, durations, or any numeric value the user enters or adjusts, especially where stepper controls (+ / −) are useful for small integer ranges.
- Always define `min`/`max` where applicable — the stepper buttons disable automatically at each boundary.

## When NOT to use

- Do not use for currency amounts → currency formatting/decimal rules are complex; use a dedicated currency input or a plain text input with explicit formatting guidance.
- Do not use for a value that is a range between two points → use `Slider` instead.
- Do not use for a large numeric ID or code where increment/decrement makes no sense → use a plain text input instead.

## Variant selection

This component has no `variant` prop; behavior is driven by `min`, `max`, and `step`.

## Spatial contract

- **Owns its padding:** yes — label, control (field + stepper), and helper rows are laid out internally.
- **Owns its margin:** no — spacing relative to surrounding form fields must come from the parent layout.
- **Fills its container:** yes — the control row stretches to the parent's width; the stepper button group sits at a fixed width inside it.
- **Notes:** the stepper buttons are part of the control, not a separate element — do not wrap the field and stepper separately expecting independent layout control.

## Composition rules

- ✅ Can be used inside: forms, settings panels, quantity selectors in list/table rows.
- ❌ Never omit `min`/`max` when a valid range exists — the component silently allows out-of-range typed values until blur, where it clamps; without bounds, invalid values can be committed via `onChange` during typing.
- ❌ Never rely on the stepper as the only input method — direct keyboard entry (typing, or `ArrowUp`/`ArrowDown` while focused) must remain available, which the component already supports.

## Field rules

- Fields are mandatory by default. There is no visual required marker; a required asterisk cannot be rendered.
- Set `optional={true}` to append `(optional)` to the label in `var(--color-foreground-neutral-tertiary)`. The component renders this suffix — consumers cannot restyle or reword it.
- Mandatory fields set `aria-required` by default; `optional={true}` suppresses it.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `optional` | `boolean` | Set `true` for non-mandatory fields. Renders `(optional)` on the label. |
| `min` / `max` | `number` | Set whenever the value has a valid range; the stepper buttons auto-disable at each boundary and the value is clamped on blur. |
| `step` | `number` | Set to the meaningful increment for the value being edited (e.g. `5` for a 0–100 range); defaults to `1`. |
| `onChange` | `(value: number \| null) => void` | Called with `null` when the field is cleared or contains only `"-"` — handle this case explicitly rather than assuming a number is always present. |
| `error` / `errorMessage` | `boolean` / `string` | Set together when the value fails validation (e.g. exceeds a business-rule bound not enforced by `min`/`max`). |
| `leadingIcon` | `React.ReactNode` | Figma: `Icon` / `Show icon`. Optional 16×16 icon before the value (e.g. a currency or hash glyph). |

## Common mistakes

1. **Using `NumberInput` for a currency amount** — `input-password-otp-number-phone.md` explicitly excludes currency values; use a dedicated currency input or plain text input with formatting guidance instead.
2. **Using `NumberInput` for a min–max range selection** — the source doc directs range selection to `Slider` instead.
3. **Silently clamping without showing an error** — the source doc states bounds should be enforced with a visible error, not a silent clamp, when the user exceeds them via typed input before blur.
4. **Not stating the valid range in helper text** — when `min`/`max` are meaningful to the user, state them, e.g. "Between 1 and 100", per the source doc's content guidelines.

## Examples

```tsx
// Most common usage — bounded quantity
<NumberInput
  label="Quantity"
  min={1}
  max={50}
  helperText="Between 1 and 50"
  value={quantity}
  onChange={(v) => setQuantity(v ?? 1)}
/>

// Non-obvious case — larger step for a wide range
<NumberInput label="Duration (days)" min={0} max={10000} step={100} />
```
