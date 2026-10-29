# TextArea

**Tier:** atom
**Location:** `src/components/atoms/TextArea/TextArea.spec.md`
**Version:** 1.0.1
**Date:** 2026-07-28

## What it is

A multi-line text input for longer free-form text. Expands vertically to accommodate content.

## When to use

- Use for prose, descriptions, notes, or any value expected to span multiple lines
- Always pass `label` — every `TextArea` in consuming apps must have a visible field label; use `optional` for non-mandatory fields instead of omitting the label

## When NOT to use

- Do not use when the value is a single line → use `TextInput` instead
- Do not use when the value is richly formatted (bold, lists, links) → use a rich text editor instead
- Do not omit `label` and rely on placeholder text alone — placeholders are not accessible names

## Variant selection

`TextArea` has no visual `variant` prop — `error` is driven by validation, not chosen ahead of time.

## Spatial contract

- **Owns its padding:** yes — label, control, and helper/error row stack internally
- **Owns its margin:** no — spacing comes from the surrounding form layout
- **Fills its container:** yes — spans parent width
- **Notes:** Minimum height should show at least 3 lines; allow vertical resize on desktop unless layout requires fixed height. The resize handle is a focusable `role="separator"` ("Resize text area") — ArrowUp/ArrowDown shrink/grow by 16px, Home/End jump to min/max (max = 6× min height)

## Composition rules

- ✅ Can be used inside: forms, modals, drawers, detail panels
- ❌ Never use a single-line-height text area

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Always set in consuming apps — visible field label required |
| `minRows` | `number` | Set initial visible row count; defaults to 3. Do not use `rows` — `TextArea` has no `rows` prop |
| `maxLength` | `number` | Pair with character count when a limit exists |
| `optional` | `boolean` | Set `true` for non-mandatory fields |
| `error` / `errorMessage` | `boolean` / `string` | Set both together on validation failure |
| `trailingIcon` | `React.ReactNode` | Figma: `Trailing icon` / `Show trailing icon`. Optional 16×16 icon at the end of the control. |

### Forwarded native props

These pass through to the underlying `<textarea>` or wrapper contract: `onChange`, `onBlur`, `onFocus`, `value`, `defaultValue`, `disabled`, `placeholder`, `maxLength`, `name`, `autoComplete`, `id`, `className`, `aria-label`, `aria-labelledby`.

### Not forwarded

- `ref` — the component uses an internal ref for resize behavior
- `rows` — use `minRows` instead
- Native keyboard handlers such as `onKeyDown` and `onKeyUp` — not part of the public API; extend the component in the library if required

## Common mistakes

1. **Using `TextInput` for multi-line content** — use `TextArea` instead
2. **Omitting `label`** — always provide a visible field label; use `optional` for non-mandatory fields
3. **Passing `rows` instead of `minRows`** — `TextArea` controls height via `minRows` only
4. **Showing characters used instead of remaining** — prefer `"120 characters remaining"` over `"380/500"`
5. **Disabling resize without a layout reason** — allow vertical resize on desktop by default

## Examples

~~~tsx
<TextArea label="Description" helperText="Maximum 500 characters" maxLength={500} />

<TextArea label="Notes" optional />
~~~
