# TabNav

**Tier:** atom
**Location:** `src/components/atoms/Tab/TabNav.spec.md`
**Version:** 1.0.0

## What it is

A tab-styled row of links for moving between pages: a `<nav>` landmark whose items are real links, with the current page marked by `aria-current="page"`. It looks exactly like `Tab` but behaves like navigation — no tablist, no panels, no roving focus.

## When to use

- Use when each item goes to a different page or route (site sections, app areas, sub-pages of a record such as "Overview", "Activity", "Settings" with their own URLs)
- Use for a product or docs site's primary section bar

## When NOT to use

- Do not use to switch panels inside the same page → use `Tab` instead
- Do not use for a display-preference toggle → use `SegmentControl` instead
- Do not use for more than 6–7 destinations → use a sidebar nav instead
- Do not use for a hierarchical trail back to parent pages → use `Breadcrumbs` instead

## Variant selection

`TabNav` has no visual `variant` prop; it shares `Tab`'s styling. Choose between the two by behaviour, not looks:

| Each item… | Use |
|------------|-----|
| changes the URL / loads another page | `TabNav` |
| reveals a panel on the same page | `Tab` |

## Spatial contract

- **Owns its padding:** yes — the row's inset and each item's internal padding.
- **Owns its margin:** no — place it within the parent's layout flow.
- **Fills its container:** yes — the row and its bottom border span the container width. Override alignment (e.g. centring) through `className`.

## Composition rules

- ✅ Can be used inside: page headers, record headers, site headers
- ❌ Never combine with: `Tab` items in the same row
- ❌ Never place inside: a `Tab` panel to fake nested tabs

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `items` | `TabNavItem[]` | Each item needs `href` and `label` (noun/noun phrase) |
| `TabNavItem.current` | `boolean` | Set on the item for the page the user is on — exactly one item when the page belongs to the row |
| `aria-label` | `string` | Required — names the landmark ("Main", "Project sections") so it can be told apart from other `<nav>`s |
| `linkAs` | `React.ElementType` | Pass the router's link component (e.g. Next.js `Link`) to keep client-side navigation and prefetching; defaults to `a` |
| `TabNavItem.leadingIcon` / `trailingIcon` | `ReactNode` | Lucide icon, shown with `showLeadingIcon` / `showTrailingIcon`; always decorative (`aria-hidden`) |

## Accessibility

- Renders `<nav aria-label>` → `<ul>` → `<li>` → link, so screen readers announce a navigation landmark and a list of N links.
- The current page uses `aria-current="page"`, never `aria-selected` — `aria-selected` only has meaning inside a tablist.
- Every link is in the normal Tab order; Arrow keys are not intercepted. Links keep native behaviour (open in new tab, copy link, middle-click).

## Common mistakes

1. **Using `Tab` with `showPanels={false}` plus a router push for page navigation** — screen readers announce "tab, 2 of 5" for something that loads a new page, arrow-key roving hides links from the Tab order, and items lose link behaviour. Use `TabNav`.
2. **Forgetting `current`** — without it no item is marked, and assistive tech cannot tell which page the user is on.
3. **Marking several items `current`** — only the page the user is on is current.
4. **Using verbs in labels** — labels are nouns ("Settings", not "Edit settings").

## Examples

```tsx
// Plain links
<TabNav
  aria-label="Project sections"
  items={[
    { href: '/projects/42', label: 'Overview', current: true },
    { href: '/projects/42/activity', label: 'Activity' },
    { href: '/projects/42/settings', label: 'Settings' },
  ]}
/>

// With a router link (Next.js)
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const pathname = usePathname();
<TabNav
  aria-label="Main"
  linkAs={Link}
  items={SECTIONS.map((s) => ({ ...s, current: pathname.startsWith(s.href) }))}
/>
```
