# Navbar

**Tier:** organism  
**Location:** `src/components/organisms/Navbar/Navbar.spec.md`  
**Version:** 1.0.0

## What it is

The page header bar rendered in the `AppShell` `header` slot, showing either a page title (with optional description) or a large breadcrumb trail, plus left and right action slots.

## When to use

- Use as the `header` of every `AppShell` page
- Use `variant="title"` on top-level pages (Dashboard, Projects, Tasks, People, Notes) and list pages
- Use `variant="breadcrumbs"` on detail views — a single record or child page
- Use `rightActions` to hold the page's primary CTA

## When NOT to use

- Do not use as a section title inside page content → use `SectionHeader` instead (NAV-11)
- Do not use for in-content hierarchy trails → use `Breadcrumbs size="sm"` inside the content instead (NAV-06)
- Do not use as the header of a `Card`, `Modal` or `Drawer` → use that component's own header props instead
- Do not render it outside `AppShell` → pass it to `AppShell` `header`

## Variant selection

### `variant` prop

Always set `variant` explicitly.

| Value | Use when |
|-------|----------|
| `"title"` (default) | Top-level and list pages. Renders the page name; no back arrow (NAV-03). |
| `"breadcrumbs"` | Detail views. Renders `Breadcrumbs size="lg"` — the trail IS the page title, never show both (NAV-05). |

### Responsive back-only mode

| Setting | Use when |
|-------|----------|
| `responsiveCollapse` on (default) | Default for `"breadcrumbs"` — the trail shortens as the viewport narrows and becomes a back button plus current title at the back-only breakpoint |
| `responsiveCollapse={false}` | Only when the host app handles narrow layouts itself |

## Spatial contract

- **Owns its padding:** yes — never add inline padding to `Navbar` (LCB-03)
- **Owns its margin:** no
- **Fills its container:** yes — spans the full width of the `AppShell` header region
- **Notes:** it is fixed by `AppShell`; only main content scrolls. Never position buttons inside it with `position: fixed/absolute` (NAV-08).

## Composition rules

- ✅ Can be used inside: `AppShell` `header` only
- ✅ `rightActions` order, left to right: Ghost → Secondary → Primary; Primary always rightmost, maximum one per view (NAV-09)
- ✅ `NotificationCenter` goes in `rightActions`, to the left of the primary CTA
- ❌ Never place inside: `Card`, `Modal`, `Drawer` or page content
- ❌ Never combine with: an in-page back button or "All projects" link on a detail view — back navigation belongs in the breadcrumb trail and back control only (NAV-05b)
- ❌ Never combine with: a `SectionHeader` repeating the entity name already shown as the current breadcrumb (NAV-05c)

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `variant` | `'title' \| 'breadcrumbs'` | Always — see Variant selection |
| `title` | `ReactNode` | With `variant="title"` — sentence case (NAV-12) |
| `breadcrumbItems` | `BreadcrumbItem[]` | Required with `variant="breadcrumbs"`. Start from the immediate parent, not Home; last item `variant: 'current'` (NAV-07) |
| `showDescription` + `description` | `boolean` + `ReactNode` | Only for a one-line subtitle under a `"title"` navbar; both are required for it to render |
| `rightActions` | `ReactNode` | Page CTAs — see Composition rules |
| `leftActions` | `ReactNode` | Secondary leading controls, e.g. the mobile menu button that opens a navigation `Drawer` |
| `onBackClick` | `() => void` | With `variant="breadcrumbs"` — handles the back button shown in responsive back-only mode |
| `backLabel` | `string` | When "Back" is not a specific enough accessible name |

## Common mistakes

1. **Back arrow on a top-level page** — see Variant selection (NAV-03).
2. **Title navbar plus breadcrumbs on a detail view** — the trail is the title; see Variant selection (NAV-05).
3. **Primary CTA inside a Card or floating** — see When to use and Composition rules (NAV-08).
4. **More than one Primary button, or Primary not rightmost** — see Composition rules (NAV-09).
5. **Breadcrumb trail starting at Home** — see Props reference (NAV-07).
6. **Title case titles** — see Props reference (NAV-12).
7. **Omitting `variant`** — always set it explicitly; see Variant selection.

## Examples

```tsx
// Most common usage — top-level page
<Navbar
  variant="title"
  title="Projects"
  rightActions={
    <>
      <Button variant="secondary" size="md">Import</Button>
      <Button variant="primary" size="md">New project</Button>
    </>
  }
/>

// Non-obvious: detail view with back control on narrow viewports
<Navbar
  variant="breadcrumbs"
  breadcrumbItems={[
    { id: 'projects', label: 'Projects', onClick: () => setSelected(null) },
    { id: 'current', label: project.name, variant: 'current' },
  ]}
  onBackClick={() => setSelected(null)}
  rightActions={<Button variant="primary" size="md">Save changes</Button>}
/>
```
