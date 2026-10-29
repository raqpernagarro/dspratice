# BarChart

**Tier:** organism
**Location:** `src/components/organisms/Charts/BarChart.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

A vertical grouped bar chart — categories on the x-axis, one cluster of bars per series key, magnitude on the y-axis.

## When to use

- Use when comparing discrete magnitudes across categories (quarters, months, regions).
- Use for side-by-side comparison of two or three metrics per category (grouped bars).
- Use when bar height is the primary visual encoding and categories are few enough to read without scrolling.

## When NOT to use

- Do not use when parts must sum to a whole per row and horizontal reading is clearer → use `HorizontalStackedBarChart` instead.
- Do not use for trends over many points where continuity matters → use `LineChart` or `AreaChart` instead.
- Do not use for part-to-whole with few slices → use `DonutChart` instead.
- Do not use for two-dimensional density (x × y bins) → use `HeatmapChart` instead.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `data` | `ChartDataPoint[]` | One row per category; numeric field per `series[].key` |
| `xKey` | `string` | Category label field |
| `series` | `ChartSeries[]` | Each series becomes a bar in the group |
| `height` | `number` | Default `240`; increase for three+ series or long labels |
| `state` | `ChartState` | Standard family states |
| `aria-label` | `string` | Name the comparison being shown |

Shared contract: `specs/organisms/charts.md`.

## Examples

~~~tsx
<BarChart
  data={quarterlyData}
  xKey="quarter"
  series={[
    { key: 'inbound', label: 'Inbound' },
    { key: 'outbound', label: 'Outbound' },
  ]}
  aria-label="Quarterly traffic"
/>
~~~
