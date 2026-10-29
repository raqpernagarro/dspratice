# Tag

**Tier:** atom
**Location:** `src/components/atoms/Tag/Tag.spec.md`
**Version:** 1.0.1  
**Date:** 2026-07-27

## What it is

A non-interactive `<span>` with `role="status"` that renders a short text label, optionally with a leading and/or trailing icon, in one of five semantic color variants.

## When to use

- Use when attaching a categorical label or status to a piece of content — a record, list item, card, or table row.
- Use when the value is one of: status ("Active", "Pending review"), category/type ("Design", "Bug"), severity/priority ("High", "Critical"), or workflow stage ("In progress", "Blocked").
- Use when the label must be scannable at a glance and carries no interactivity.

## When NOT to use

- Do not use when the element must be selectable, removable, or otherwise interactive → use `Chip` instead.
- Do not use when the label is a numeric count or notification indicator attached to another element (e.g. a nav icon) → use `Badge` instead.
- Do not use for kanban column status when tasks are already grouped into status columns — tint column chrome with tag semantic surface tokens instead; see `specs/patterns/kanban-board.md`.
- Do not show a status tag on a kanban card when the board is grouped by status columns — the column conveys status; show priority, type, or other secondary metadata on the card instead.
- Do not use when the status communicates an urgent, system-level condition requiring immediate user attention → use `Toast` or an alert banner instead.

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"success"` | Done, active, on track, approved, complete |
| `"warning"` | At risk, pending, in review, in progress, waiting |
| `"error"` | Behind, blocked, failed, rejected, overdue |
| `"neutral"` | Draft, inactive, unknown, archived — no semantic weight, purely categorical |
| `"highlight"` | Notable but not urgent — featured items, active selection, primary category callout |

Never use the same variant for every tag in a list — each variant must match the semantic meaning of its own label, not a default chosen for visual consistency. If an item has multiple statuses, show only the highest-severity tag (`error` > `warning` > `success` > `neutral`).

### Kanban column chrome

When status-grouped kanban boards exist in the product, always tint column chrome using the tag semantic surface tokens that match each column's status — background, border, and title text from the same variant as the column status via a `data-status` attribute. Never use a flat neutral column background.

When introducing a new board column status, always define the full tag-token mapping for column background, border, and title color alongside the status label — do not assume existing status CSS covers new values.

| Column status meaning | Tag variant | Surface token | Border token | Title text token |
|---|---|---|---|---|
| Done, active, on track, approved, complete | `success` | `--tag-background-success` | `--tag-border-success` | `--tag-foreground-success` |
| At risk, pending, in review, in progress, waiting | `warning` | `--tag-background-warning` | `--tag-border-warning` | `--tag-foreground-warning` |
| Behind, blocked, failed, rejected, overdue | `error` | `--tag-background-error` | `--tag-border-error` | `--tag-foreground-error` |
| Draft, inactive, unknown, archived | `neutral` | `--tag-background-neutral` | `--tag-border-neutral` | `--tag-foreground-neutral` |
| Notable but not urgent — featured, primary category | `highlight` | `--tag-background-progress` | `--tag-border-progress` | `--tag-foreground-progress` |

### `size` prop

| Value | Use when |
|-------|----------|
| `"md"` | Default — lists, cards, table cells |
| `"sm"` | Dense layouts, tight inline rows, or when multiple tags appear on a single item |

Use the same size consistently within a single list or table — never mix `sm` and `md` on the same row.

## Spatial contract

- **Owns its padding:** yes — internal padding is fixed per `size` via CSS, not configurable via props.
- **Owns its margin:** no — renders with zero external margin; spacing between adjacent tags must be handled by the parent (e.g. flex `gap`).
- **Fills its container:** no — `display: inline-flex`, sized to its content (icon + label).
- **Notes:** Tags do not wrap internally. If the label is too long for available space, truncate and surface the full value via a tooltip rather than letting the tag wrap or grow unbounded.

## Composition rules

- ✅ Can be used inside: list item rows, card headers, table cells (via the `render` prop on a column definition), inline text runs.
- ❌ Never place inside: `Button` or any clickable element as if it were a label substitute — if the combined element needs to be clickable, use `Chip`, not a `Tag` wrapped in a click handler.
- ❌ Never combine with: an `onClick` handler or any interactive wrapper that implies the tag itself is actionable — Tag has no interaction states (no hover, pressed, or focus styling).

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `variant` | `'highlight' \| 'warning' \| 'error' \| 'success' \| 'neutral'` | Always set explicitly based on semantic meaning — do not rely on the `'neutral'` default when the value has actual status meaning. |
| `size` | `'sm' \| 'md'` | Set `'sm'` only in dense layouts or when 2+ tags appear on one item; otherwise omit (defaults to `'md'`). |
| `leadingIcon` / `trailingIcon` | `IconSource` | Figma: `Leading icon` / `Trailing icon`. A Lucide component (`leadingIcon={Star}`) or element (`leadingIcon={<Star />}`). Optional — most status tags need no icon since the variant color plus label already carry the meaning. |
| `showLeadingIcon` / `showTrailingIcon` | `boolean` | Figma: `Show leading icon` / `Show trailing icon`. Toggle each side without removing the icon, e.g. when icon display depends on layout density. |
| `disclosure` | `boolean` | Figma: `Disclosure`. Adds a trailing chevron-down, for tags that open a menu (e.g. a single-choice tag cell). |
| `iconLeft` / `iconRight` / `showIcon` | — | Deprecated aliases of the props above; still work. |
| `aria-label` | `string` | Set only when the visible `label` text alone is insufficient as the accessible name; in most cases the `label` prop already serves this purpose. |

## Common mistakes

1. **Using the same `variant` for every tag in a list regardless of meaning** — Each tag's variant must independently reflect its own label's semantics (see [Tag semantic mapping](../../AI.md#tag-semantic-mapping--critical) in AI.md). Defaulting to one variant for visual uniformity defeats the purpose of the color signal.
2. **Wrapping a Tag in a clickable element or adding an `onClick`** — Tags have no interactive states by design. If the design calls for a removable or selectable label, use `Chip` instead of bolting interactivity onto `Tag`.
3. **Using the deprecated `iconLeft` / `iconRight` / `showIcon`** — use `leadingIcon` / `trailingIcon` / `showLeadingIcon` / `showTrailingIcon`, which match the Figma property names.
4. **Showing a status tag on a kanban card in a status-grouped board** — the column conveys status; show secondary metadata on the card instead.
5. **Adding a new board column status without defining its tag-token mapping** — always define background, border, and title text tokens alongside the status label.

## Examples

```tsx
// Most common usage — semantic status label, no icon
<Tag variant="success" label="Active" />

// Non-obvious case — dense table row with icon and explicit sm size
<Tag variant="warning" size="sm" label="Overdue" leadingIcon={AlertTriangle} />
```
