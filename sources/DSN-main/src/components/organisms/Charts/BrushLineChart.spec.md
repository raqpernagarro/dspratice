# BrushLineChart

**Tier:** organism
**Location:** `src/components/organisms/Charts/BrushLineChart.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

A line chart with a secondary brush strip below the main plot — drag handles on the mini-chart filter the visible x-range on the main chart.

## When to use

- Use when the dataset has many categorical points and users need to focus on a sub-range without leaving the page.
- Use for time-series or ordered categories where overview + detail in one widget is required.
- Use when pointer tooltip on every point is not required (no built-in tooltip — static main plot).

## When NOT to use

- Do not use for short series where the full range always fits → use `LineChart` instead.
- Do not use when hover value inspection is the primary interaction → use `XYLineChart` instead.
- Do not use for bar, area, donut, or heatmap data shapes.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `data` | `ChartDataPoint[]` | Full series; brush slices rows by index |
| `xKey` | `string` | Ordered categorical field |
| `series` | `ChartSeries[]` | Main plot renders all series; brush preview uses first series only |
| `height` | `number` | Default `300` (includes brush strip — taller than `LineChart`) |
| `state` | `ChartState` | Standard family states |
| `aria-label` | `string` | Describe the chart and brush behavior if non-obvious |

Shared contract: `specs/organisms/charts.md`.

## Examples

~~~tsx
<BrushLineChart
  data={longMonthlyData}
  xKey="month"
  series={[{ key: 'revenue', label: 'Revenue' }]}
  aria-label="Revenue with range brush"
/>
~~~
