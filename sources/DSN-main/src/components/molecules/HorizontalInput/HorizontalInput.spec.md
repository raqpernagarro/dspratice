# HorizontalInput

**Tier:** molecule
**Location:** `src/components/molecules/HorizontalInput/HorizontalInput.spec.md`
**Version:** 1.0.0

## What it is

A layout wrapper that positions a label (and optional icon/description) to the left of an arbitrary input control passed as `children`, on the same row.

## When to use

- Use in dense settings panels, property editors, or label–value list contexts where vertical space is at a premium.
- Use `labelWidth` to align the label column across multiple stacked `HorizontalInput` rows.
- Use `showIcon`/`iconSlot` when a leading icon helps identify the field in a dense list of rows.

## When NOT to use

- Do not use in standard top-to-bottom scannable forms → use the input's default stacked (label-above-control) layout instead.
- Do not use in mobile layouts where horizontal space is insufficient → use the stacked layout instead.
- Do not use with long labels that would wrap → keep labels short, or use the stacked layout if the label can't be shortened.

## Variant selection

This component has no `variant` prop — it is a layout wrapper; visual variation comes from the embedded control (`children`).

## Spatial contract

- **Owns its padding:** no — `HorizontalInput` only arranges the label column and content column side by side; it does not add outer padding.
- **Owns its margin:** no — stack rows directly (no gap). Each row draws its own top divider and vertical padding, so the rows already read as a separated list.
- **Fills its container:** yes — the row stretches to the parent's width; the content column fills the remaining width after the label column.
- **Notes:** the embedded control (passed as `children`) fills the content column via `role="group"` with `aria-labelledby` pointing at the label — do not add a separate visible label inside the child control, or the label will be duplicated.

## Composition rules

- ✅ Can be used inside: settings panels, property editors, description-list-style forms.
- ✅ `children` can be any input control (text, select, number, etc.) — the wrapper only supplies layout and the accessible label association.
- ❌ Never use inconsistent `labelWidth` values across a group of stacked rows — misaligned labels create visual noise.
- ❌ Never place a `Separator` (or any border/divider) between stacked `HorizontalInput` rows — each row already draws a top divider, so an extra one renders as a double line.
- ❌ Never nest another labeled wrapper (e.g. a control that renders its own visible label) inside `children` — the label is owned by `HorizontalInput`, not the embedded control.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `labelWidth` | `string` | Set to a consistent value across a group of rows so label columns align; omit for a single standalone row. |
| `showIcon` / `iconSlot` | `boolean` / `React.ReactNode` | Set together to render a leading icon in the label row; falls back to a default icon if `iconSlot` is omitted while `showIcon` is `true`. |
| `showDescription` | `boolean` | Set `false` to suppress a passed `description` without removing the prop — useful for toggling density without conditionally passing the prop itself. |
| `error` | `boolean` | Set to apply the error visual treatment to the label/description; the embedded control's own error state (if any) must be set separately. |

## Common mistakes

1. **Using inconsistent `labelWidth` across rows in the same group** — the source doc (`input-select-autocomplete-horizontal.md`) calls out that misaligned labels create visual noise; set one consistent value for the whole group.
2. **Using long, wrapping labels** — the source doc limits labels to short phrases (3–4 words) because horizontal space is shared with the control.
3. **Using `HorizontalInput` in a standard top-to-bottom form** — the source doc recommends the stacked layout there instead; horizontal layout is for dense, space-constrained contexts.
4. **Rendering the embedded control's own visible label inside `children`** — `HorizontalInput` already renders the label and associates it via `aria-labelledby`; duplicating it inside the child control creates two labels for one field.

## Examples

```tsx
// Most common usage — aligned label column across a settings panel
<HorizontalInput label="Name" labelWidth="140px">
  <TextInput />
</HorizontalInput>
<HorizontalInput label="Status" labelWidth="140px">
  <Select options={statusOptions} />
</HorizontalInput>

// Non-obvious case — with leading icon and description
<HorizontalInput label="Notifications" showIcon description="Email and push alerts">
  <Switcher />
</HorizontalInput>
```
