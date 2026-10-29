# Breadcrumbs

**Tier:** molecule
**Location:** `src/components/molecules/Breadcrumbs/Breadcrumbs.spec.md`
**Version:** 2.0.0

## What it is

Breadcrumbs show the user's current location within a hierarchical structure and provide quick navigation back to any ancestor level. They are a wayfinding tool, not a primary navigation pattern.

## When to use

- Use when the product has a clear hierarchy of at least three levels and users navigate between levels frequently
- Use for file or folder paths, settings hierarchies, and content category drill-downs

## When NOT to use

- Do not use when the hierarchy is flat — two levels do not warrant breadcrumbs
- Do not use when the product uses single-level navigation
- Do not use when the user arrived via deep link and the path is not meaningful in context
- Do not use when space is too constrained for even a truncated trail

## Variant selection

### Size

| Value | Use when |
|-------|----------|
| `sm` (default) | Inside page content — sub-section hierarchy only |
| `lg` | Page-level trail inside `Navbar variant="breadcrumbs"` — replaces the page title on detail views |

Never use `sm` for main navigation. Never use `lg` inside page content.

### Item variant

| Value | Use when |
|-------|----------|
| `Previous` | Any ancestor level — navigable link |
| `Current` | User's current location — never a link |
| `Ellipsis` | Middle levels collapsed when the trail overflows |


## Spatial contract

- **Owns its padding:** yes — internal trail spacing
- **Owns its margin:** no
- **Fills its container:** yes — trail spans available width with truncation as needed
- **Notes:** Place at the top of the content area, above the page title; not inside cards, modals, or drawers

## Composition rules

- ✅ Can be used inside: page headers, AppShell main content
- ❌ Never place inside: cards, modals, drawers
- ❌ Never use as the only navigation mechanism

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `items` | `BreadcrumbItem[]` | Full path root → current; last item defaults to `current`. Let the component collapse it rather than pre-slicing |
| `size` | `'sm' \| 'lg'` | `lg` only for the page-level trail in `Navbar`; default `sm` |
| `maxVisibleItems` | `number` | When the default `4` doesn't fit; must stay ≥ 3 for collapsing to engage |
| `showEllipsis` | `boolean` | Set `false` only when truncation is handled elsewhere |
| `onItemClick` | `(event, item, index) => void` | Centralized navigation handling for dynamically generated trails |
| item `href` | `string` | Renders the item as a link; omit and use `onClick` for router-driven navigation |
| item `showDisclosure` | `boolean` | `size="lg"` only — item opens a dropdown of sibling pages (renders a chevron) |

## Common mistakes

1. **Making the current item a link** — `Current` is plain text with `aria-current="page"`
2. **Truncating the current item** — the user must always see where they are
3. **Decorative separators read by screen readers** — mark separators `aria-hidden="true"`
4. **Looking for `BreadcrumbsLarge`** — it no longer exists; use `<Breadcrumbs size="lg" />`

## Examples

~~~tsx
<Breadcrumbs
  items={[
    { label: 'Projects', href: '/projects' },
    { label: 'Q4 campaign', href: '/projects/q4' },
    { label: 'Assets' }, // last item is current by default
  ]}
/>

// Page-level trail — usually rendered for you by Navbar variant="breadcrumbs"
<Breadcrumbs
  size="lg"
  items={[
    { label: 'Projects', onClick: goToProjects },
    { label: 'Q4 Campaign' },
  ]}
/>
~~~
