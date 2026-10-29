# EmptyState

**Tier:** molecule
**Location:** `src/components/molecules/EmptyState/EmptyState.spec.md`
**Version:** 1.0.1  
**Date:** 2026-07-27

## What it is

A structured layout — optional icon, title/subtitle copy, and a tiered actions block — shown when a list, table, card body, or board column has nothing to show.

## When to use

- Use for first-use, filtered-empty, permission, and recoverable load-empty situations
- Use inside an empty kanban column so the column still communicates purpose and next action — always include a compact empty state; never leave empty columns blank

## When NOT to use

- Do not use when a single form field failed validation → use an inline field validation message instead
- Do not use when the whole page cannot render due to a system error → use a full-page error screen instead
- Do not use when you only need a one-line hint beside other content → use copy in context instead, not a full empty state

## Variant selection

### `size` prop

| Value | Use when |
|-------|----------|
| `"default"` | The empty state dominates a primary content area (full page or main panel) |
| `"small"` | Compact in-column empty states — Kanban columns, card bodies, filtered lists inside a panel |

## Spatial contract

- **Owns its padding:** yes — content (icon, copy, actions) is laid out internally by `EmptyState`.
- **Owns its margin:** no — it does not space itself from siblings; place it within the parent's normal layout flow.
- **Fills its container:** yes, but content wraps based on available width.
- **Notes:** In flex column parents (board columns, card bodies, split panels), set `min-width: 0` on the parent column **and** `min-width: 0` plus `max-width: 100%` on the `EmptyState` root (via `className`) — otherwise title/subtitle/actions overflow the narrow column instead of wrapping.

## Composition rules

- ✅ Can be used inside: `Card` content, board/Kanban columns, table/list empty regions, split panels
- ❌ Never place inside: a context needing only a one-line inline hint — use copy in context instead
- ❌ Never combine with: a standalone `Button` mounted beside `EmptyState` purely to get a different variant — use the built-in action slot props instead

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `size` | `"default" \| "small"` | Set `"small"` for compact in-column contexts; pair with `hasIcon={false}` when no icon fits |
| `hasIcon` | `boolean` | Set to `true` when an icon should appear; always pass a matching `icon` |
| `icon` | `IconSource` | Swap the Figma placeholder instance for a context-specific Lucide icon — a component (`icon={Search}`) or an element (`icon={<Search />}`) |
| `showMainCta` | `boolean` | Renders the primary (`variant="primary"`) action — set `false` if there is no primary action |
| `showSecondaryOption` | `boolean` | Renders the secondary (`variant="secondary"`) action — use for a secondary-only CTA by pairing with `showMainCta={false}` |
| `showTertiaryOption` / `showLink` / `showHelpText` | `boolean` | Turn off any unused action tier so the actions block stays minimal |

### Icon selection

The Figma search icon is a placeholder instance only. Always swap `icon` to match the empty-state context:

| Situation | Suggested icon |
|-----------|----------------|
| Filtered empty / no search results | `Search` |
| First use / empty list | Context-specific (e.g. `FolderOpen`, `Inbox`, `Users`) |
| Permission restriction | `Lock` |
| Recoverable load error | `WifiOff` or `RefreshCw` |
| Compact in-column (Kanban, card body) | Usually omit — set `hasIcon={false}` |

## Common mistakes

1. **Mounting a separate `Button` beside `EmptyState` only to get primary vs. secondary variant** — AI.md explicitly forbids this; use `showMainCta` and `showSecondaryOption` instead.
2. **Reimplementing board or in-column empty layouts with custom flex wrappers** — AI.md requires using `EmptyState` with `min-width: 0` / `max-width: 100%` column constraints instead of bespoke wrappers.
3. **Omitting `min-width: 0` on the flex column parent and `min-width: 0`/`max-width: 100%` on the `EmptyState` root** — causes title/subtitle/actions to overflow narrow board columns instead of wrapping.
4. **Using `EmptyState` for a full-page system error** — AI.md reserves the page-level `Error` state for system errors; `EmptyState` is for "no results" / first-use cases.
5. **Leaving empty kanban columns without an `EmptyState`** — always include a compact `EmptyState` so empty columns communicate purpose and next action.
6. **Relying on a built-in default icon** — there is none; when `hasIcon={true}`, always pass a context-specific `icon={LucideIcon}`.

## Examples

```tsx
import { FolderOpen, Search } from 'lucide-react';

// Most common usage — primary content area, first use
<EmptyState
  hasIcon
  icon={FolderOpen}
  title="No projects yet"
  subtitle="Create your first project to get started."
  showMainCta
  mainCtaLabel="Create project"
  onMainCtaClick={handleCreate}
  showSecondaryOption={false}
  showTertiaryOption={false}
  showLink={false}
  showHelpText={false}
/>

// Filtered empty — swap icon to match the context
<EmptyState
  hasIcon
  icon={Search}
  title="No results"
  subtitle="Try removing filters or adjusting your search."
  showMainCta
  mainCtaLabel="Clear filters"
  onMainCtaClick={handleClearFilters}
  showSecondaryOption={false}
  showTertiaryOption={false}
  showLink={false}
  showHelpText={false}
/>

// Non-obvious case — secondary-only CTA in a compact Kanban column
<EmptyState
  size="small"
  hasIcon={false}
  title="No tasks"
  subtitle="Drag tasks here or create one in the backlog."
  showMainCta={false}
  showSecondaryOption
  secondaryOptionLabel="Add task"
  onSecondaryOptionClick={handleAdd}
  showTertiaryOption={false}
  showLink={false}
  showHelpText={false}
  className="board-column-empty-state"
/>
```

## Copy

- Title: 2–5 words, no trailing punctuation.
- Subtitle: 1–2 lines with a full stop.
- CTA labels: 1–3 words, verb-first, sentence case.
- Never use "Oops", "Uh oh", or similar diminishing phrases.

## Accessibility

- Use meaningful `title` and `subtitle` text; do not rely on the icon alone.
- Ensure action buttons remain reachable by keyboard when shown.
