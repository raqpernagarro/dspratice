# Sidebar

**Tier:** organism  
**Location:** `src/components/organisms/Sidebar/Sidebar.spec.md`  
**Version:** 1.0.0

## What it is

The primary navigation rail rendered in the `AppShell` `sidebar` slot: a workspace selector, optional search, sectioned navigation items, and bottom-pinned content, with an icon-only collapsed mode.

## When to use

- Use as the `sidebar` of an `AppShell` whenever the app has primary, cross-page navigation
- Use a section `title` with `showDisclosure` when a group of items should be collapsible
- Use a section `trailingAction` for a small action tied to that group (e.g. add a project)
- Use `actions` for one or more primary sidebar actions (e.g. New chat) — they render as full-width secondary buttons below the workspace selector
- Use an item with `buttonRef` and `aria-haspopup` when it opens a panel such as `NotificationCenter` instead of navigating

## When NOT to use

- Do not use for in-page sub-navigation between views of one page → use `TabNav` instead
- Do not use as a standalone menu of actions → use `PopoverMenu` instead
- Do not render it in page content or outside `AppShell` → pass it to `AppShell` `sidebar`; on mobile, render it inside a left `Drawer`
- Do not hand-build sidebar rows → use `SidebarMenuSelector` for `bottomContent` and the `sections` items API for navigation

## Variant selection

Sidebar has no `variant` prop. Collapsed mode is injected by `AppShell` — never set it yourself.

### Section options

| Option | Use when |
|-------|----------|
| No `title` | A single ungrouped list of main navigation items |
| `title` | Items form a named group |
| `title` + `showDisclosure` | The named group should be collapsible |
| `trailingAction` | The group has one related action |
| `separator: 'before' \| 'after' \| 'both'` | A visual divider is needed between groups |

### Section recipes

Every sidebar is built from these section types. A richer sidebar means more of these recipes, never ad-hoc sections. Add a section only when the task's app has that kind of content.

| Recipe | Shape | Items | Example |
|-------|-------|-------|---------|
| **Primary** | First section, no `title` | Top-level pages, lucide icon each; badge for unread counts | Dashboard, Inbox (3), Projects, Tasks |
| **Pinned / favourites** | `title` + `showDisclosure` + `trailingAction` (ghost `+` button, `size="sm"`), `separator: 'before'` | Records the user pinned; organization `Avatar` with initials | Pinned projects: Billing revamp, Data platform |
| **Groups** | `title` + `showDisclosure` | Teams, spaces or clients the user belongs to; organization `Avatar` with initials | Teams: Design, Frontend, QA |
| **Recent** | `title` + `showDisclosure` | App-generated history, newest first; one icon for all | Recent: chat threads, viewed records |

- Order: Primary → Pinned → Groups → Recent. Settings, Help and the user never go in a section — they go in `bottomContent`.
- When the selected page is a pinned record (e.g. a project's board), select the pinned row, not the Primary item.
- `templates/dashboard.jsx` (and the other workspace templates) show Primary + Pinned + Groups + `bottomContent`; `templates/ai-chat.jsx` shows Pinned + Recent.

## Spatial contract

- **Owns its padding:** yes — header, nav and bottom regions own their insets
- **Owns its margin:** no
- **Fills its container:** yes — fills the `AppShell` sidebar column; `AppShell` owns its width, resize and collapse
- **Notes:** `bottomContent` is pinned to the bottom. The sidebar never scrolls with page content (LCB-01).

## Composition rules

- ✅ Can be used inside: `AppShell` `sidebar`, or a left `Drawer` for mobile navigation
- ✅ Structure, top to bottom, never deviate: workspace selector (`selectorProps`) → search (`showSearch` + `searchSlot`) → main navigation (`sections`) → Settings and User Name (`bottomContent`) (NAV-02)
- ✅ `searchSlot` accepts: `SearchBar`
- ✅ `bottomContent` accepts: `SidebarMenuSelector` rows, mirroring the injected collapsed state with `variant={collapsed ? 'icon' : 'full'}`
- ❌ Never combine with: a manual `collapsed` prop when inside `AppShell` — AppShell injects it
- ❌ Never add invented navigation items or sections (e.g. Automations, Agents, Bookmarked) — include only items the task specifies, shaped by a [section recipe](#section-recipes)

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `sections` | `SidebarSection[]` | Always — only the items explicitly specified |
| `actions` | `SidebarAction[]` | Primary actions below the selector — secondary buttons, not nav rows |
| `selectorProps` | `SidebarMenuSelectorProps` | Always — set `label` and `avatarProps` for the workspace |
| `selector` | `ReactNode` | Only to replace the default workspace selector entirely |
| `showSearch` + `searchSlot` | `boolean` + `ReactNode` | When navigation search is needed — pass a `SearchBar`; both are required for it to render |
| `bottomContent` | `ReactNode` | Always — Settings and User Name (Help above them if the app has it) |
| item `label` | `string` | Sentence case always |
| item `icon` | `ReactNode` | A lucide-react icon at size 16 |
| item `selected` | `boolean` | The active page's parent item — keep it selected on both list and detail routes (NAV-05d) |
| item `buttonRef`, `aria-haspopup`, `aria-expanded`, `aria-controls` | — | Only for items that open a popup panel; pass `buttonRef` as the panel's `anchorRef` |

## Common mistakes

1. **Passing `collapsed` manually** — see Composition rules.
2. **Inventing nav items or sections** — see Composition rules.
3. **Deselecting the parent item on a detail route** — see Props reference (NAV-05d).
4. **Wrong section order or missing Settings / User Name** — see Composition rules (NAV-02).
5. **`bottomContent` rows not mirroring collapsed state** — see Composition rules.

## Examples

```tsx
// Most common usage
<Sidebar
  selectorProps={{
    label: 'WorkScope',
    avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'WS', name: 'WorkScope' },
  }}
  showSearch
  searchSlot={<SearchBar placeholder="Search" aria-label="Search" />}
  sections={[{
    id: 'main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, selected: true, onClick: goDashboard },
      { id: 'projects', label: 'Projects', icon: <FolderKanban size={16} />, onClick: goProjects },
    ],
  }]}
  bottomContent={
    <>
      <SidebarMenuSelector variant="full" label="Settings" showIcon icon={<Settings size={16} />} />
      <SidebarMenuSelector variant="full" label="User Name" showAvatar avatarProps={{ size: 'xs', fill: 'initials', initials: 'UN', name: 'User Name' }} />
    </>
  }
/>

// Non-obvious: an item that opens NotificationCenter instead of navigating
{
  id: 'notifications',
  label: 'Notifications',
  icon: <Bell size={16} />,
  showBadge: true,
  badgeCount: unread,
  buttonRef: notificationsRef,
  'aria-haspopup': 'dialog',
  'aria-expanded': open,
  'aria-controls': 'notifications-panel',
  onClick: () => setOpen((v) => !v),
}
```
