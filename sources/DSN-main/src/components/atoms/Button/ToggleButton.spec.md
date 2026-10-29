# ToggleButton

**Tier:** atom
**Location:** `src/components/atoms/Button/ToggleButton.spec.md`
**Version:** 1.0.0

## What it is

An icon-only button that maintains a persistent, two-state `selected`/not-selected value via `aria-pressed`, rendered as a `<button>` with a leading icon and, optionally, a short visible label (`showLabel`).

## When to use

- Use for a persistent active/inactive icon control in a toolbar — bold, italic, underline, view-mode switches.
- Use when the control represents a boolean state the user can re-toggle at will, and the icon alone communicates its meaning.
- Use inside a `ButtonGroup` when several related toggles are presented together (e.g. text formatting controls).

## When NOT to use

- Do not use for a one-off action with no persistent state → use `Button` instead.
- Do not use for a stacked icon+label control in a bottom toolbar or action panel → use `VerticalButton` instead.
- Do not use when only one option in a set can be active at a time (mutually exclusive) → use `SegmentControl` or `Tab` instead.
- Do not use `variant="plain"` — it is not a supported variant for `ToggleButton` (the type excludes it).

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"ghost"` | Default. Standard toolbar toggle — bold/italic/link-style controls. |
| `"secondary"` | The toggle needs more visual weight than a ghost control, e.g. a standalone view-mode switch outside a toolbar. |
| `"primary"` | Rare — only when the toggle itself is the primary interactive element on the screen. |

### `size` prop

| Value | Use when |
|-------|----------|
| `"md"` | Default. Standard toolbar sizing. |
| `"sm"` | Dense toolbars or inline contexts. |

## Spatial contract

- **Owns its padding:** yes — sized intrinsically around the icon (and label when shown); no external padding wrapper needed.
- **Owns its margin:** no — spacing between adjacent `ToggleButton`s must come from the parent (`ButtonGroup` gap or flex `gap`).
- **Fills its container:** no — sized to its icon, not to the parent width.
- **Notes:** the button has no text label; it renders a single icon slot only.

## Composition rules

- ✅ Can be used inside: `ButtonGroup`, `Toolbar`.
- ❌ Never use `showLabel` for long text — the label is a one- or two-word caption (Figma: `Show label`), not a replacement for Button.
- ❌ Never use to represent one option among several mutually-exclusive choices — use `SegmentControl`/`Tab`.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `selected` | `boolean` | Reflects the current pressed state; drives `aria-pressed` and the visual selected treatment. |
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | See variant table above; defaults to `'ghost'`. |
| `size` | `'sm' \| 'md'` | Defaults to `'md'`; use `'sm'` for dense toolbars. |
| `leadingIcon` | `ReactNode` | Figma: `Leading icon`. Replaces the deprecated `icon` prop. Hide with `showLeadingIcon={false}`. |
| `label` / `showLabel` | `string` / `boolean` | Figma: `Label` / `Show label`. When the label is hidden it still serves as the accessible name. |
| `aria-label` | `string` | Required when there is no `label` — an icon-only button has no visible text to derive an accessible name from. |
| `onSelectedChange` | `(selected: boolean) => void` | Set to receive the new toggled value; the component computes `!selected` internally and calls this alongside `onClick`. |

## Common mistakes

1. **Using `Button` with manual selected-state styling to fake a toggle** — `Button` has no `aria-pressed` semantics; use `ToggleButton`, which is exactly what `button.md`'s "when NOT to use" section for `Button` directs toward for persistent icon toggles.
2. **Applying `aria-pressed` to a plain `Button`** — AGENTS.md restricts `aria-pressed` usage to `ToggleButton`/`VerticalButton`; a plain `Button` triggers actions and should never carry pressed-state semantics.

## Examples

```tsx
// Most common usage — toolbar formatting toggle
<ToggleButton
  icon={<Bold size={16} aria-hidden="true" />}
  aria-label="Bold"
  selected={isBold}
  onSelectedChange={setIsBold}
/>

// Non-obvious case — small, secondary-weight standalone toggle
<ToggleButton
  size="sm"
  variant="secondary"
  icon={<Link2 size={16} aria-hidden="true" />}
  aria-label="Link"
  selected={false}
/>
```
