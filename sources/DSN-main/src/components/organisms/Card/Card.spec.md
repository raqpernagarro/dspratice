# Card

**Tier:** organism
**Location:** `src/components/organisms/Card/Card.spec.md`
**Version:** 1.0.1  
**Date:** 2026-07-27

## What it is

A bounded `<section>` surface composed of an optional `SectionHeader` header, a content area (`children`), and an optional `Toolbar` bottom bar, with a built-in loading skeleton state.

## When to use

- Use when content is a distinct, self-contained unit that benefits from a border, radius, and internal header/footer structure — a form block, summary panel, or board column.
- Use for the documented KPI/stat card pattern on dashboards.
- Use for kanban board task cards — title and description in the header, metadata tags in the body, assignee and date in the footer.
- Use as the container for board/Kanban columns (with `min-width: 0` on the parent).

## When NOT to use

- Do not use when content should flow continuously with the page → use `SectionHeader` + flat content instead.
- Do not use as a page-section title for a list or detail block in main content → use `SectionHeader` inside a `page-section` wrapper instead (`size="medium"` for subsection titles).
- Do not use to wrap a full-width data table → `DataTable` is never wrapped in a `Card`.
- Do not use when you only need a visual box with no header semantics → use the documented empty-state or board patterns instead of a custom wrapper.
- Do not hand-build kanban card layouts with plain divs when `Card` header, body, and footer slots cover the layout — see `specs/patterns/kanban-board.md`.

## Variant selection

### `headerSize` prop

| Value | Use when |
|-------|----------|
| `"medium"` | Default. Standard card header (`SectionHeader` size inside cards). |
| `"large"` / `"small"` / `"xsmall"` | Taller page-like titles or denser nested card contexts per `SectionHeader`'s size contract. |

### `bottomBarSize` prop

| Value | Use when |
|-------|----------|
| `"lg"` | Default. Standard footer action bar. |
| `"md"` / `"sm"` | Denser cards needing a more compact footer toolbar. |

### `loading` prop

| Value | Use when |
|-------|----------|
| `true` | Data for the card is not yet available; renders `SkeletonLoading type="card"` in place of header/content/bottom bar. Header and bottom bar props should still describe the loaded card for accessibility. |
| `false` | Default. Card renders normally. |

## Spatial contract

- **Owns its padding:** yes — `.dsn-card-content` applies inset padding that varies with `data-has-header` / `data-has-bottom-bar`. Never add `padding`, `margin`, or `gap` directly on the `Card` root, header, or bottom bar.
- **Owns its margin:** no — spacing between multiple cards (e.g. a card grid) must be applied by the parent via `gap: var(--space-md)`.
- **Fills its container:** no — width/height are intrinsic to content unless the parent grid/flex forces a size.
- **Notes:** Body children should not duplicate inset padding with an extra wrapper unless an inner layout is genuinely needed (e.g. a tag row). When a `Card` (or its body) holds an `EmptyState` inside a flex column (Kanban column), the column parent needs `min-width: 0`, and the `EmptyState` root needs `min-width: 0` + `max-width: 100%` to avoid overflow.

## Composition rules

- ✅ Can be used inside: dashboards, board/Kanban columns, page main content as a distinct content unit.
- ❌ Never place inside: a `Card` should never wrap a `DataTable` — `DataTable` is always full-width.
- ❌ Never combine with: a standalone primary CTA `Button` floating inside a `Card` — primary CTAs belong in `Navbar` `rightActions`, never inside a `Card` and never floating (`position: fixed/absolute`).
- ❌ Never use a `Card` header as a page-section title for main-content lists/details — use `SectionHeader` directly instead.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `showHeader` / `title` | `boolean` / `string` | Always set both together when the card has a content area — never ship a body-only card with no header (padding/layout become undefined for consumers). |
| `showBottomBar` | `boolean` | Set `false` explicitly whenever there is no footer — do not just omit footer props. |
| `header` | `React.ReactNode` | Override the default `SectionHeader` only when a fully custom header is required; otherwise prefer `title`/`description`/`headerSize`/`headerLeadingControl`/`headerTrailingControl`. |
| `bottomBar` | `React.ReactNode` | Override the default `Toolbar` only when a fully custom footer is required; otherwise prefer `bottomBarSize`/`bottomBarLeftActions`/`bottomBarRightActions`. |
| `loading` | `boolean` | Set while the card's data is being fetched; replaces header/content/bottom bar with a card skeleton. |
| `aria-label` | `string` | Override the default `"Card"` label when the title alone does not sufficiently describe the region. |

## Common mistakes

1. **Shipping a body-only card with `showHeader={false}` and no `showBottomBar={false}`** — AI.md and the spec both require `showHeader`/`title` whenever there's body content, and explicit `showBottomBar={false}` when there's no footer; otherwise padding/layout are undefined.
2. **Adding `padding`/`margin`/`gap` directly on the `Card` root** — `.dsn-card-content` already owns inset via `data-has-header`/`data-has-bottom-bar`; manual padding double-pads the content.
3. **Wrapping a `DataTable` inside a `Card`** — explicitly forbidden in AI.md; `DataTable` is always full-width.
4. **Using a `Card` header as a main-content page-section title** — AI.md requires `SectionHeader` inside a `page-section` wrapper for that purpose; `Card` headers are for card-bounded content only.
5. **Wrapping every page section in a `Card` by default** — AI.md explicitly calls this out; use `SectionHeader` + flat content for continuous page flow and reserve `Card` for genuinely distinct, self-contained units.
6. **Reimplementing board/Kanban columns or empty-state chrome with a custom wrapper instead of `Card` + `EmptyState`** — AI.md directs reuse of `Card`'s `showHeader`/`title`/`showBottomBar` props and `EmptyState`'s `size`/`hasIcon`/action-slot props instead of bespoke flex stacks.
7. **Hand-building kanban task cards with plain divs** — always use `Card` with title and description in the header, metadata tags in the body, and assignee plus date in the footer via bottom bar props.

## Examples

```tsx
// Most common usage — titled card, no footer
<Card title="Team members" showBottomBar={false}>
  {/* body */}
</Card>

// Non-obvious case — header + bottom bar with actions, loading toggle
<Card
  title="Active projects"
  description="Updated 5 minutes ago"
  showBottomBar
  bottomBarRightActions={<Button variant="secondary">More details</Button>}
  loading={isLoading}
>
  {content}
</Card>
```
