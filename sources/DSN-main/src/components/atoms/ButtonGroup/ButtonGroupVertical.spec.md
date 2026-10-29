# ButtonGroupVertical

**Tier:** atom
**Location:** `src/components/atoms/ButtonGroup/ButtonGroupVertical.spec.md`
**Version:** 1.0.0

## What it is

A vertical `role="group"` wrapper (`<div>`) that stacks `Button` children top to bottom, either glued edge-to-edge with shared corner radii, or spaced apart with a standard gap.

## When to use

- Use when presenting two or more related `Button`s stacked vertically as a single control cluster — e.g. a vertical action list in a sidebar or dropdown panel.
- Use `spaceBetween={false}` (default, "glued") when the buttons form a single segmented vertical cluster with shared borders.
- Use `spaceBetween={true}` when the buttons should read as related but visually distinct stacked actions.

## When NOT to use

- Do not use for a horizontally laid-out group of buttons → use `ButtonGroup` instead.
- Do not use for stacked icon+label buttons (bottom nav style) → use `VerticalButton` for each item instead; `ButtonGroupVertical` is a layout wrapper for regular `Button`s, not an icon-stack component itself.
- Do not use when only one option can ever be selected from the set → use `SegmentControl` instead.

## Variant selection

### `size` prop

| Value | Use when |
|-------|----------|
| `"md"` | Default. Standard button sizing/gap. |
| `"sm"` | Dense layouts — use the same `size` on the child `Button`s for visual consistency. |

### `spaceBetween` prop

| Value | Use when |
|-------|----------|
| `false` (default) | Buttons should appear glued together as one vertical segmented cluster — shared border radius at the group's top/bottom edges only. |
| `true` | Buttons should read as distinct but related stacked actions, each keeping its own full corner radius, separated by a standard gap. |

## Spatial contract

- **Owns its padding:** no — no internal padding of its own; only applies `gap` (or removes it in glued mode) between children.
- **Owns its margin:** no — spacing relative to surrounding content must come from the parent layout.
- **Fills its container:** no — `display: inline-flex; flex-direction: column`, sized to its children's combined intrinsic height. Width is the widest button's; `align-items: stretch` makes every button that same width.
- **Notes:** in glued mode (`spaceBetween={false}`), overrides each child `Button`'s border radius so only the first child keeps its top corners rounded and the last child keeps its bottom corners rounded — do not add competing radius overrides on the children.

## Composition rules

- ✅ Can be used inside: sidebars, dropdown/popover action lists, vertical toolbars.
- ✅ Children should be `Button` components sized consistently with the group's `size`.
- ❌ Never mix `Button` sizes within a single `ButtonGroupVertical` — the glued-mode border radius assumes uniform sizing.
- ❌ Never use for a horizontal action row — use `ButtonGroup` instead.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `spaceBetween` | `boolean` | See variant table above; defaults to `false` (glued). |
| `size` | `'md' \| 'sm'` | Match to the `size` of the child `Button`s; defaults to `'md'`. |
| `aria-label` | `string` | Override the default `"Button group vertical"` label when the group's purpose isn't self-evident from context. |

## Common mistakes

1. **Mixing `size="sm"` and `size="md"` buttons in the same group** — breaks the glued-mode corner-radius logic, which assumes a uniform child size (same failure mode as `ButtonGroup`).
2. **Using `ButtonGroupVertical` where a horizontal layout is expected** — the component only stacks vertically (`flex-direction: column`); use `ButtonGroup` for horizontal rows.

## Examples

```tsx
// Most common usage — glued vertical pair in a popover
<ButtonGroupVertical>
  <Button variant="ghost">Edit</Button>
  <Button variant="ghost" destructive>Delete</Button>
</ButtonGroupVertical>

// Non-obvious case — spaced, small, stacked actions
<ButtonGroupVertical size="sm" spaceBetween>
  <Button variant="ghost" size="sm">Copy link</Button>
  <Button variant="ghost" size="sm">Duplicate</Button>
</ButtonGroupVertical>
```
