# AppShell

**Tier:** organism  
**Location:** `src/components/organisms/AppShell/AppShell.spec.md`  
**Version:** 1.0.0

## What it is

The mandatory root layout wrapper for every DS-Ngr page: a resizable, collapsible sidebar column, a fixed header region, and a scroll-isolated main content area, with optional right panel and footer.

## When to use

- Use as the root of every page — it is the only permitted root layout (NAV-01)
- Use for centered content pages (auth, onboarding, confirmation) too — AppShell still wraps the page; only the content column is capped (LCB-11)
- Use `rightPanel` when the page needs a persistent secondary column beside the main content
- Use `bodyHeader` for full-width sticky UI that must stay flush under the navbar instead of scrolling with the content

## When NOT to use

- Do not build page layout with raw flex/grid divs → use `AppShell` instead; there is no alternative root layout
- Do not nest an `AppShell` inside another `AppShell` or inside a `Modal`/`Drawer` → use `Drawer` or `Modal` for secondary surfaces
- Do not use `rightPanel` for transient, dismissible detail content → use `Drawer` instead
- Do not render navigation in the main area on mobile → keep `AppShell` and open the `Sidebar` inside a left `Drawer` from a `Navbar` `leftActions` menu button (see the `MobileWithDrawer` story)

## Variant selection

AppShell has no `variant` prop. Its behaviour is chosen by which slots are filled and whether sidebar state is controlled.

### Slots

| Slot | Use when |
|-------|----------|
| `header` | Always — pass `<Navbar />` only, with `variant` set explicitly |
| `sidebar` | The app has primary navigation — pass `<Sidebar />` only |
| `bodyHeader` | Full-width sticky UI must sit under the navbar and not scroll |
| `rightPanel` | A persistent secondary column is part of the page layout |
| `footer` | A persistent footer bar is part of the page layout |
| `children` | Always — page content, placed directly with no wrapper |

### Sidebar state

| Mode | Use when |
|-------|----------|
| Uncontrolled (omit `sidebarWidth` / `sidebarCollapsed`) | Default — AppShell manages resize and collapse internally |
| Controlled (`sidebarWidth` + `onSidebarWidthChange`, `sidebarCollapsed` + `onSidebarCollapsedChange`) | Width or collapsed state must persist (e.g. to storage) or be driven by app state |

## Spatial contract

- **Owns its padding:** yes — the main area applies built-in padding on all sides; never add a padding wrapper inside `children` (LCB-03)
- **Owns its margin:** no — it has none and must not be given any
- **Fills its container:** yes — it fills its parent's height; the parent must be a full-viewport flex wrapper and the height chain from `html` down must be unbroken, or scroll isolation breaks
- **Notes:** only the main content area scrolls — sidebar and header stay fixed (LCB-01). Never set `height`, `min-height` or sizing on `<AppShell>` itself. Direct children use full width, never fixed pixel widths (LCB-04).

## Composition rules

- ✅ Can be used inside: a full-viewport wrapper `<div style={{ height: '100vh', display: 'flex' }}>` only
- ✅ `header` accepts: `Navbar` only
- ✅ `sidebar` accepts: `Sidebar` only — AppShell injects `collapsed` and the collapsed-search handler into it
- ❌ Never place inside: another `AppShell`, `Card`, `Modal` or `Drawer` — it is the page root
- ❌ Never combine with: a manual `collapsed` prop on `Sidebar` — AppShell owns collapsed state
- ❌ Never place the primary CTA in `children` — it belongs in the `Navbar` `rightActions` (NAV-08)

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `header` | `ReactNode` | Always — a `Navbar` with explicit `variant` |
| `sidebar` | `ReactNode` | When the app has primary navigation — a `Sidebar` |
| `bodyHeader` | `ReactNode` | Sticky full-width UI that must stay flush under the header |
| `sidebarCollapsed` / `onSidebarCollapsedChange` | `boolean` / `(next) => void` | Only to control or persist collapsed state |
| `sidebarWidth` / `onSidebarWidthChange` | `number` / `(next) => void` | Only to control or persist the expanded width |
| `minSidebarWidth` / `maxSidebarWidth` | `number` | Only when the default resize bounds don't fit the app's navigation labels |
| `aria-label` | `string` | When the default "Application shell" label is not descriptive enough |

## Common mistakes

1. **Raw div root layout** — see When NOT to use (NAV-01).
2. **Missing full-height wrapper** — the sidebar and navbar scroll with the page; see Spatial contract.
3. **Padding wrapper inside `children`** — doubles the built-in inset; see Spatial contract (LCB-03).
4. **Passing `collapsed` to `Sidebar`** — see Composition rules.
5. **Sticky toolbar inside scrolling content** — put it in `bodyHeader` instead; see When to use.
6. **Swapping list and detail views inside a page component** — selection state belongs at the AppShell level; see `Navbar` spec and NAV-05a.

## Examples

```tsx
// Most common usage
<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell
    header={<Navbar variant="title" title="Dashboard" rightActions={<Button variant="primary" size="md">New project</Button>} />}
    sidebar={<Sidebar selectorProps={...} sections={...} bottomContent={...} />}
  >
    <SectionHeader title="Overview" size="large" />
    {/* sections */}
  </AppShell>
</div>

// Non-obvious: persisted sidebar width and collapsed state
<AppShell
  header={<Navbar variant="title" title="Projects" />}
  sidebar={<Sidebar sections={sections} />}
  sidebarWidth={width}
  onSidebarWidthChange={setWidth}
  sidebarCollapsed={collapsed}
  onSidebarCollapsedChange={setCollapsed}
>
  {children}
</AppShell>
```
