# ProgressRing

**Tier:** atom
**Location:** `src/components/atoms/ProgressRing/ProgressRing.spec.md`
**Version:** 1.0.0

## What it is

A circular `role="progressbar"`/`role="status"` SVG ring that either spins indeterminately (270° arc, no known end time) or fills clockwise from 12 o'clock to a given percentage (determinate).

## When to use

- Use for compact, circular loading/progress indicators — inline with a button, inside a small card, or wherever a full-width bar doesn't fit.
- Omit `value` for indeterminate mode (spinner-like, continuous spin) when duration is unknown.
- Provide `value` for determinate mode only when an actual percentage is known and worth communicating precisely.

## When NOT to use

- Do not use for a full-width, linear loading indicator → use `LoadingBar` (indeterminate) or `ProgressBar` (determinate) instead.
- Do not use to represent placeholder content while data loads → use `SkeletonLoading` instead.

## Variant selection

### `value` prop (mode selector)

| Value | Use when |
|-------|----------|
| Omitted (indeterminate) | Duration unknown — a fixed 270° arc spins continuously; uses `role="status"` since `role="progressbar"` requires `aria-valuenow`. |
| Provided, 0–100 (determinate) | An actual percentage is known; the ring fills clockwise from 12 o'clock and exposes `aria-valuenow` via `role="progressbar"`. |

### `size` prop

| Value | Use when |
|-------|----------|
| `"sm"` | 16px — inline with text or small controls. |
| `"lg"` (default) | 32px — standard standalone usage. |
| `"xl"` | 48px — more prominent standalone loading state. |
| `"xxl"` | 64px — full-panel or empty-state loading contexts. |

## Spatial contract

- **Owns its padding:** yes — the SVG ring is sized entirely by `size`; no internal padding to configure.
- **Owns its margin:** no — placement relative to surrounding content must come from the parent layout.
- **Fills its container:** no — sized to a fixed pixel dimension per `size`, does not stretch.
- **Notes:** the grey track circle is only rendered in determinate mode — indeterminate mode shows only the spinning arc with no static track, matching the `Spinner` component's visual language.

## Composition rules

- ✅ Can be used inside: buttons (loading state), cards, empty states, compact dashboard tiles.
- ❌ Never use `role="progressbar"` semantics manually for the indeterminate case — the component already switches to `role="status"` internally since `aria-valuenow` cannot be set without a known value.
- ❌ Never omit `label` when there is no other visible text describing the operation — required for accessibility in that case.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `value` | `number` | Omit for indeterminate mode; provide a 0–100 number for determinate mode — see variant table above. |
| `size` | `'sm' \| 'lg' \| 'xl' \| 'xxl'` | Match to the surrounding context's scale; defaults to `'lg'` (32px). |
| `label` | `string` | Set whenever no surrounding visible text already describes the operation. |

## Common mistakes

1. **Using `ProgressRing` for a full-width linear indicator** — use `LoadingBar`/`ProgressBar` instead; `ProgressRing` is sized to fixed pixel dimensions and doesn't stretch.
2. **Omitting `label` with no visible surrounding text** — leaves the ring with no accessible description of what is loading/progressing.
3. **Assuming `role="progressbar"` in indeterminate mode** — the component switches to `role="status"` when `value` is omitted since `aria-valuenow` can't be meaningfully set; code inspecting the accessibility tree should account for both roles.

## Examples

```tsx
// Most common usage — indeterminate, inline with a button
<ProgressRing size="sm" label="Saving" />

// Non-obvious case — determinate, larger size in an empty state
<ProgressRing size="xxl" value={syncPercent} label="Syncing data" />
```
