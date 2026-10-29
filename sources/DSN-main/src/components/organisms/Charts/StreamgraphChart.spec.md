# StreamgraphChart

**Tier:** organism
**Location:** `src/components/organisms/Charts/StreamgraphChart.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

A stacked streamgraph — series layers flow symmetrically above and below a central baseline over ordered categories, emphasizing changing composition over time.

## When to use

- Use when multiple series represent parts of a shifting total over an ordered x dimension and the **shape of the stream** is the insight (traffic mix, channel composition over months).
- Use for presentation-style analytics where layer continuity matters more than exact bar comparisons.
- Use with three or more series that sum meaningfully per x step.

## When NOT to use

- Do not use for precise magnitude comparison → use `BarChart` or `LineChart` instead.
- Do not use for part-to-whole at one snapshot → use `DonutChart` instead.
- Do not use for per-row stacked totals with long category labels → use `HorizontalStackedBarChart` instead.
- Do not use with only one or two series — streamgraphs add little over `AreaChart`.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `data` | `ChartDataPoint[]` | Same model as `LineChart`; values per series sum per row for stream baseline |
| `xKey` | `string` | Ordered category (typically time) |
| `series` | `ChartSeries[]` | Layer order follows array order |
| `height` | `number` | Default `260` |
| `state` | `ChartState` | Standard family states |
| `aria-label` | `string` | Name the flowing composition |

Shared contract: `specs/organisms/charts.md`.

## Examples

~~~tsx
<StreamgraphChart
  data={monthlyMix}
  xKey="month"
  series={[
    { key: 'inbound', label: 'Inbound' },
    { key: 'outbound', label: 'Outbound' },
    { key: 'resolved', label: 'Resolved' },
  ]}
  aria-label="Ticket mix over time"
/>
~~~
