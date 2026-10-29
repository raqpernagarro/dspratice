{% raw %}
# Pattern: Data page
<!--
Version: 1.0.2
Date: 2026-07-27
-->

A page whose primary content is a tabular list of records. Used for Projects, Tasks, and People in WorkScope.

---

## Assembly

```
AppShell
├── header: Navbar (variant="title")
├── sidebar: Sidebar                              ← section recipes: Sidebar.spec.md
└── children (main area — padding already built in)
    ├── SectionHeader (size="large")          ← page title
    ├── Toolbar (variant="filter-bar")        ← search + filters, optional
    ├── DataTable                             ← always full-width, direct child
    │   ├── DataTableHeaderCell (internal)
    │   ├── DataTableCell (internal)
    │   ├── Checkbox (internal, row selection)
    │   └── Pagination (internal, optional)
    └── BulkActionBar (positioned wrapper)    ← only when rows are selected
```

---

## Rules

### Layout
- `DataTable` is always a direct child of the AppShell main area. Never inside a `Card`, a padded wrapper, or any intermediate container.
- `SectionHeader` is always a direct child of the AppShell main area. Never inside a padded wrapper.
- AppShell's main area already applies `padding: var(--space-md)` — never add a wrapper div with additional padding.
- The `Toolbar` filter bar goes between `SectionHeader` and `DataTable`. It is outside the `DataTable` component — never inside it.
- `BulkActionBar` positions absolutely over the table via a `position: relative` wrapper around `DataTable`. See LCB-06b in `AI.md`.

### DataTable
- Always use `DataTable` with column definitions and row objects. Never build a native `<table>`.
- Always use the `render` prop for cells that need DS components (`Tag`, `ProgressBar`, `AvatarGroup`, `Avatar`, `Badge`).
- Always put the record `id` in `cells` when a column `render` callback needs to identify or open a row — the second argument to `render` is `cells`, not the full row object.
- Never wrap `DataTable` in `Card`.
- Never add a `Card` header above `DataTable` as a section title — use `SectionHeader` instead.

### List and detail navigation
When a row click opens a full detail view (not a drawer), implement navigation at the app shell level — see [appshell.md](../organisms/appshell.md) and NAV-05a in `AI.md`.

- Always use `Navbar variant="title"` on the list page and `Navbar variant="breadcrumbs"` on the detail page.
- Always lift selected-entity state to the app shell — never swap list and detail views inside the list page component.
- Always pass the selected entity to the detail component as a prop from shell state.
- Always keep the parent sidebar item selected on both list and detail routes.
- Never add an in-page back button on a detail view when breadcrumb navigation is in the navbar.
- Never repeat the entity name in a `SectionHeader` on a detail page when it already appears as the current breadcrumb item.

For row-click detail panels that stay on the list page, use the [detail drawer](./detail-drawer.md) pattern instead.

### Toolbar (filter bar)
- Always use `variant="filter-bar"` for the above-table filter row and for filtered kanban board views in the same feature area — it has no elevation shadow.
- Never use `variant="default"` on top of a list or section — it casts an upward shadow meant only for bottom bars.
- Always let a view switcher `SegmentControl` in the filter bar hug its content — never set `fullWidth` or a fixed width on it.
- Pass view switcher and `SearchBar` as `leftActions`.
- A filter bar looks like a bottom bar — same background, padding and compact single row, minus the upward shadow. Its `SearchBar` is always `variant="ghost"` with `aria-label` — never a labeled field with a helper row (`Toolbar` forces ghost).
- Pass filter controls (`PopoverMenu` multi-select triggers) as `rightActions` — one trigger per multi-value dimension.
- Use the MultiSelectAnchored pattern: `PopoverMenu` rich variant, checkbox-cell sections, Confirm/Cancel bottom bar, `anchorRef` on `PopoverMenu`.
- Never model multi-value filters as a single `Select` with an "All" sentinel empty option — empty checkbox selection means no filter applied.
- Always set `showLeadingIcon: false` and `showTrailingIcon: false` on checkbox-cell items when no icons are needed.
- Match the slot structure of sibling pages in the same feature area — view switcher and search on the left, filters on the right.
- The `Toolbar` is not part of `DataTable` — it is a sibling above it.

### Navbar
- Always `variant="title"` on top-level data pages (Projects, Tasks, People).
- Primary CTA (e.g. "New project") always in `rightActions`. Never inside the page content area.

### BulkActionBar
- Only render when `selectedCount > 0`.
- Action labels must be count-aware: `"Delete 3"` not `"Delete"`.
- `onDismiss` must clear the entire selection.
- `BulkActionBar` only accepts `className` — all positioning goes on the wrapper div.

---

## Correct assembly

```tsx
<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell
    header={
      <Navbar
        variant="title"
        title="Projects"
        rightActions={<Button variant="primary" size="md">New project</Button>}
      />
    }
    sidebar={<Sidebar ... />}
  >
    <SectionHeader title="Projects" size="large" />

    <Toolbar
      variant="filter-bar"
      leftActions={
        <>
          <SearchBar variant="ghost" placeholder="Search projects" aria-label="Search projects" />
          {/* StatusFilterTrigger, AssigneeFilterTrigger — PopoverMenu MultiSelectAnchored per dimension */}
        </>
      }
    />

    <div style={{ position: 'relative' }}>
      <DataTable columns={columns} rows={rows} />
      {selectedCount > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 'var(--space-md)',
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          <BulkActionBar
            selectedCount={selectedCount}
            actions={bulkActions}
            onDismiss={handleClearSelection}
          />
        </div>
      )}
    </div>
  </AppShell>
</div>
```

---

## Anti-patterns

```tsx
// ❌ DataTable inside Card
<Card title="Projects">
  <DataTable columns={columns} rows={rows} />
</Card>

// ❌ Extra wrapper with padding inside AppShell children
<AppShell ...>
  <div style={{ padding: 'var(--space-md)' }}>
    <SectionHeader title="Projects" size="large" />
    <DataTable ... />
  </div>
</AppShell>

// ❌ Native table instead of DataTable
<table>
  <thead>...</thead>
  <tbody>...</tbody>
</table>

// ❌ Toolbar inside DataTable
<DataTable
  toolbar={<SearchBar />}   // DataTable has no toolbar prop
  columns={columns}
  rows={rows}
/>

// ❌ Primary CTA inside content area
<SectionHeader
  title="Projects"
  trailingControl={<Button variant="primary">New project</Button>}
/>
// Primary CTA belongs in Navbar rightActions only

// ❌ BulkActionBar without count-aware labels
<BulkActionBar
  selectedCount={3}
  actions={[{ label: 'Delete', onClick: handleDelete }]}  // should be "Delete 3"
  onDismiss={handleClearSelection}
/>

// ❌ Detail view swapped inside the list page component
function ProjectsPage() {
  const [selected, setSelected] = useState(null);
  if (selected) return <ProjectDetail project={selected} onBack={() => setSelected(null)} />;
  return <ProjectsList onSelect={setSelected} />;
}
// Lift selection state to the app shell and render separate list and detail views there

// ❌ In-page back button on a detail view
<Button variant="ghost" onClick={goBack}>All projects</Button>
// Back navigation belongs in Navbar breadcrumbs only

// ❌ Duplicate entity title in SectionHeader on detail page
<Navbar variant="breadcrumbs" breadcrumbItems={[..., { label: 'Brand identity redesign', variant: 'current' }]} />
<SectionHeader title="Brand identity redesign" size="large" />
// The breadcrumb is the page title — use the body for metadata and content
```

---

## Atom → molecule → organism chain

| Atom | Used by | Role |
|---|---|---|
| `DataTableHeaderCell` | `DataTable` | Column header with sort, filter, resize, reorder |
| `DataTableCell` | `DataTable` | Row cell with fieldType rendering |
| `Checkbox` | `DataTable` | Row and select-all selection |
| `Pagination` | `DataTable` | Page controls at bottom of table |
| `Button` | `BulkActionBar` | Bulk action triggers |
| `ButtonGroup` | `BulkActionBar` | Groups actions with dismiss |
| `Button` / `Checkbox` | `Toolbar` | Filter bar controls — auto-sized by Toolbar |

`BulkActionBar` is a sibling molecule to `DataTable`, not a child. It is positioned over the table by a wrapper, never rendered inside `DataTable`.

---

## Related patterns

- [form-page.md](./form-page.md) — when the page primary action is a form, not a table
- [detail-drawer.md](./detail-drawer.md) — row click opens a `Drawer` with `DataListCell` metadata
- [kanban-board.md](./kanban-board.md) — status-grouped board view with the same filter bar slot structure
- [dashboard.md](./dashboard.md) — when the page shows summary stats, not a full list
{% endraw %}
