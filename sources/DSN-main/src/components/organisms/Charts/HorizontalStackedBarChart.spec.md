# HorizontalStackedBarChart

**Tier:** organism
**Location:** `src/components/organisms/Charts/HorizontalStackedBarChart.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

A horizontal stacked bar chart — one bar per row category, segments stacked left-to-right showing part-to-whole composition per row.

## When to use

- Use when each row is a category (segment, team, product line) and multiple components stack to a total.
- Use when category labels are long — horizontal layout gives y-axis room for text.
- Use when comparing composition across rows rather than absolute height of isolated bars.

## When NOT to use

- Do not use for side-by-side magnitude comparison per category → use `BarChart` instead (grouped vertical bars).
- Do not use when segments should flow as layers over time → use `StreamgraphChart` instead.
- Do not use for a single part-to-whole snapshot with few slices → use `DonutChart` instead.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `data` | `ChartDataPoint[]` | One row per category |
| `categoryKey` | `string` | Row label field (y-axis categories) — **not** `xKey` |
| `series` | `ChartSeries[]` | Stack order follows array order; values sum per row |
| `height` | `number` | Default `260`; increase for many rows |
| `state` | `ChartState` | Standard family states |
| `aria-label` | `string` | Describe what each stack represents |

Shared contract: `specs/organisms/charts.md`.

## Examples

~~~tsx
<HorizontalStackedBarChart
  data={segmentData}
  categoryKey="segment"
  series={[
    { key: 'productA', label: 'Product A' },
    { key: 'productB', label: 'Product B' },
  ]}
  aria-label="Revenue mix by segment"
/>
~~~
