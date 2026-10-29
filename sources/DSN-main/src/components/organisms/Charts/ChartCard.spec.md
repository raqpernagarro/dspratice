# ChartCard

**Tier:** organism
**Location:** `src/components/organisms/Charts/ChartCard.spec.md`
**Version:** 1.0.0
**Family spec:** `specs/organisms/charts.md`

## What it is

A `Card` wrapper with chart-specific content padding — the sanctioned container for charts on dashboard surfaces.

## When to use

- Use on **dashboard and analytics pages** when a chart needs a title, description, border, and optional footer actions (`showBottomBar`, `bottomBarRightActions`).
- Use when assembling the dashboard pattern: `SectionHeader` + grid of chart cards (see `specs/patterns/dashboard.md`).
- Use when the chart is a primary content unit alongside KPI cards.

## When NOT to use

- Do not require `ChartCard` in every context — **bare chart primitives are allowed** in layout slots that already provide chrome (drawer bodies, split panels, embedded widgets).
- Do not use as a generic box without a chart — use `Card` for non-chart content.
- Do not use to wrap `DataTable` — the DataTable-never-in-Card rule is unchanged and does not apply to charts.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `children` | `ReactNode` | Exactly one chart primitive (`LineChart`, `DonutChart`, etc.) |
| `title` / `description` | `string` | Dashboard header copy; pass through to underlying `Card` |
| `showBottomBar` | `boolean` | `true` when footer actions are needed (export, details) |
| `bottomBarRightActions` | `ReactNode` | Secondary actions in card footer |
| All other `CardProps` | — | `showHeader`, `headerSize`, `loading`, etc. |

Padding is owned by `ChartCard` (`.dsn-chart-card .dsn-card-content` uses `var(--space-lg)`). Do not add extra padding wrappers around the child chart.

Shared chart theming, token import, and state rules: `specs/organisms/charts.md`.

## Examples

~~~tsx
<ChartCard
  title="Pipeline overview"
  description="Current distribution by stage"
  showBottomBar
  bottomBarRightActions={<Button variant="secondary" size="md">More details</Button>}
>
  <DonutChart data={pipelineSlices} aria-label="Pipeline overview chart" />
</ChartCard>
~~~
