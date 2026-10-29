{% raw %}
# Pattern: Kanban board
<!--
Version: 1.0.0
Date: 2026-07-27
-->

A status-grouped board view for tasks, projects, or other workflow records. Used when records are organized into columns by status (e.g. Not started, In progress, Done).

---

## Assembly

```
AppShell
├── header: Navbar (variant="title")
├── sidebar: Sidebar                              ← section recipes: Sidebar.spec.md
└── children (main area — padding already built in)
    ├── SectionHeader (size="large")              ← page title
    ├── Toolbar (variant="filter-bar")            ← view switcher, search, filters
    └── board shell (horizontal scroll container)
        └── column × N (data-status per column)
            ├── Card (column chrome — tinted header)
            │   ├── header: column status title
            │   └── body: card stack + EmptyState when empty
            └── task Card × N (board cards)
                ├── header: title + description
                ├── body: metadata tags (priority, type — not status)
                └── footer: assignee + date
```

---

## Rules

### Board shell
- Always reuse the same board shell and card pattern across top-level and detail views for an entity type — clone the existing pattern instead of creating a parallel layout with different class names or structure.
- Always set `min-width: 0` on column containers inside horizontal board layouts so nested cards and empty states do not overflow.

### Column chrome
- Always tint kanban column chrome using tag semantic surface tokens matched to column status — background, border, and title text tokens from the same tag variant as the column's status.
- Always map each column status to a tag variant via a `data-status` attribute on the column container — never use a flat neutral column background when status-grouped boards exist elsewhere in the product.
- When introducing a new board column status, always define the full tag-token mapping for column background, border, and title color alongside the status label — do not assume existing status CSS covers new values.

| Column status meaning | Tag variant | Surface token | Border token | Title text token |
|---|---|---|---|---|
| Done, active, on track, approved, complete | `success` | `--tag-background-success` | `--tag-border-success` | `--tag-foreground-success` |
| At risk, pending, in review, in progress, waiting | `warning` | `--tag-background-warning` | `--tag-border-warning` | `--tag-foreground-warning` |
| Behind, blocked, failed, rejected, overdue | `error` | `--tag-background-error` | `--tag-border-error` | `--tag-foreground-error` |
| Draft, inactive, unknown, archived | `neutral` | `--tag-background-neutral` | `--tag-border-neutral` | `--tag-foreground-neutral` |
| Notable but not urgent — featured, primary category | `highlight` | `--tag-background-progress` | `--tag-border-progress` | `--tag-foreground-progress` |

### Board cards
- Never hand-build kanban card layouts with plain divs when `Card` supports header, body, and footer slots — always use `Card` for board cards.
- Always put task title and description in the card header (`title`, `description` props).
- Always put metadata tags (priority, type, labels) in the card body.
- Always put assignee and date in the card footer via `showBottomBar` and `bottomBarLeftActions` / `bottomBarRightActions`.
- Never show a status `Tag` on a kanban card when tasks are grouped into status columns — the column conveys status; show secondary metadata such as priority, assignee, and dates instead.

### Empty columns
- Always include a compact `EmptyState` (`size="small"`, `hasIcon={false}`) inside empty kanban columns so columns with no items still communicate purpose and next action.
- Always set `min-width: 0` and `max-width: 100%` on the `EmptyState` root inside narrow columns.

### Toolbar (filter bar)
- Always use `Toolbar variant="filter-bar"` for filtered board views — view switcher and `SearchBar` on the left, filter controls on the right.
- Never use `Toolbar variant="default"` above a board — it casts an upward shadow meant only for bottom bars.
- Always let the view switcher `SegmentControl` hug its content — never set `fullWidth` or a fixed width on it.
- Match the slot structure of sibling list pages in the same feature area.

### Detail drawer
- Always open read-only entity detail in a `Drawer` using `DataListCell` rows with icon, title, and value.
- Wire selection from board cards, table rows, and chart or timeline interactions to the same drawer pattern — see [detail-drawer.md](./detail-drawer.md).

---

## Related patterns

- [data-page.md](./data-page.md) — list view with the same filter bar slot structure
- [detail-drawer.md](./detail-drawer.md) — read-only detail from board card click
- [Card spec](../../src/components/organisms/Card/Card.spec.md) — board card header/body/footer slots
- [Tag spec](../../src/components/atoms/Tag/Tag.spec.md) — column chrome token mapping
{% endraw %}
