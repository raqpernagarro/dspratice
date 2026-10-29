# SectionHeader

**Tier:** atom
**Location:** `src/components/atoms/SectionHeader/SectionHeader.spec.md`
**Version:** 1.0.1
**Date:** 2026-07-27

## What it is

An edge-to-edge title block with optional description and leading/trailing control slots, used to label and separate content sections.

## When to use

- Use for top-level page sections, with `size="large"`.
- Use for subsections within a page, with `size="medium"` inside a `page-section` wrapper.
- Use for drawer or panel section labels, with `size="small"` or `size="medium"` depending on density.
- Use as the header of a `Card` when the header is visually part of a bounded card block, including sticky section headers.

## When NOT to use

- Do not use when you need a bounded card surface around the title → use `Card`'s `title` prop, but only for content inside that card — not for main-content page sections.
- Do not use when you need a page-level title in the navigation chrome → use `Navbar` title or breadcrumbs instead.
- Do not use a `SectionHeader` title on a detail page to repeat the entity name when that name already appears as the current breadcrumb item — use the page body for metadata, filters, and content instead.
- Do not use a raw `<h2>`/`<h3>` to divide content sections → use `SectionHeader` instead.
- Do not use inside a table cell → `SectionHeader` is never valid inside `DataTable` cells.

## Variant selection

### `size` prop

| Value | Use when |
|-------|----------|
| `"large"` | Top-level page sections (e.g. dashboard title). |
| `"medium"` | Subsections within a page inside a `page-section` wrapper, the default header of a `Card`, or denser drawer headers. |
| `"small"` | Drawer or panel section labels needing a more compact header. |
| `"xsmall"` | The most compact section label density, for tightly constrained panels. |

### `flush` prop

| Value | Use when |
|-------|----------|
| `false` (default) | The header sits in page flow or a Card header — it owns its own horizontal inset and aligns to the AppShell content edge. |
| `true` | Body content below has no horizontal padding and must align with the title — e.g. accordion disclosure rows, full-bleed lists or tables inside a `page-section` wrapper that already provides the outer inset. |

## Spatial contract

- **Owns its padding:** yes — by default `SectionHeader` is edge-to-edge and owns its own internal `padding-inline`. Set `flush` when sibling body content is also flush so the title aligns without double inset.
- **Owns its margin:** no — vertical rhythm between a `SectionHeader` and the body below it must be applied on the surrounding `page-section` wrapper (`--space-*` tokens), never on the header itself.
- **Fills its container:** yes — it is full-width by design and must sit directly in the page flow or as a direct child of `Card`.
- **Notes:** Never wrap `SectionHeader` in a padded container, and never add `padding`, `margin`, `width`, or `minWidth` to its parent — this causes double padding and horizontal misalignment/overflow. `AppShell` main content already provides the outer inset; `SectionHeader` aligns to that content edge on its own.

## Composition rules

- ✅ Can be used inside: direct page flow, a `page-section` wrapper, as the header of `Card`.
- ❌ Never place inside: a parent with its own `padding`, `minWidth`, or fixed `width` — breaks the edge-to-edge contract.
- ❌ Never place inside: `DataTable` cells.
- ❌ Never combine with: a `Card` title prop for main-content page-section titles — that's a `SectionHeader`-in-`page-section` job, not a `Card` job.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `size` | `'large' \| 'medium' \| 'small' \| 'xsmall'` | Choose per the density table above; defaults to `'medium'`. |
| `flush` | `boolean` | Set `true` when body content below has no horizontal padding and the title must align with it; defaults to `false`. |
| `leadingControl` | `React.ReactNode` | Set for an expand/collapse affordance or icon button preceding the title — non-element/boolean/null children are sanitized out automatically. |
| `trailingControl` | `React.ReactNode` | Set for action controls (buttons, tags, switchers) trailing the title — commonly a `ButtonGroup` for multiple actions. |
| `description` | `string` | Set when the section needs one line of supporting context under the title. |

## Common mistakes

1. **Wrapping `SectionHeader` in a padded div** — AI.md explicitly forbids this; it is edge-to-edge and owns its own `padding-inline`, so an outer padded wrapper causes double padding and overflow.
2. **Adding `padding`, `minWidth`, or a fixed `width` to a container that directly holds a `SectionHeader`** — same root cause as above; the parent must have none of these.
3. **Using a `Card` header (`title`/`showHeader`) as a page-section title for lists or detail blocks in main content** — AI.md requires `SectionHeader` inside a `page-section` wrapper for that purpose instead.
4. **Using a raw `<h2>`/`<h3>` to divide content sections instead of `SectionHeader`** — AI.md states `SectionHeader` must be used to divide content sections.
5. **Applying vertical spacing (`--space-*`) directly on the `SectionHeader` instead of the `page-section` wrapper** — rhythm between header and body belongs on the wrapper, not the header.
6. **Repeating the entity name in a `SectionHeader` title on a detail page** — when the entity name already appears as the current breadcrumb item in the navbar, use the page body for metadata and content instead of a duplicate page title.

## Examples

```tsx
// Most common usage — top-level page title
<SectionHeader title="Dashboard" size="large" />

// Non-obvious case — subsection inside a page-section wrapper, with trailing actions
<div className="page-section">
  <SectionHeader
    title="Activity"
    size="medium"
    trailingControl={<Button variant="ghost" size="md">View all</Button>}
  />
// Non-obvious case — flush header above full-bleed list content inside a page-section wrapper
<div className="page-section">
  <SectionHeader title="Activity" size="medium" flush />
  {/* list or table with no horizontal padding */}
</div>
```
