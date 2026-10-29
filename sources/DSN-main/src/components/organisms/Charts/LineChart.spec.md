# LineChart

**Tier:** organism
**Location:** `src/components/organisms/Charts/LineChart.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

A static multi-series line chart over a categorical x-axis with point markers — the default trend chart when hover tooltips and brush zoom are not required.

## When to use

- Use when showing one or more metrics over ordered categories (months, quarters, stages) and the reader compares shape/trend at a glance.
- Use when you need the simplest cartesian line with explicit axis labels and no pointer interaction.
- Use for period-over-period comparison with two series (e.g. current vs previous) when values are readable from the axis scale without a tooltip.

## When NOT to use

- Do not use when the user must inspect exact values on hover → use `XYLineChart` instead (animated tooltip and crosshair).
- Do not use when the user must zoom or filter a long x-range interactively → use `BrushLineChart` instead.
- Do not use when emphasizing volume under the line → use `AreaChart` instead.
- Do not use for part-to-whole composition → use `DonutChart` instead.
- Do not use for magnitude comparison across categories with bars → use `BarChart` instead.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `data` | `ChartDataPoint[]` | Rows with `xKey` field plus one numeric field per `series[].key` |
| `xKey` | `string` | Categorical dimension (e.g. `"month"`) |
| `series` | `ChartSeries[]` | Each entry: `key` (data field), `label` (display), optional `color` (dataviz token) |
| `height` | `number` | Default `240`; increase for dense x-axis labels or more vertical headroom |
| `state` | `ChartState` | `'loading'` / `'empty'` / `'error'` while fetching or when there is no data |
| `aria-label` | `string` | Required meaningful name for `role="img"` (default `"Line chart"`) |

Shared state, theming, sizing, and `ChartCard` rules: `specs/organisms/charts.md`.

## Examples

~~~tsx
<LineChart
  data={monthlyData}
  xKey="month"
  series={[{ key: 'active', label: 'Active users' }]}
  aria-label="Monthly active users"
/>
~~~
