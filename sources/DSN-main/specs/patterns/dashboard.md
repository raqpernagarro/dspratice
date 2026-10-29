{% raw %}
# Pattern: Dashboard

A page whose primary content is a summary of key metrics and activity. Used for the WorkScope Dashboard page.

---

## Assembly

```
AppShell
├── header: Navbar (variant="title")
├── sidebar: Sidebar                              ← section recipes: Sidebar.spec.md
└── children (main area — padding already built in)
    ├── SectionHeader (size="large")              ← page title
    ├── stat grid                                 ← KPI summary cards
    │   └── Card × N (showBottomBar={false})
    │       └── content: Stat atom or KPI pattern
    ├── SectionHeader (size="medium")             ← section divider, optional
    └── ChartCard × N                             ← charts on dashboard
        └── content: chart primitive (LineChart, DonutChart, etc.)
```

---

## Rules

### Layout
- AppShell's main area already applies `padding: var(--space-md)` — never add a wrapper div with additional padding.
- `SectionHeader` (page title) is always a direct child of the AppShell main area.
- Stat grid uses CSS grid: `gridTemplateColumns: 'repeat(N, 1fr)'` with `gap: var(--space-md)`. Never fixed pixel widths on grid children.
- Always `width: 100%` on the grid container.
- Never use `minWidth` in `px` on any grid or flex container — this causes horizontal scroll.

### Stat cards (KPI pattern)
- Always use `<Card>` as the container. Never a raw div with manual border or shadow.
- Always set `showHeader` and `title` on KPI cards. Never body-only cards.
- Always `showBottomBar={false}` on KPI cards — they have no footer actions.
- Use `var(--font-size-display-sm)` and `var(--font-weight-semibold)` for the metric value. Never raw `px`.
- Use `var(--color-foreground-success-strong)` for positive trends, `var(--color-foreground-interactive-destructive-default)` for negative. Never hardcode colors.
- Never use the `Stat` atom directly for KPI cards — use the full `Card` + KPI pattern from `AI.md`.

### Charts
- Always wrap chart primitives in `ChartCard` on the dashboard. `ChartCard` extends `Card` with chart-specific content padding.
- Always set `title` on chart cards; use `showBottomBar` and footer actions when export or drill-down is needed.
- Always use `var(--color-{background|border|foreground}-dataviz-*)` tokens for all chart colors. Never semantic tokens or hex.
- Consuming apps must `import 'ds-ngr/tokens.css'` — without it, chart SVG paints black. See `specs/organisms/charts.md`.
- Charts render dark-mode correctly via tokens — never add local CSS overrides on chart elements.

### Navbar
- Always `variant="title"` on the Dashboard page. Never `variant="breadcrumbs"`.
- Never show a back arrow on the Dashboard.
- Primary CTA in `rightActions` if needed. Never inside content.

### Section headers
- Use `size="large"` for the page-level title only.
- Use `size="medium"` to introduce named sub-sections (e.g. "Recent activity", "Overview").
- Never use a `Card` header as a section title — use standalone `SectionHeader`.

---

## Correct assembly

```tsx
<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell
    header={<Navbar variant="title" title="Dashboard" />}
    sidebar={<Sidebar ... />}
  >
    <SectionHeader title="Dashboard" size="large" />

    {/* KPI stat grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 'var(--space-md)',
      width: '100%',
    }}>
      <Card title="Active projects" showBottomBar={false}>
        <div style={{
          fontSize: 'var(--font-size-display-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-foreground-neutral-primary)',
        }}>14</div>
        <div style={{
          fontSize: 'var(--font-size-body-sm)',
          color: 'var(--color-foreground-success-strong)',
          marginTop: 'var(--space-2xs)',
        }}>+2 this week</div>
      </Card>
      {/* ... more stat cards */}
    </div>

    {/* Charts section */}
    <SectionHeader title="Overview" size="medium" />
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-md)',
      width: '100%',
    }}>
      <Card title="Tasks by status" showBottomBar={false}>
        <Charts type="bar" data={tasksData} />
      </Card>
      <Card title="Project progress" showBottomBar={false}>
        <Charts type="line" data={progressData} />
      </Card>
    </div>

  </AppShell>
</div>
```

---

## Anti-patterns

```tsx
// ❌ Raw div for KPI card instead of Card
<div style={{ border: '1px solid var(--color-border-neutral-primary)', borderRadius: 'var(--card-radius)', padding: 'var(--space-md)' }}>
  <span>14</span>
</div>

// ❌ Body-only KPI card
<Card showHeader={false} showBottomBar={false}>
  <span>14</span>
</Card>

// ❌ Charts without Card chrome
<Charts type="bar" data={tasksData} />     // Charts needs Card wrapper on dashboard

// ❌ Hardcoded dataviz color in chart
<Charts type="bar" data={tasksData} colors={['#1D9E75', '#F8485E']} />  // use var(--color-{background|border|foreground}-dataviz-*)

// ❌ Fixed pixel grid causing horizontal scroll
<div style={{ display: 'grid', minWidth: '900px', gridTemplateColumns: 'repeat(4, 200px)' }}>

// ❌ Padding wrapper inside AppShell
<AppShell ...>
  <div style={{ padding: 'var(--space-md)' }}>
    <SectionHeader title="Dashboard" size="large" />
  </div>
</AppShell>

// ❌ Card header as section title
<Card title="Overview" showBottomBar={false}>
  <Charts type="bar" data={tasksData} />
  <Charts type="line" data={progressData} />
</Card>
// Use SectionHeader + individual chart cards instead
```

---

## Atom → molecule → organism chain

| Atom | Used by | Role |
|---|---|---|
| `SectionHeader` | `Card` (built-in header) | Card title |
| `Toolbar` | `Card` (built-in bottom bar) | Card footer — set `showBottomBar={false}` on KPI/chart cards |
| `SkeletonLoading` | `Card` (loading prop) | Loading state — use `loading={true}` on Card, not manual skeletons |

`Charts` is an organism — it manages its own internal structure. Never replicate chart layout manually. Wrap in `Card` for chrome.

---

## Related patterns

- [data-page.md](./data-page.md) — when the page primary content is a full record list
- [form-page.md](./form-page.md) — when the page primary action is creating or editing a record
{% endraw %}
