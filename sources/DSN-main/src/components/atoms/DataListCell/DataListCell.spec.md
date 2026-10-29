# DataListCell

**Tier:** atom  
**Location:** `src/components/atoms/DataListCell/DataListCell.spec.md`  
**Version:** 1.0.0  
**Date:** 2026-07-27

A label–value row for metadata in detail panels, drawers, and profile-style layouts. Supports inline and vertical alignment, optional actions, and rich content slots.

---

## When to use

Use `DataListCell` when presenting a field label with its value in a stacked or inline list — assignees, status, dates, and similar metadata.

**Do not use DataListCell when:**
- The data is tabular with many columns and sorting → use `DataTable`
- The row is a navigable menu item → use `MenuCell`
- You only need a form field → use the appropriate input component

---

## Drawer layout

When stacking cells inside a `Drawer` for read-only entity detail:

- Always open read-only detail using `DataListCell` rows with icon, title, and value.
- Wire the same drawer from table rows, board cards, and chart or timeline interactions — see `specs/patterns/detail-drawer.md`.
- Stack cells directly in `.dsn-drawer-content` — the drawer applies matching horizontal inset on each cell.
- Always set each cell to full width (`width: '100%'`).
- Always pass a meaningful Lucide icon via the `icon` prop and set `showActions={false}` for read-only metadata rows.
- Never wrap the stack in a container with arbitrary `max-width` — the list must use the full drawer panel width.

See `specs/patterns/detail-drawer.md` for the full-bleed wrapper pattern.

---

## Accessibility

- Provide meaningful `title` text for each row.
- When using action controls, always pass `actionAriaLabel` describing the action.
