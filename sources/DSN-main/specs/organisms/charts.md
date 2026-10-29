# Charts — family contract

**Tier:** organism (family)
**Location:** `specs/organisms/charts.md`
**Version:** 1.0.0
**Implementation:** `src/components/organisms/Charts/Charts.tsx`

## What it is

A Visx-based chart family for dashboards and analytics surfaces — line, area, bar, stacked bar, streamgraph, donut, heatmap, brush-range line, and XY line variants — plus `ChartCard`, a `Card` wrapper with chart-specific inset. Per-chart selection guidance lives in co-located `*.spec.md` files next to `Charts.tsx`; this document is the shared contract.

## Shared anatomy

Every chart primitive (except `ChartCard`) shares the same root structure:

- **Container** — `.dsn-chart` root (`width: 100%`, `min-width: 0`). Parent layout owns horizontal space; the chart fills it.
- **Surface** — `.dsn-chart-surface` borderless, transparent plot area (no border, radius, padding or fill — inside `ChartCard` it must never read as a nested card) with `height` from the `height` prop (default varies by chart). Charts are responsive: the surface is measured with a `ResizeObserver` and the SVG is drawn at the container's real pixel width (scales, ticks and bars recompute on resize; labels stay 12px — nothing is stretched). `XYLineChart` gets the same behaviour from visx `XYChart`.
- **Axes** — Cartesian charts render bottom (category or linear) and left axes styled with `--color-border-dataviz-axis`, `--color-foreground-dataviz-label`, and `--color-border-dataviz-grid` for grid lines. `StreamgraphChart` renders a bottom axis only.
- **Legend** — **No chart except `DonutChart` ships a built-in legend.** Multi-series cartesian charts do not render a legend; pair with external copy, a `SectionHeader` description, or dashboard context. `DonutChart` renders `.dsn-chart-legend` below the plot.
- **Tooltip** — Only `XYLineChart` ships an interactive tooltip (`@visx/xychart` `Tooltip` with vertical crosshair and series glyphs). All other charts are static SVG — no hover tooltip. Do not expect crosshair or pointer tooltips on `LineChart`, `AreaChart`, `BarChart`, etc.

## Theming — dataviz tokens only

All stroke, fill, grid, axis, label, and tooltip colors resolve through `--color-{background|border|foreground}-dataviz-*` custom properties defined in `tokens.css`. Series colors cycle `--color-background-dataviz-1` through `--color-background-dataviz-8` unless a series or slice sets an explicit `color` prop (also a dataviz token).

- ✅ `stroke: var(--color-background-dataviz-1)` · `fill: var(--color-border-dataviz-grid)` · `color: var(--color-foreground-dataviz-label)`
- ❌ Generic semantic tokens (`--color-foreground-neutral-primary`, `--color-background-accent-strong-default`, status tokens) for series, fills, or axes
- ❌ Hardcoded hex or rgba in consuming apps on chart SVG nodes

Charts respect light/dark mode via token values — never add local CSS overrides on `.dsn-chart` or SVG children in consuming apps.

### Black-render prevention (critical)

Chart SVG `stroke` and `fill` attributes are set to `var(--color-{background|border|foreground}-dataviz-*)`. **If the consuming app does not load the library token CSS, those custom properties do not resolve and SVG paints fall back to black.**

**Required import** (minimum for charts to render correctly):

```tsx
// main.tsx — before any app CSS that might override chart surfaces
import 'ds-ngr/tokens.css'
```

For full layout parity with Storybook, also import `ds-ngr/global.css` and `ds-ngr/style.css` per [Setup — mandatory CSS imports](../../AI.md#setup--mandatory-css-imports). **No theme provider is required** — tokens apply from `:root` / `[data-theme="dark"]` once `tokens.css` is loaded.

## Sizing and responsiveness

| Responsibility | Owner |
|----------------|-------|
| Horizontal width | **Parent** — place the chart in a fluid grid/flex cell (`width: 100%`, `min-width: 0`). The chart root is `width: 100%`. |
| Plot height | **Chart** — `height` prop sets `.dsn-chart-surface` inline height (defaults: `240`–`300` depending on variant). |
| Width | **Chart** — fills its container and re-draws at the measured width (`640` is only the pre-measure fallback). Do not set fixed pixel widths on the chart root; size the parent instead. |

Never add `padding`, `margin`, or `gap` directly on a chart primitive — use wrapper elements with `--space-*` tokens for spacing between charts.

## Empty, loading, and error states

All chart primitives accept `state?: 'default' | 'loading' | 'empty' | 'error'` (default `'default'`).

| `state` | Behavior |
|---------|----------|
| `'default'` | Renders the plot when `data` (and `series` where required) are non-empty; otherwise shows the empty state view. |
| `'loading'` | Replaces plot with `SkeletonLoading type="card"` inside the surface (`aria-busy="true"`, `aria-live="polite"`). |
| `'empty'` | Centered message (`emptyMessage`, default `"No data available."`). |
| `'error'` | Centered alert (`errorMessage`, default `"Unable to load chart data."`, `role="alert"`). |

Customize copy via `emptyMessage`, `errorMessage`, and `loadingLabel`. Set `aria-label` on the chart root for accessible naming (`role="img"`).

## Reduced motion

`XYLineChart` uses `@visx/xychart` animated axes, grid, line series, and tooltip transitions. Global `prefers-reduced-motion: reduce` zeroes `--motion-transition-*` tokens in `tokens.css`, which Visx animation paths consume where wired to those durations. Do not add per-chart `prefers-reduced-motion` overrides in consuming apps — rely on token CSS.

Static charts (`LineChart`, `BarChart`, `AreaChart`, etc.) have no enter/exit animation.

## ChartCard — dashboard wrapper

`ChartCard` extends `Card` with chart-specific content padding (`.dsn-chart-card .dsn-card-content` uses `var(--space-lg)`).

- ✅ **Dashboard surfaces** — wrap charts in `ChartCard` with `title`, optional `description`, and `showBottomBar` / footer actions as needed. This is the sanctioned dashboard pattern (see `InCard` / `LineInCard` stories).
- ✅ **Layout slots with existing context** — bare chart primitives are allowed when the parent already provides chrome (e.g. drawer bodies, embedded analytics panels, comparison layouts).
- ❌ **Do not infer the DataTable rule for charts** — `DataTable` is never wrapped in `Card`; **charts may and often should use `ChartCard` on dashboards.**

Pass standard `CardProps` (`title`, `description`, `showBottomBar`, `bottomBarRightActions`, etc.) to `ChartCard`; place exactly one chart primitive as `children`.

## Chart selection (index)

Read the co-located spec before choosing a variant:

| Component | Spec |
|-----------|------|
| `LineChart` | `src/components/organisms/Charts/LineChart.spec.md` |
| `AreaChart` | `src/components/organisms/Charts/AreaChart.spec.md` |
| `XYLineChart` | `src/components/organisms/Charts/XYLineChart.spec.md` |
| `BrushLineChart` | `src/components/organisms/Charts/BrushLineChart.spec.md` |
| `BarChart` | `src/components/organisms/Charts/BarChart.spec.md` |
| `HorizontalStackedBarChart` | `src/components/organisms/Charts/HorizontalStackedBarChart.spec.md` |
| `DonutChart` | `src/components/organisms/Charts/DonutChart.spec.md` |
| `HeatmapChart` | `src/components/organisms/Charts/HeatmapChart.spec.md` |
| `StreamgraphChart` | `src/components/organisms/Charts/StreamgraphChart.spec.md` |
| `ChartCard` | `src/components/organisms/Charts/ChartCard.spec.md` |

## Common mistakes

1. **Charts render all black** — consuming app missing `import 'ds-ngr/tokens.css'`; SVG `var(--color-{background|border|foreground}-dataviz-*)` unresolved → black fills/strokes. See [Black-render prevention](#black-render-prevention-critical).
2. **Expecting a legend on multi-series line/bar charts** — only `DonutChart` includes a built-in legend; add external labeling or use `DonutChart` for part-to-whole with few slices.
3. **Expecting tooltips on static charts** — only `XYLineChart` has pointer tooltips; use it when hover inspection is required.
4. **Fixed pixel width on the chart root** — parent must be fluid; chart scales via `width: 100%`.
5. **Semantic or status tokens for series color** — use `--color-{background|border|foreground}-dataviz-*` only (family rule above).
6. **Wrapping `DataTable` logic applied to charts** — charts are not tables; use `ChartCard` on dashboards when appropriate.

## Open items (out of scope for this spec)

- **Accessibility patrol** — SC 1.1.1 text alternatives and SC 1.4.1 color-only encoding for the chart family are not yet audited; schedule a dedicated `ds-a11y-patrol` session.
- **XYLineChart tick labels** — `@visx/xychart` `AnimatedAxis` may render library-default tick label styling when axis stroke tokens are present but tick label props are unset. Candidate **component session** (structural fix), not a documentation workaround. See `XYLineChart.spec.md`.
