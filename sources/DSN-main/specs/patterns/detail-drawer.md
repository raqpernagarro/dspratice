{% raw %}
# Pattern: Detail drawer
<!--
Version: 1.0.0
Date: 2026-07-27
-->

A `Drawer` that opens from a table row click, board card click, or chart or timeline interaction to show read-only record metadata and secondary actions. Used when exploring a record without leaving the current view.

---

## Assembly

```
DataTable, kanban board, chart, or timeline
└── item onClick → opens Drawer
    Drawer
    ├── header: SectionHeader (built in via title prop)
    ├── content: full-bleed list wrapper
    │   └── DataListCell × N (icon, title, value — stacked, full-width)
    └── bottom bar: Toolbar (optional, via bottomBar props)
        └── rightActions: secondary actions
```

---

## Rules

### Drawer
- Always use `Drawer` for read-only entity detail panels. Never open a `Modal` from a row or card click — `Modal` requires a decision before continuing; `Drawer` is for exploration.
- Always open read-only entity detail using `DataListCell` rows with icon, title, and value.
- Set `title` on the `Drawer` — it renders `SectionHeader` internally.
- Use `showBottomBar={false}` when there are no footer actions.
- Use `bottomBarRightActions` for secondary actions (edit, delete). Never mount a standalone `Toolbar` inside drawer content.

### DataListCell layout
- `.dsn-drawer-content` is full-bleed; `DataListCell` rows pick up the same horizontal inset as the header and bottom bar (`--space-md`).
- Stack cells directly in drawer content — no negative-margin wrapper.
- Never cap the `DataListCell` stack with `max-width` — always full panel width.
- Prefer `alignment="inline"` so values share one column; use `alignment="vertical"` only when the value truly needs a stacked block.

```tsx
<DataListCell alignment="inline" title="Status" description="In progress" showActions={false} />
<DataListCell alignment="inline" title="Assignee" description="Alex Chen" showActions={false} />
```

### DataListCell content
- Use `alignment="inline"` for label–value pairs on the same row.
- Use `alignment="vertical"` for label above value (long values, rich content).
- Always pass a meaningful Lucide icon via the `icon` prop and set `showActions={false}` for read-only metadata rows.
- Never use raw `<div>` pairs for label–value metadata — always `DataListCell`.
- **People:** use the `content` slot with `Avatar` (`variant="profile"`, `fill="picture"` or `"initials"`) plus the name — same pattern as `DataTableCell` `fieldType="single-user"`.
- **Companies:** use `Avatar` with `variant="organization"` and `fill="picture"` when a logo URL exists, otherwise `"initials"`, plus the company name.
- **Status:** `Tag` in `content`. **Dates, budget, plain text:** `description`. **Progress:** `ProgressBar` in `content`. **Teams:** `AvatarGroup` in `content`.

### Actions inside Drawer
- Secondary actions (edit, delete, archive) go in `bottomBarRightActions`.
- Destructive actions (delete) trigger an `AlertDialog` — never execute directly from the drawer.
- Never put a primary CTA inside a `Drawer` — that belongs in Navbar.

### Trigger
- Row click, board card click, and chart or timeline item click all open the same drawer — wire every surface to one shared detail state.
- The clicked item is the trigger — never a separate "View" button inside the cell or card.
- Close drawer on overlay click and Escape by default.
- Focus returns to the triggering element on close.

---

## Correct assembly

```tsx
// Table with drawer trigger
<DataTable
  columns={columns}
  rows={rows}
  onRowClick={(row) => setSelectedRow(row)}
/>

<Drawer
  open={Boolean(selectedRow)}
  title={selectedRow?.name ?? ''}
  onClose={() => setSelectedRow(null)}
  showBottomBar
  bottomBarRightActions={
    <>
      <Button variant="ghost" size="md" onClick={handleEdit}>Edit</Button>
      <Button variant="ghost" size="md" destructive onClick={handleDeleteIntent}>Delete</Button>
    </>
  }
>
  <>
    <DataListCell alignment="inline" title="Status" description={selectedRow?.status} showActions={false} />
    <DataListCell alignment="inline" title="Assignee" description={selectedRow?.assignee} showActions={false} />
    <DataListCell alignment="inline" title="Due date" description={selectedRow?.dueDate} showActions={false} />
    <DataListCell alignment="inline" title="Description" description={selectedRow?.description} showActions={false} />
  </>
</Drawer>

{/* Destructive confirmation */}
<AlertDialog
  open={showDeleteConfirm}
  title="Delete project"
  description="This cannot be undone."
  confirmLabel="Delete"
  onConfirm={handleDeleteConfirm}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

---

## Anti-patterns

```tsx
// ❌ Modal instead of Drawer for row detail
<DataTable rows={rows} onRowClick={() => setModalOpen(true)} />
<Modal open={modalOpen} title="Project details">
  {/* metadata */}
</Modal>
// Use Drawer for exploration; Modal only when a decision is required

// ❌ DataListCell stack without full-bleed wrapper
<Drawer title="Project details">
  <DataListCell title="Status" description="In progress" />  // will be indented by drawer content inset
</Drawer>

// ❌ Max-width cap on DataListCell stack
<Drawer title="Project details">
  <div style={{ maxWidth: '400px' }}>                        // never cap — use full panel width
    <DataListCell title="Status" description="In progress" style={{ width: '100%' }} />
  </div>
</Drawer>

// ❌ Raw div pairs for metadata
<Drawer title="Project details">
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span>Status</span>
    <span>In progress</span>
  </div>
</Drawer>
// Always use DataListCell

// ❌ Destructive action without confirmation
<Button variant="ghost" destructive onClick={handleDeleteImmediately}>Delete</Button>
// Destructive actions must trigger AlertDialog first

// ❌ Standalone Toolbar inside drawer content
<Drawer title="Project details" showBottomBar={false}>
  <DataListCell ... />
  <Toolbar rightActions={<Button variant="ghost">Edit</Button>} />  // use bottomBarRightActions
</Drawer>
```

---

## Atom → molecule → organism chain

| Atom / molecule | Used by | Role |
|---|---|---|
| `SectionHeader` | `Drawer` (built-in header) | Drawer title — rendered via `title` prop |
| `Toolbar` | `Drawer` (built-in bottom bar) | Footer actions — rendered via `bottomBarRightActions` prop |
| `DataListCell` | Drawer content | Metadata rows — always in full-bleed wrapper |
| `Button` | `Toolbar` (auto-sized) | Action triggers |

`SectionHeader` and `Toolbar` are structural to `Drawer` — always use the Drawer's built-in props, never mount them manually inside content.

---

## Related patterns

- [data-page.md](./data-page.md) — the table that triggers the drawer
- [kanban-board.md](./kanban-board.md) — board cards that trigger the same drawer pattern
- [form-page.md](./form-page.md) — when edit opens a full page, not a drawer
- [modal-form.md](./modal-form.md) — when a short form appears in a Modal
{% endraw %}
