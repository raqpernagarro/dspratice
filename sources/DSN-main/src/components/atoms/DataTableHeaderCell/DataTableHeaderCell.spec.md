# DataTableHeaderCell

**Tier:** atom  
**Location:** `src/components/atoms/DataTableHeaderCell/DataTableHeaderCell.spec.md`  
**Version:** 1.0.0

## What it is

A `DataTable` column header cell: a sortable, reorderable, resizable title with a column-options menu, or a select-all checkbox.

## When to use

- `DataTable` renders it for every column header — configure sorting, reordering and resizing through `DataTable` and its column definitions, not on the cell
- Use it standalone only for static previews (docs, specs, Figma parity stories)

## When NOT to use

- Do not use to build a custom table header → use `DataTable` instead; never hand-build tables
- Do not use as a section or group title → use `SectionHeader` instead
- Do not use for label–value pairs in a detail panel → use `DataListCell` instead

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"title"` (default) | A data column header — label, sort indicator, options menu, resize handle |
| `"checkbox"` | The selection column of a multi-select table — a select-all checkbox |

### `state` prop

| Value | Use when |
|-------|----------|
| `"default"` | Always in real tables — hover is handled by CSS |
| `"hover"` | Static previews only, to show the hover appearance |

## Spatial contract

- **Owns its padding:** yes
- **Owns its margin:** no
- **Fills its container:** yes — fills its table column; `width` sets the column width on title cells
- **Notes:** the resize handle sits on the cell's right edge. Set `noRole` when the cell is already inside a `<th scope="col">` that carries `columnheader` and `aria-sort`.

## Composition rules

- ✅ Can be used inside: `DataTable` (rendered for you), static docs previews
- ❌ Never place inside: a hand-built `<table>` or `Card` — use `DataTable`
- ❌ Never combine with: `Select` or custom popovers for column options — the cell owns its options menu

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `sortable` + `sortDirection` + `onSortChange` | `boolean` + `DataTableSortDirection` + callback | Sortable columns; clicks cycle descending → ascending |
| `reorderable` + `onReorderCommand` | `boolean` + callback | Column reordering; enables the Move left / Move right menu and Ctrl/⌘ + arrow keys |
| `canMoveReorderLeft` / `canMoveReorderRight` | `boolean` | Disable the move commands at the first and last column |
| `resizable` + `onResizePointerDown` / `onResizeCommand` | — | Column resizing by pointer and by arrow keys |
| `checkboxChecked` / `checkboxIndeterminate` + `onCheckboxChange` | — | `"checkbox"` variant — indeterminate when only some rows are selected |

## Common mistakes

1. **Hand-built table headers** — see When NOT to use.
2. **Setting `state="hover"` in a real table** — see Variant selection.

## Examples

```tsx
// Most common usage — configure through DataTable column definitions, not the cell
const columns: DataTableColumnDef[] = [
  { id: 'select', header: '', fieldType: 'checkbox', headerVariant: 'checkbox' },
  { id: 'name', header: 'Name', fieldType: 'string' },
];
<DataTable columns={columns} rows={rows} selectedRowIds={selected} onSelectedRowIdsChange={setSelected} />

// Non-obvious: static preview of a sortable header
<DataTableHeaderCell
  label="Due date"
  sortable
  sortDirection="desc"
  width={160}
  reorderable={false}
/>
```
