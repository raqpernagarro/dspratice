# AreaChart

**Tier:** organism
**Location:** `src/components/organisms/Charts/AreaChart.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

A static multi-series area chart with gradient fill under each line — same data model as `LineChart`, with filled regions emphasizing cumulative or volume perception.

## When to use

- Use when trend direction matters and the filled area helps readers sense magnitude or stacked visual weight over time.
- Use for one or two series comparisons where area fill adds meaning (e.g. current period volume vs baseline).
- Use when you do not need hover tooltips or brush zoom (same static interaction model as `LineChart`).

## When NOT to use

- Use `LineChart` when lines alone are clearer (many overlapping series — area fill reduces legibility).
- Do not use when exact hover values are required → use `XYLineChart` instead.
- Do not use for part-to-whole at a single point in time → use `DonutChart` instead.
- Do not use for category magnitude with discrete bars → use `BarChart` instead.
- Do not use for stacked proportions flowing over time → use `StreamgraphChart` instead.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `data` | `ChartDataPoint[]` | Same row shape as `LineChart` |
| `xKey` | `string` | Categorical x dimension |
| `series` | `ChartSeries[]` | One gradient layer per series |
| `height` | `number` | Default `240` |
| `state` | `ChartState` | Fetch / empty / error handling |
| `aria-label` | `string` | Meaningful chart name |

Shared contract: `specs/organisms/charts.md`.

## Examples

~~~tsx
<AreaChart
  data={comparisonData}
  xKey="month"
  series={[
    { key: 'current', label: 'Current period' },
    { key: 'previous', label: 'Previous period' },
  ]}
  aria-label="Revenue trend by period"
/>
~~~
