# HeatmapChart

**Tier:** organism
**Location:** `src/components/organisms/Charts/HeatmapChart.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

A grid heatmap — columns (`x`), rows (`y`), and cell intensity (`value`) — colored on a linear scale from `--color-border-dataviz-grid` (low) to `--color-background-dataviz-1` (high).

## When to use

- Use when both dimensions are categorical and the cell value represents density, count, or intensity (activity by day × hour, feature usage matrix).
- Use when patterns across two axes matter more than precise numeric reading from bar length.

## When NOT to use

- Do not use for simple category vs magnitude → use `BarChart` instead.
- Do not use for part-to-whole slices → use `DonutChart` instead.
- Do not use for trends over one ordered dimension → use `LineChart` instead.
- Do not use cartesian `ChartDataPoint[]` — heatmap requires the column/bin shape below.

## Data shape

```ts
HeatmapChartColumn[] // prop: data
// Each column:
{ x: string; bins: { y: string; value: number }[] }
```

- Every column must expose the **same `y` labels** in the same order (row domain is taken from `data[0].bins`).
- `x` is the column header (bottom axis); `y` is the row label (left axis); `value` drives fill intensity.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `data` | `HeatmapChartColumn[]` | Column/bin structure above |
| `height` | `number` | Default `280` |
| `state` | `ChartState` | Empty when `data` is empty or first column has no bins |
| `aria-label` | `string` | Name both dimensions (e.g. weekly activity heatmap) |

Shared contract: `specs/organisms/charts.md`.

## Examples

~~~tsx
<HeatmapChart
  data={[
    { x: 'Mon', bins: [{ y: '09:00', value: 12 }, { y: '12:00', value: 28 }] },
    { x: 'Tue', bins: [{ y: '09:00', value: 14 }, { y: '12:00', value: 31 }] },
  ]}
  aria-label="Weekly activity heatmap"
/>
~~~
