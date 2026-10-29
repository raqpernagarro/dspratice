# Slider

**Tier:** molecule
**Location:** `src/components/molecules/Slider/Slider.spec.md`
**Version:** 1.0.0

## What it is

A drag-based numeric input with one handle (`mode="single"`) or two handles (`mode="range"`) along a track between `min` and `max`, with optional paired `NumberInput` fields for precise entry.

## When to use

- Use when the user is selecting a value from a continuous or stepped numeric range and the approximate value matters more than typed precision — price filters, volume, thresholds, percentages.
- Use `mode="range"` when the user selects both a minimum and maximum bound.
- Use `showInput` to pair the handle with a `NumberInput` for contexts where precision also matters — dragging updates the number, editing the number updates the handle.

## When NOT to use

- Do not use when the exact value is critical and must be typed precisely → use `NumberInput` instead.
- Do not use when the range isn't meaningful to display visually (a hidden internal threshold) → use `NumberInput` instead.
- Do not use for a very large range needing fine granularity → use `NumberInput` with explicit `min`/`max` instead.

## Variant selection

### `mode` prop

| Value | Use when |
|-------|----------|
| `"single"` (default) | One handle — user selects one value up to a maximum. |
| `"range"` | Two handles — user selects a minimum and maximum defining a range; the two handles cannot cross (the component sorts/clamps them). |

### `stack` prop

| Value | Use when |
|-------|----------|
| `"vertical"` (default) | Standard stacked layout — label/value above the track. |
| `"horizontal"` | Space-constrained inline contexts. |

## Spatial contract

- **Owns its padding:** yes — track, handle(s), value display, and optional min/max labels are laid out internally.
- **Owns its margin:** no — spacing relative to surrounding form content must come from the parent layout.
- **Fills its container:** yes — the track stretches to the parent's width.
- **Notes:** when `showInput` is `true`, the paired `NumberInput`(s) are rendered by `Slider` itself (it imports `NumberInput` internally) — do not mount a separate `NumberInput` alongside it expecting to sync manually.

## Composition rules

- ✅ Can be used inside: filter panels, settings forms, dashboards.
- ✅ Composes `NumberInput` internally when `showInput` is set — this is an implementation detail, not something to duplicate externally.
- ❌ Never let the two range handles cross — the component already clamps `rangeValue` so min ≤ max; do not add external logic assuming they can invert.
- ❌ Never omit visible min/max labels or a current-value display — the source doc requires the value to be shown, not inferred from handle position alone.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `mode` | `'single' \| 'range'` | See variant table above. |
| `step` | `number` | Set explicitly for the range in question — small ranges use `1`, large ranges (e.g. 0–10,000) should use a larger step like `100` to keep selection practical. |
| `showInput` | `boolean` | Set when precision matters alongside the drag interaction; pairs a `NumberInput` with the handle. |
| `showMinMax` | `boolean` | Set to display min/max labels at the track ends. |
| `valueFormatter` | `(value: number) => string` | Set to append units to the displayed value (e.g. `"€120"`, `"10 GB"`). |
| `minHandleAriaLabel` / `maxHandleAriaLabel` | `string` | Set distinct labels for range mode, e.g. `"Minimum price"` / `"Maximum price"`. |

## Common mistakes

1. **Using `Slider` for a value that must be typed exactly** — `input-slider-upload-chips.md` directs precise-entry cases to `NumberInput` instead.
2. **Not showing the current value alongside the handle** — the source doc requires the value be visible (tooltip or persistent label), not inferred from handle position.
3. **Omitting a step size for a large range** — the source doc recommends a larger step (e.g. `100` for a 0–10,000 range) to make selection practical; leaving the default `step={1}` on a huge range makes dragging imprecise.
4. **Mounting a separate `NumberInput` next to `Slider` instead of using `showInput`** — the pairing is built in; a hand-rolled sync duplicates state the component already manages.

## Examples

```tsx
// Most common usage — single value with visible min/max
<Slider min={0} max={500} step={10} showMinMax valueFormatter={(v) => `€${v}`} />

// Non-obvious case — range mode with paired number inputs
<Slider
  mode="range"
  min={0}
  max={10000}
  step={100}
  showInput
  minHandleAriaLabel="Minimum price"
  maxHandleAriaLabel="Maximum price"
/>
```
