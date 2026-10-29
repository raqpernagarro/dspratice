# VerticalButton

**Tier:** atom
**Location:** `src/components/atoms/Button/VerticalButton.spec.md`
**Version:** 1.0.0

## What it is

A button with a stacked icon circle and text label below it, rendered as a single `<button>` with the icon inside a treated circular area and the label in micro typography underneath.

## When to use

- Use for a stacked icon+label control in a bottom navigation bar or a toolbar action panel where a visible label reinforces the icon's meaning.
- Use when the action benefits from a persistent visual label alongside the icon (unlike `ToggleButton`, which is icon-only).
- Use with `badge` when the action has a pending notification to surface (e.g. unread count).

## When NOT to use

- Do not use for a single inline action in a toolbar or form → use `Button` instead.
- Do not use for a persistent icon-only toggle with no label (bold, italic, view mode) → use `ToggleButton` instead.
- Do not use for one option among several mutually exclusive choices → use `SegmentControl` or `Tab` instead.

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"ghost"` | Default. Standard toolbar/bottom-nav context. |
| `"secondary"` | The action needs more visual weight than the surrounding ghost controls. |
| `"primary"` | Rare — the vertical button is itself the primary interactive element on the screen. |

### `size` prop

| Value | Use when |
|-------|----------|
| `"md"` | Default — 32 × 32 px icon area. |
| `"sm"` | Compact bottom-nav bars or dense panels — 24 × 24 px icon area. |

## Spatial contract

- **Owns its padding:** yes — the icon circle owns its own visual treatment (background, shadow, radius); the label sits below it with a fixed 4px gap, both inside the button element.
- **Owns its margin:** no — spacing between adjacent `VerticalButton`s must come from the parent layout.
- **Fills its container:** no — sized intrinsically to the icon circle plus label.
- **Notes:** the visual treatment (background fill, shadow, radius) applies only to the inner icon circle, not the outer button — do not add competing background styling to the button element itself.

## Composition rules

- ✅ Can be used inside: bottom navigation bars, toolbar action groups.
- ❌ Never omit `aria-label` when `showLabel` is `false` or `children` is absent — there is no other accessible name source.
- ❌ Never use for a single mutually-exclusive selection among many — use `SegmentControl`/`Tab`.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `showLabel` | `boolean` | Set `false` for icon-only rendering; always pair with `aria-label` in that case. |
| `badge` | `boolean` | Set to render a small notification dot on the icon area — use for unread/pending counts, not decorative purposes. |
| `loading` | `boolean` | Set while the triggered action is in flight; replaces the icon with a spinner and sets `aria-busy`. |
| `aria-label` | `string` | Required when `showLabel` is `false` or `children` is absent. |

## Common mistakes

1. **Using `Button` for a stacked icon+label control** — `button.md`'s "when NOT to use" section directs stacked icon+label controls to `VerticalButton` instead.
2. **Applying `aria-pressed` to a `VerticalButton` used for a one-off action** — AGENTS.md restricts `aria-pressed` semantics to toggle-style controls (`ToggleButton`/`VerticalButton` used as toggles); a `VerticalButton` triggering a single action should not carry pressed-state semantics.
3. **Setting `showLabel={false}` without `aria-label`** — leaves the button with no accessible name, mirroring the same mistake called out for `Button` icon-only usage in `button.md`.

## Examples

```tsx
// Most common usage — bottom nav item with label
<VerticalButton icon={<HomeIcon />} onClick={() => navigate('/')}>
  Home
</VerticalButton>

// Non-obvious case — icon-only with notification badge
<VerticalButton icon={<InboxIcon />} showLabel={false} aria-label="Inbox" badge />
```
