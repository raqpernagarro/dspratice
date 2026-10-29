# DataTableCell

**Tier:** atom  
**Location:** `src/components/atoms/DataTableCell/DataTableCell.spec.md`  
**Version:** 2.0.0  
**Date:** 2026-10-09

A typed table cell. `fieldType` maps 1:1 to the Figma `Data table / Cell / Table cell` "Field type" property (node `179:2495`), each with its own content renderer and hover actions.

---

## When to use

`DataTableCell` is rendered by `DataTable` for every body cell — set `fieldType` on the `DataTableColumnDef`, not on the cell. Use it standalone only for static previews (docs, specs, Figma parity stories).

**Do not use DataTableCell when:**
- Showing a label–value pair in a drawer/detail panel → use `DataListCell`
- Building a hand-made `<table>` → always use `DataTable`

---

## Variant selection — `fieldType`

Pick the built-in type before reaching for `render`.

| `fieldType` | Figma | `value` shape | Hover actions |
|---|---|---|---|
| `main` | Main | `{ name, initials?, src? }` | open, side-panel |
| `string` | String | `string` | copy |
| `text` | Text field (single line) | `string` | copy, edit, delete |
| `long-text` | Text field (long text) | `string` (truncates) | copy, edit, delete |
| `email` | Email | `string` | email (mailto), copy, edit, delete |
| `phone` | Phone number | `string` | message, call (tel), edit, delete |
| `address` | Address | `string` | copy, edit, delete |
| `number` | Number | `number` (locale-formatted) | edit, delete |
| `range` | Range | `[min, max]` | edit, delete |
| `date` | Date | pre-formatted `string` | calendar, delete |
| `datetime` | Date and time | pre-formatted `string` | calendar, delete |
| `month-year` | Month and year | pre-formatted `string` | calendar, delete |
| `single-choice` | Single choice | `string` | menu, delete |
| `multi-choice` | Multi choice | `string[]` (comma-joined) | menu, delete |
| `tags-multi` | Tags multi choice | `(string \| { label, variant? })[]` | menu |
| `tags-single` | Tags single choice | `string \| { label, variant? }` | — (tag carries the chevron) |
| `tags-readonly` | Tags read-only | `string[]` (always neutral) | — |
| `single-user` | Single user or team | `{ name, initials?, src? }` | menu, delete |
| `multi-user` | Multiple users or teams | `User[]` | menu, delete |
| `contact` | Contact | `User` (pill) | menu, delete |
| `contacts` | Contacts (table) | `User[]` (pills + overflow) | menu, delete |
| `contacts-list` | Contacts (description list) | `User[]` (stacked; cell grows) — **never in DataTable**, description-list rows only | add, delete |
| `url` | URL | `string` | edit, delete |
| `url-readonly` | URL read-only | `string` | open-external |
| `file` | File (single) | `string` (file name) | upload, delete |
| `boolean` | Boolean | `boolean` (disabled Switcher) | — |
| `buttons` | Buttons | `{ label, icon?: LucideIcon, onClick? }[]` | — |
| `checkbox` | Checkbox (row selection) | `boolean` | — |
| `expand` | Expand | `boolean` (expanded) | — (the toggle emits `expand`) |
| `icon` | Icon | `LucideIcon` or element | — |
| `empty` | Empty | placeholder `string` | — |

Legacy aliases: `tag` → `tags-multi`, `user` → `single-user`. `data-field-type` always carries the resolved name.

---

## Hover actions

- `state="hover"` forces the hover look and actions (static previews).
- `revealActionsOnHover` renders actions always and reveals them on pointer hover / `:focus-within`. `DataTable` sets it when `onCellAction` is provided.
- `onAction(action, value, event)` fires for every action and for the `expand` toggle.
- Built-in defaults: `copy` → clipboard, `open-external` → new tab, `email` → `mailto:`, `call` → `tel:`. Call `event.preventDefault()` to replace them.
- Never add custom hover buttons through `render` when a built-in `fieldType` provides them.

---

## Spatial contract

- Min height 40px; padding `--space-xs` / `--space-md`; content truncates with ellipsis.
- `contacts-list` is the only multi-line type. It belongs to description-list / data-display rows, never to a DataTable column — use `contacts` (Figma: Contacts (table)) there.
- `checkbox`, `expand` and `icon` center a single control; give the column `widthMode: "fixed"`, `width: 32`.
- `number`, `date`, `datetime`, `month-year`, `range` and `phone` always use `tabular-nums`. There is no opt-out.

---

## Accessibility

- Every icon-only action button has an `aria-label` (e.g. "Copy value", "Open date picker").
- The `expand` toggle exposes `aria-expanded` and switches label between "Expand row" and "Collapse row".
- Tag/contact overflow is a `+N` button with `aria-haspopup="dialog"` that opens the hidden items. Escape closes it.
- Hover-revealed actions are also revealed on keyboard focus (`:focus-within`).
