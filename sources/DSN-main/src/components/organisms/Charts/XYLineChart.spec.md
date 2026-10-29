# XYLineChart

**Tier:** organism
**Location:** `src/components/organisms/Charts/XYLineChart.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

An interactive multi-series line chart built on `@visx/xychart` with animated axes, grid, lines, and a pointer tooltip (vertical crosshair + series glyphs).

## When to use

- Use when readers need to inspect exact values at a category via hover — the only chart in the family with a built-in tooltip.
- Use for multi-series comparison where pointer feedback is part of the workflow (dashboard drill-down, ops monitoring).
- Use when animated line transitions on data updates are acceptable (respects global reduced-motion via tokens).

## When NOT to use

- Do not use when a static, print-friendly chart is enough → use `LineChart` instead (lighter, no animation).
- Do not use when the user must select a sub-range of a long series → use `BrushLineChart` instead.
- Do not use when filled area emphasis is required → use `AreaChart` instead.
- Do not use for bars, donuts, heatmaps, or stacked horizontal bars — pick the matching family member.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `data` | `ChartDataPoint[]` | Same cartesian row model as `LineChart` |
| `xKey` | `string` | Band scale category field |
| `series` | `ChartSeries[]` | `label` becomes `dataKey` for `AnimatedLineSeries` |
| `height` | `number` | Default `260`; passed to `XYChart` |
| `state` | `ChartState` | Hides plot and shows state view when not `'default'` or data empty |
| `aria-label` | `string` | Root `role="img"` label |

**Known limitation:** `AnimatedAxis` tick labels may use library defaults when stroke tokens are set but tick label props are unset — structural fix tracked as a component session (see family spec open items).

Shared contract: `specs/organisms/charts.md`.

## Examples

~~~tsx
<XYLineChart
  data={comparisonData}
  xKey="month"
  series={[
    { key: 'current', label: 'Current period' },
    { key: 'previous', label: 'Previous period' },
  ]}
  aria-label="Interactive revenue comparison"
/>
~~~
