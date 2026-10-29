# DonutChart

**Tier:** organism
**Location:** `src/components/organisms/Charts/DonutChart.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

A part-to-whole donut (pie with inner radius) with a **built-in legend** below the plot — the only chart in the family that renders `.dsn-chart-legend`.

## When to use

- Use for composition at a single point in time with roughly **3–7 slices** (pipeline stages, status mix, allocation).
- Use when slice labels must appear in a legend without building external markup.
- Use when the total is meaningful as 100% of a single metric.

## When NOT to use

- Do not use with **many slices** (8+) — labels crowd the legend and slices become unreadable → use `BarChart` or `HorizontalStackedBarChart` instead.
- Do not use when comparing values across time → use `LineChart` or `BarChart` instead.
- Do not use when precise comparison between similar-sized slices is critical — bar charts outperform donuts for accuracy.
- Do not use for two-dimensional bin intensity → use `HeatmapChart` instead.
- Do not use cartesian `data` + `series` arrays — donut expects `ChartDonutSlice[]`.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `data` | `ChartDonutSlice[]` | `{ id, label, value, color? }` per slice |
| `innerRadius` / `outerRadius` | `number` | Defaults `56` / `84`; tune for thicker ring or larger plot |
| `height` | `number` | Default `240`; legend adds below surface |
| `state` | `ChartState` | Hides plot and legend when empty/loading/error |
| `aria-label` | `string` | Name the composition (e.g. pipeline stages) |

Shared contract: `specs/organisms/charts.md`.

## Examples

~~~tsx
<DonutChart
  data={[
    { id: 'new', label: 'New', value: 44 },
    { id: 'won', label: 'Won', value: 25 },
  ]}
  aria-label="Pipeline composition"
/>
~~~
