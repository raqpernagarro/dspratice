# Patterns — index
<!--
Version: 1.0.1
Date: 2026-07-27
-->

Component relationship maps and assembly contracts for WorkScope pages and flows.

Read the relevant pattern spec before building any page. Each spec defines the correct assembly (what goes where), the atom → molecule → organism chain, and the anti-patterns agents have historically produced.

---

## Available patterns

| Pattern | File | Used for | Template |
|---|---|---|---|
| Data page | [data-page.md](./data-page.md) | Projects, Tasks, People — tabular record lists | `templates/data-page.jsx` |
| Kanban board | [kanban-board.md](./kanban-board.md) | Status-grouped board views — tasks, projects, workflow records | `templates/kanban-board.jsx` |
| Form page | [form-page.md](./form-page.md) | New record, edit record — full-page forms | `templates/form-page.jsx` |
| Dashboard | [dashboard.md](./dashboard.md) | Dashboard — KPI stats and charts | `templates/dashboard.jsx` |
| Detail drawer | [detail-drawer.md](./detail-drawer.md) | Row click → Drawer with DataListCell metadata | `templates/detail-drawer.jsx` |

Each template is the runnable reference implementation of its spec — start from it, then adapt data and copy. When a spec changes, update its template in the same change (`npm test` checks every template against the prototype rules).

---

## Shared components — where they live

Two components appear in multiple organisms. Always use the organism's built-in props — never mount these manually inside content areas.

### SectionHeader
| Context | How to use |
|---|---|
| AppShell main area (page title) | Direct child — `<SectionHeader title="..." size="large" />` |
| AppShell main area (section divider) | Direct child — `<SectionHeader title="..." size="medium" />` |
| Inside `Card` | Via Card props: `title`, `headerSize`, `headerLeadingControl`, `headerTrailingControl` |
| Inside `Modal` | Via Modal props: `title`, `headerSize` |
| Inside `Drawer` | Via Drawer props: `title` |

Never mount `SectionHeader` manually inside `Card`, `Modal`, or `Drawer` content — it duplicates the built-in chrome.

### Toolbar
| Context | How to use |
|---|---|
| On top of any list or section | Always `variant="filter-bar"` — looks like a bottom bar (same chrome, compact row, ghost `SearchBar`) minus the elevation shadow — `variant="default"` casts an upward shadow meant only for bottom bars |
| Above `DataTable` (filter bar) | Standalone — `<Toolbar variant="filter-bar" leftActions={...} />` |
| Above kanban board (filter bar) | Standalone — `<Toolbar variant="filter-bar" leftActions={...} rightActions={...} />` — same slot structure as data pages |
| Inside `Card` (bottom bar) | Via Card props: `bottomBarLeftActions`, `bottomBarRightActions` |
| Inside `Modal` (bottom bar) | Via Modal props: `bottomBarLeftActions`, `bottomBarRightActions` |
| Inside `Drawer` (bottom bar) | Via Drawer props: `bottomBarLeftActions`, `bottomBarRightActions` |

Never mount `Toolbar` manually inside `Card`, `Modal`, or `Drawer` content — use the organism's bottom bar props.

---

## Exclusion rules — always enforced

These rules apply to every pattern without exception.

| Rule | Reason |
|---|---|
| `DataTable` is never wrapped in `Card` | DataTable is always full-width; Card clips and re-pads it |
| AppShell main area never gets a padding wrapper | AppShell already applies `var(--space-md)` — double-padding breaks SectionHeader overflow |
| Icons always from `lucide-react`, at the same version `ds-ngr` uses | `ds-ngr` does not re-export icons; a mismatched version ships two copies of the icon set |
| `SectionHeader` never inside a padded parent | It is edge-to-edge and owns its own `padding-inline` |
| Primary CTA always in Navbar `rightActions` | Never inside Card, content area, or floating |
| `DataListCell` stacks in Drawer | Stack in `.dsn-drawer-content`; cells use `--space-md` inset to match header |

---

## Relationship map

```
AppShell
├── Sidebar
│   ├── SidebarMenuSelector  [molecule]
│   │   ├── Avatar           [atom]
│   │   └── Badge            [atom]
│   ├── SectionHeader        [atom]
│   └── Separator            [atom]
├── Navbar                   [organism]
│   ├── Button               [atom]
│   ├── Avatar               [atom]
│   └── Badge                [atom]
└── main area (children)
    ├── SectionHeader        [atom]       ← page title, section dividers
    ├── Toolbar              [molecule]   ← filter bar above DataTable
    │   ├── Button           [atom]
    │   └── Checkbox         [atom]
    ├── DataTable            [organism]
    │   ├── DataTableHeaderCell [atom]
    │   ├── DataTableCell    [atom]
    │   ├── Checkbox         [atom]
    │   └── Pagination       [atom]
    ├── BulkActionBar        [molecule]   ← sibling to DataTable, positioned over it
    │   ├── Button           [atom]
    │   └── ButtonGroup      [atom]
    ├── Card                 [organism]
    │   ├── SectionHeader    [atom]       ← rendered via Card header props
    │   ├── Toolbar          [molecule]   ← rendered via Card bottomBar props
    │   │   ├── Button       [atom]
    │   │   └── Checkbox     [atom]
    │   └── SkeletonLoading  [atom]       ← via Card loading prop
    ├── Modal                [organism]
    │   ├── SectionHeader    [atom]       ← rendered via Modal header props
    │   ├── Toolbar          [molecule]   ← rendered via Modal bottomBar props
    │   └── Button           [atom]       ← close button, built-in
    └── Drawer               [organism]
        ├── SectionHeader    [atom]       ← rendered via Drawer title prop
        ├── Toolbar          [molecule]   ← rendered via Drawer bottomBar props
        └── DataListCell     [atom]       ← stacked directly in content
```
