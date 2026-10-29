# Pagination

**Tier:** atom
**Location:** `src/components/atoms/Pagination/Pagination.spec.md`
**Version:** 1.0.0

## What it is

Pagination divides a large dataset into discrete pages and gives the user explicit controls to navigate between them. It communicates position within the full dataset and enables direct access to any page.

## When to use

- Use when a dataset is too large to display in a single view and the user benefits from explicit page-by-page navigation
- Use for data tables, search results, and record lists where the user may jump to a specific page

## When NOT to use

- Do not use when the dataset is small enough to display in full
- Do not use when the primary interaction is scrolling a continuous feed → use infinite scroll instead
- Do not use when the user is unlikely to jump to a specific page → use load-more instead
- Do not use in compact panels where pagination controls would dominate the layout

## Variant selection

Pagination assembles previous/next arrows, page number selectors, and ellipsis for collapsed ranges. `PageSelector` is the individual page button within the row — one page is always selected.

## Spatial contract

- **Owns its padding:** yes — internal spacing for controls
- **Owns its margin:** no
- **Fills its container:** no — sits at the bottom of the content it controls
- **Notes:** Place directly below the table, list, or results area; center or right-align consistently

## Composition rules

- ✅ Can be used inside: data pages, search results, table footers
- ❌ Never place above the content it paginates
- ❌ Never hide Previous/Next at boundaries — disable them instead

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `page` / `totalPages` | `number` | Required for controlled navigation |
| `showSummary` | `boolean` | Set when showing "Showing X–Y of Z results" adds context |

## Common mistakes

1. **Changing visible page selector count mid-session** — keep layout consistent
2. **Omitting first and last page numbers when collapsing ranges** — they anchor scale
3. **Leaving focus on pagination after page change** — move focus to the top of updated content

## Examples

~~~tsx
<Pagination page={3} totalPages={12} onPageChange={setPage} />

<Pagination page={1} totalPages={48} showSummary totalItems={480} />
~~~
