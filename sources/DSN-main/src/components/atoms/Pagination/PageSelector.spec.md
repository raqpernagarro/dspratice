# PageSelector

**Tier:** atom
**Location:** `src/components/atoms/Pagination/PageSelector.spec.md`
**Version:** 1.0.0

## What it is

A single numbered page button (`aria-current="page"` when selected) rendered inside `Pagination`'s page-range row.

## When to use

- Use only as a child rendered by `Pagination` — it represents one page number within the assembled pagination control (previous/next arrows, page numbers, ellipsis).
- Rely on `Pagination` to compute which page numbers to render (including ellipsis collapsing) — `PageSelector` itself has no awareness of the total page range.

## When NOT to use

- Do not mount `PageSelector` standalone to build a custom page-number row → use `Pagination` instead; it owns first/last-page display rules, ellipsis collapsing, and previous/next arrow disabling per `pagination.md`.
- Do not use it as a generic numbered-button component outside a pagination context → use `Button` instead.

## Variant selection

This component has no `variant` prop — its only state-driving prop is `selected`.

## Spatial contract

- **Owns its padding:** yes — sized around its page-number label.
- **Owns its margin:** no — spacing between adjacent `PageSelector`s within the pagination row comes from the parent `Pagination` layout.
- **Fills its container:** no — sized intrinsically to its numeric label.
- **Notes:** selected/current-page styling (teal border) is driven entirely by the `selected` prop — `Pagination` is responsible for ensuring exactly one `PageSelector` in the row has `selected={true}` at a time.

## Composition rules

- ✅ Can be used inside: `Pagination`'s page-range row only.
- ❌ Never render more than one `PageSelector` with `selected={true}` in the same pagination row — per `pagination.md`, exactly one page is always selected.
- ❌ Never omit the ellipsis collapsing logic when the total page count exceeds the display limit — that logic lives in `Pagination`, not `PageSelector`.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `page` | `number` | The page number to display — supplied by `Pagination` for each rendered selector. |
| `selected` | `boolean` | Set `true` for exactly one `PageSelector` in the row — the current page; adds `aria-current="page"`. |
| `disabled` | `boolean` | Rarely set directly; used by `Pagination` if a specific page must be temporarily unreachable. |

## Common mistakes

1. **Mounting a custom page-number row instead of using `Pagination`** — `pagination.md` requires first/last page numbers to always be visible and middle ranges to collapse via ellipsis; hand-rolling `PageSelector`s loses that logic.
2. **Selecting more than one `PageSelector` at once** — `pagination.md` states one page is always selected; rendering multiple `selected={true}` buttons breaks that invariant.
3. **Hiding rather than disabling adjacent navigation** — this applies at the `Pagination` level (previous/next arrows), but the same principle holds for `PageSelector`: never remove a reachable page from the row, only mark it unavailable if truly needed.

## Examples

```tsx
// Correct usage — always via Pagination, never PageSelector directly
<Pagination currentPage={4} totalPages={12} onPageChange={setPage} />
```
