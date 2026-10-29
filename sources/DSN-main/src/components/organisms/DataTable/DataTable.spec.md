{% raw %}
# DataTable

**Tier:** organism
**Location:** `src/components/organisms/DataTable/DataTable.spec.md`
**Version:** 1.3.1
**Date:** 2026-07-27

## What it is

The standard component for displaying tabular data. Renders as a full-width HTML table with column-driven headers (sort, resize, drag-to-reorder, filter input) and row-driven cells (typed by `fieldType`), with optional row selection, pagination, column reordering/resizing, and custom cell rendering.

## When to use

- Use when the data is naturally row/column shaped — project lists, task boards rendered as rows, people directories, records with multiple attributes per item.
- Use when the dataset needs sorting, column filtering, column reordering/resizing, row selection, or pagination — these are built in and don't need to be hand-rolled.
- Use when cell content needs typed rendering (`tag`, `user`, `boolean`, `date`, `url`, `checkbox`) or a custom `render` function per column.

## When NOT to use

- Do not use when the layout is a single-column list of metadata per item → use stacked `DataListCell` components instead.
- Do not use when content is a card grid or Kanban-style board → use `Card` columns / documented board patterns instead.
- Do not use when you need static, non-interactive prose content rendered as a grid → use plain semantic HTML, not `DataTable`, since `DataTable` carries app-grid behavior (sticky/frozen column, drag handles) that is wrong outside an interactive data-grid context.

## Variant selection

### `fieldType` (per `DataTableColumnDef`)

Values map 1:1 to the Figma `Data table / Cell / Table cell` "Field type" property. Full value shapes and hover actions: [`DataTableCell.spec.md`](../../atoms/DataTableCell/DataTableCell.spec.md).

| Value | Figma | Use when |
|-------|-------|----------|
| `"main"` | Main | Primary record column (avatar + emphasized name); hover offers open / side panel |
| `"string"` | String | Read-only plain text |
| `"text"` / `"long-text"` | Text field (single line / long text) | Editable text |
| `"email"` / `"phone"` / `"address"` | Email / Phone number / Address | Contact data — hover adds mailto / call / copy actions |
| `"number"` | Number | Numeric values; pair with `align: "right"` |
| `"range"` | Range | `[min, max]` numeric range |
| `"date"` / `"datetime"` / `"month-year"` | Date / Date and time / Month and year | Pre-formatted date strings |
| `"single-choice"` / `"multi-choice"` | Single / Multi choice | Option values shown as text |
| `"tags-multi"` | Tags multi choice | Status/category values as coloured tags (legacy alias `"tag"`) |
| `"tags-single"` | Tags single choice | One status tag with dropdown affordance |
| `"tags-readonly"` | Tags read-only | Neutral, non-editable tags |
| `"single-user"` / `"multi-user"` | Single user or team / Multiple users or teams | Person/owner values (legacy alias `"user"`) |
| `"contact"` / `"contacts"` | Contact / Contacts (table) | People as pills — one, or several inline with `+N` overflow |
| `"url"` / `"url-readonly"` | URL / URL read-only | Link values |
| `"file"` | File (single) | One attached file name |
| `"boolean"` | Boolean | True/false flags |
| `"buttons"` | Buttons | Inline row actions (`{ label, icon?, onClick }[]`) |
| `"checkbox"` | Checkbox (row selection) | The row-selection column only — pair with `headerVariant: "checkbox"` |
| `"expand"` | Expand | Row-expand toggle column — `widthMode: "fixed"`, `width: 32`; handle `onCellAction` `action: "expand"` |
| `"icon"` | Icon | Single icon (Lucide component or element) |
| `"empty"` | Empty | Placeholder/no-value cell |

### `widthMode` (per `DataTableColumnDef`)

| Value | Use when |
|-------|----------|
| `"fixed"` | Column should hold an exact pixel `width` (set `width`) |
| `"hug"` | Column should size to its content |
| `"stretch"` | Column should absorb remaining table width (typically the last column) |

### `align` (per `DataTableColumnDef`)

| Value | Use when |
|-------|----------|
| `"left"` | Default for text content |
| `"center"` | Checkbox/selection column |
| `"right"` | Numeric values |

Never use `"contacts-list"` (Figma: Contacts (description list)) as a DataTable column — it only exists for description-list / data-display rows. In a table, use `"contacts"`.

## Numeric alignment (hard rule)

- `number`, `date`, `datetime`, `month-year`, `range` and `phone` columns always render with `font-variant-numeric: tabular-nums` — this is built into `DataTableCell` via `[data-field-type]` and applies automatically.
- No exceptions, no opt-out: do not add `font-variant-numeric` or manual number-alignment CSS in consuming app code, and do not add a prop/className to toggle it off.
- There is no separate `currency` field type — currency values use `fieldType: "number"` (format the currency string in a `render` function if needed) and get `tabular-nums` the same way.

## Spatial contract

- **Owns its padding:** yes — internal cell padding, header height, and row height are controlled by `DataTable.css` table tokens; do not add wrapper padding around it.
- **Owns its margin:** no — it does not space itself from siblings; place toolbar controls above and `Pagination` below using normal layout spacing.
- **Fills its container:** yes — the table renders at `width: 100%` with a computed `minWidth` from column widths, so it expects a full-width container, not a narrow column.
- **Notes:** the first non-selection column is always sticky/frozen (`lockedColumnIds` locks index 0), unless a column explicitly sets `frozen: true`, in which case that column is frozen instead — don't expect arbitrary columns to scroll out of view if they're first.

## Composition rules

- ✅ Can be used inside: a full-width content area, a page section, a tab panel.
- ❌ **Never place inside: `Card`** — `DataTable` is a standalone, full-width component that manages its own layout and spacing; wrapping it in a `Card` double-boxes it and breaks full-width layout. Render `DataTable` directly in the page/section.

```tsx
// Correct
<DataTable columns={columns} rows={rows} />

// Wrong — never do this
<Card>
  <DataTable columns={columns} rows={rows} />
</Card>
```

- ❌ Never combine with: hand-built `<table>` markup as a substitute or alongside — always express data through `columns`/`rows`, never raw HTML tables; custom `<table>` markup does not inherit DS table tokens or dark mode behavior.
- Column headers: sentence case always ("Due date" not "Due Date").
- Status columns: use `Tag` for status values — never plain text; use `fieldType: "tags-multi"` and a `render` function with semantic `Tag` variants when custom mapping is needed.
- Owner/user columns: use `Avatar` for person/owner values when possible via `fieldType: "single-user"` and a custom `render` when needed.
- Never hardcode colors inside `render` functions — use design tokens.
- Always put the record `id` in `cells` when a column `render` callback needs to identify or open a row — the second argument to `render` is the row's `cells` record, not the full `DataTableRow`; do not assume `row.id` is available unless `id` is included in `cells`.
- Pagination: pass a `pagination` prop (renders `Pagination` below the table automatically) — never render `Pagination` above the table or as a separate sibling above it.
- Toolbar controls (`SearchBar`, filter `Select`): render above `DataTable`, outside the component — `DataTable` has no per-column filter inputs, so filter `rows` yourself from those controls.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `columns` | `DataTableColumnDef[]` | Always required — defines header label, `fieldType`, width strategy, sortability, reorderability, alignment per column |
| `rows` | `DataTableRow[]` | Always required — each row is `{ id, cells: Record<columnId, value> }` |
| `columnOrder` | `string[]` | Set when columns must be reorderable by the user; pair with `onColumnOrderChange` to persist the new order |
| `selectedRowIds` / `onSelectedRowIdsChange` | `string[]` / `(ids) => void` | Set when rows are selectable; requires a column with `fieldType: "checkbox"` and `headerVariant: "checkbox"` |
| `sortState` / `onSortStateChange` | `DataTableSortState \| null` / `(next: DataTableSortState \| null) => void` | Set when any column has `sortable: true`; the component is controlled, not self-sorting. Callback receives `{ columnId, direction }` where `direction` is `'asc'` or `'desc'`, or `null` when sort is cleared |
| `filterState` / `onFilterStateChange` | `Record<string, string>` / handler | Deprecated — no effect; never set. Filter `rows` before passing them |
| `pagination` | `DataTablePaginationState` | Set when the dataset is paginated — renders `Pagination` below the table |
| `onCellAction` | `({ rowId, columnId, action, value }, event) => void` | Set to enable per-cell hover actions (copy, edit, delete, options, calendar, email, call…) and the `expand` toggle. Copy / open-link / mailto / tel run by default unless you call `event.preventDefault()` |
| `rowLabel` | `(row: DataTableRow) => string` | Set when `row.id` isn't meaningful to people — returns the row checkbox's accessible name (default `Select row ${row.id}`). Name the row, not the state; checked state is announced by the checkbox |
| `emptyState` | `ReactNode` | Set to replace the default "No results" `EmptyState` rendered in one full-width row when `rows` is empty |
| `column.frozen` | `boolean` | Set on a column other than the first to make it the sticky/frozen column instead of the default first column |
| `column.reorderable` | `boolean` | Set to `false` on a column that must never move (in addition to the implicit lock on the frozen column) |

### Sort cycle (desc-first)

When a column has `sortable: true`, activating its header cycles sort direction:

```
none → desc → asc → desc → …
```

- First activation on an unsorted column always sets **`desc`** — do not assume ascending-first behavior.
- There is no fourth "clear sort" step in the cycle; toggling continues between `desc` and `asc` once engaged.
- `onSortStateChange` receives `{ columnId, direction: 'asc' | 'desc' }`. Pass `sortState={null}` from the parent to represent no active sort.

```ts
type DataTableSortState = { columnId: string; direction: 'asc' | 'desc' };
```

### Column reorder (drag, keyboard, and column options menu)

DataTable supports **three built-in reorder paths**. Consumers must not add a separate "Reorder column" button or custom move controls — use these mechanisms.

**Drag path**
- Reorder by **dragging the header cell root** (`.dsn-data-table-header-cell`, `draggable={true}`).
- The first **display** column is locked (after filtering out the selection checkbox column): sticky/frozen and not draggable. Columns with `reorderable: false` are also excluded from drag.
- Persist order with `columnOrder` + `onColumnOrderChange`; the callback receives the full column id array including the selection column when present.

**Keyboard path (WCAG 2.1.1)**
- With a **reorderable** column header focused, press **Ctrl+ArrowLeft** or **Ctrl+ArrowRight** (Cmd+Arrow on macOS) to move the column one position within the movable set.
- Same exclusions as drag: locked first display column and `reorderable: false` columns cannot move.
- `onReorderCommand` on `DataTableHeaderCell` carries the keyboard direction (`'left' | 'right'`); `DataTable` wires this internally — consumers only handle `onColumnOrderChange`.

**Single-pointer path (WCAG 2.5.7)**
- Open **Column options** on a reorderable header (MoreVertical control), then click **Move left** or **Move right** — no drag gesture required.
- Same exclusions as drag and keyboard. Disabled menu items when the column cannot move further in that direction.
- This path satisfies dragging-movements requirements; keyboard satisfies keyboard requirements — they are separate conformance checks.

**Announcements**
- Successful moves (all three paths) are announced via a polite `role="status"` live region: `"{header} moved to position {n} of {total}"` (e.g. "Amount moved to position 3 of 5").

### `DataTableColumnDef` shape

```ts
{
  id: string                    // matches key in row.cells
  header: string                // column header, sentence case
  fieldType: DataTableFieldType  // see the fieldType table above
  sortable?: boolean             // enable sort for this column
  reorderable?: boolean          // allow drag-to-reorder (default true, except the frozen column)
  frozen?: boolean                // makes this the sticky/frozen column instead of the first column
  widthMode?: 'fixed' | 'hug' | 'stretch'
  width?: number
  minWidth?: number
  maxWidth?: number
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, cells: Record<string, unknown>) => ReactNode  // custom cell renderer — second arg is row.cells, not the full row
}
```

## Common mistakes

1. **Wrapping `DataTable` in a `Card`** — `DataTable` already manages its own surface, border, and width; nesting it in a `Card` double-boxes it and breaks full-width layout. Render `DataTable` directly in the page/section.
2. **Hand-building a `<table>` instead of using `columns`/`rows`** — bypasses sort, resize, frozen-column, and selection behavior entirely and won't pick up DS table tokens or dark mode behavior. Always model data as `DataTableColumnDef[]` + `DataTableRow[]`.
3. **Passing a flat `data` array of plain row objects (legacy/AI.md example shape)** — the current component expects `rows: { id, cells }[]`, not bare objects keyed directly by column id, and the prop is named `rows`, not `data`. Map source data into the `cells` shape before passing it in.
4. **Treating `sortState`/`selectedRowIds` as self-managed** — `DataTable` is fully controlled for sort, selection, column order, and filters; omitting the `onXChange` handler means the UI control renders but nothing happens when the user interacts with it.
5. **Assuming ascending-first sort** — the first sort activation on a column is always `desc`. Wire `onSortStateChange` to accept `{ columnId, direction: 'desc' }` on first click.
6. **Adding a separate "Reorder column" button or custom column-move UI** — reorder is built into the header via drag, Column options → Move left/Move right, and Ctrl/Cmd+Arrow keyboard commands. Locked columns (first display column, `reorderable: false`) cannot move.
7. **Rendering status values as plain text** — use `fieldType: "tags-multi"` and render with `Tag`, not raw strings.
8. **Hardcoding colors in `render` functions** — use design tokens, not literal color values.
9. **Assuming `row.id` is available in a `render` callback** — the second argument is `cells`, not the full `DataTableRow`. Always include `id` in `cells` when a render callback needs to identify or open a row.

## Examples

```tsx
import { DataTable } from 'ds-ngr'
import type { DataTableColumnDef, DataTableRow } from 'ds-ngr'

// Basic usage
const columns: DataTableColumnDef[] = [
  { id: 'name', header: 'Name', fieldType: 'string', sortable: true },
  { id: 'status', header: 'Status', fieldType: 'tag' },
  { id: 'owner', header: 'Owner', fieldType: 'user' },
  { id: 'dueDate', header: 'Due date', fieldType: 'date', sortable: true },
  { id: 'progress', header: 'Progress', fieldType: 'number' },
];

const rows: DataTableRow[] = [
  { id: '1', cells: { name: 'Q1 campaign refresh', status: 'Completed', owner: 'Alex Chen', dueDate: '2025-03-10', progress: 100 } },
  { id: '2', cells: { name: 'API integration phase 2', status: 'In progress', owner: 'Sam Rivera', dueDate: '2025-03-18', progress: 65 } },
];

<DataTable columns={columns} rows={rows} />

// Most common usage — sortable, controlled
const sortableColumns: DataTableColumnDef[] = [
  { id: 'name', header: 'Name', fieldType: 'string', sortable: true, widthMode: 'fixed', width: 200 },
  { id: 'status', header: 'Status', fieldType: 'tag', widthMode: 'fixed', width: 160 },
];
const contractRows: DataTableRow[] = [
  { id: 'row-1', cells: { name: 'Acme contract', status: ['Active'] } },
];

<DataTable
  columns={sortableColumns}
  rows={contractRows}
  sortState={sortState}
  onSortStateChange={setSortState}
  aria-label="Contracts table"
/>

// Status column — Tag with semantic variants
import { Tag } from 'ds-ngr'

const columnsWithTags: DataTableColumnDef[] = [
  { id: 'name', header: 'Name', fieldType: 'string', sortable: true },
  {
    id: 'status',
    header: 'Status',
    fieldType: 'tag',
    render: (value: string) => {
      const variantMap: Record<string, string> = {
        'Completed': 'success',
        'In progress': 'progress',
        'At risk': 'warning',
        'Not started': 'neutral',
        'Blocked': 'error',
      };
      return <Tag variant={variantMap[value] ?? 'neutral'} label={value} />;
    },
  },
  { id: 'owner', header: 'Owner', fieldType: 'user' },
  { id: 'dueDate', header: 'Due date', fieldType: 'date', sortable: true },
];

// Owner column — Avatar + name
import { Avatar } from 'ds-ngr'

const columnsWithAvatar: DataTableColumnDef[] = [
  {
    id: 'owner',
    header: 'Owner',
    fieldType: 'user',
    render: (value: string) => {
      const initials = value.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <Avatar size="xs" variant="profile" fill="initials" initials={initials} name={value} />
          {value}
        </div>
      );
    },
  },
];

// Non-obvious case — row selection with a checkbox column + pagination
const columnsWithSelection: DataTableColumnDef[] = [
  { id: 'select', header: '', fieldType: 'checkbox', headerVariant: 'checkbox', widthMode: 'fixed', width: 40, frozen: true, reorderable: false, sortable: false, align: 'center' },
  { id: 'name', header: 'Name', fieldType: 'string', widthMode: 'fixed', width: 200, sortable: true },
];

<DataTable
  columns={columnsWithSelection}
  rows={contractRows}
  selectedRowIds={selectedRowIds}
  onSelectedRowIdsChange={setSelectedRowIds}
  pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
  aria-label="Selectable contracts table"
/>
```
{% endraw %}
