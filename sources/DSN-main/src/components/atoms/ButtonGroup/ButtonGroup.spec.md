# ButtonGroup

**Tier:** atom
**Location:** `src/components/atoms/ButtonGroup/ButtonGroup.spec.md`
**Version:** 1.0.0

## What it is

A horizontal `role="group"` wrapper (`<div>`) that lays out `Button` children either glued edge-to-edge with shared corner radii, or spaced apart with a standard gap.

## When to use

- Use when presenting two or more related `Button`s that should be visually associated as a single control cluster — e.g. Cancel/Save pairs, a row of secondary actions.
- Use `spaceBetween={false}` (default, "glued") when the buttons form a single segmented control-like cluster with shared borders.
- Use `spaceBetween={true}` when the buttons should read as related but visually distinct actions.

## When NOT to use

- Do not use to fake a primary/secondary CTA pair next to `EmptyState` → use `EmptyState`'s `showMainCta`/`showSecondaryOption` props instead.
- Do not use for a vertically stacked group of buttons → use `ButtonGroupVertical` instead.
- Do not use when only one option can ever be selected from the set (mutually exclusive, persistent selection) → use `SegmentControl` instead.

## Variant selection

### `size` prop

| Value | Use when |
|-------|----------|
| `"md"` | Default. Standard button sizing/gap. |
| `"sm"` | Dense layouts, table toolbars — use the same `size` on the child `Button`s for visual consistency. |

### `spaceBetween` prop

| Value | Use when |
|-------|----------|
| `false` (default) | Buttons should appear glued together as one segmented cluster — shared border radius at the group's outer edges only. |
| `true` | Buttons should read as distinct but related actions, each keeping its own full corner radius, separated by a standard gap. |

## Spatial contract

- **Owns its padding:** no — `ButtonGroup` has no internal padding of its own; it only applies `gap` (or removes it in glued mode) between children.
- **Owns its margin:** no — spacing relative to surrounding content must come from the parent layout.
- **Fills its container:** no — `display: inline-flex`, sized to its children's combined intrinsic width.
- **Notes:** in glued mode (`spaceBetween={false}`), `ButtonGroup` overrides each child `Button`'s border radius (only the first/last child keep outer rounding) — do not add competing radius overrides on the children.

## Composition rules

- ✅ Can be used inside: `BulkActionBar`, toolbars, form footers, table row actions.
- ✅ Children should be `Button` components sized consistently with the group's `size`.
- ❌ Never mix `Button` sizes within a single `ButtonGroup` — the glued-mode border radius assumes uniform sizing.
- ❌ Never place a `VerticalButton` or `ToggleButton` inside — those are icon-based controls with different spatial contracts; use `ButtonGroupVertical` or a plain flex wrapper for those instead.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `spaceBetween` | `boolean` | See variant table above; defaults to `false` (glued). |
| `size` | `'md' \| 'sm'` | Match to the `size` of the child `Button`s; defaults to `'md'`. |
| `aria-label` | `string` | Override the default `"Button group"` label when the group's purpose isn't self-evident from context. |

## Common mistakes

1. **Mounting a standalone `Button` beside `EmptyState` instead of using its CTA props** — `button.md` explicitly calls this out; the same applies when wrapping that pairing in a `ButtonGroup` — use `EmptyState`'s `showMainCta`/`showSecondaryOption` instead.
2. **Mixing `size="sm"` and `size="md"` buttons in the same group** — breaks the glued-mode corner-radius logic, which assumes a uniform child size.

## Examples

```tsx
// Most common usage — glued pair
<ButtonGroup>
  <Button variant="secondary">Cancel</Button>
  <Button variant="primary">Save</Button>
</ButtonGroup>

// Non-obvious case — spaced, small, three related actions
<ButtonGroup size="sm" spaceBetween>
  <Button variant="ghost" size="sm">Copy</Button>
  <Button variant="ghost" size="sm">Duplicate</Button>
  <Button variant="ghost" size="sm" destructive>Delete</Button>
</ButtonGroup>
```
