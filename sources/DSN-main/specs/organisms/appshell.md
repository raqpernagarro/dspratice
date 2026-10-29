{% raw %}
# AppShell, Navbar, Sidebar
<!--
Version: 1.0.1
Date: 2026-07-27
-->

`AppShell` is the **mandatory root layout wrapper** for every page. Never build layout manually with divs.

---

## AppShell

### When to use

Every page must use `AppShell`. It is the only permitted root layout. No exceptions.

### Critical — height chain

`AppShell` requires an unbroken height chain from `html` down to the wrapper div. Without it, scroll isolation breaks and the sidebar scrolls with the page.

```css
/* Required in app global CSS */
html, body { margin: 0; height: 100%; }
#root { height: 100%; display: flex; flex-direction: column; box-sizing: border-box; }
```

```tsx
// Always wrap AppShell in a full-height div — never add height to AppShell itself
<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell
    header={<Navbar ... />}
    sidebar={<Sidebar ... />}
  >
    {/* Page content goes directly here — no wrapper div needed */}
    {/* AppShell main area already applies padding: var(--space-md) on all sides */}
    <SectionHeader title="Dashboard" size="large" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>
      {/* sections here */}
    </div>
  </AppShell>
</div>
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `header` | ReactNode | Yes | Pass `<Navbar />` only |
| `sidebar` | ReactNode | No | Pass `<Sidebar />` only |
| `children` | ReactNode | Yes | Main page content — placed directly, no wrapper |
| `rightPanel` | ReactNode | No | Optional secondary panel |
| `footer` | ReactNode | No | Optional footer |

### Built-in padding

AppShell's main area already applies `padding: var(--space-md)` (16px) on all sides. Never add an extra padding wrapper around page content inside AppShell.

### Rules

- `AppShell` is always the root — no exceptions
- Never build layout with raw divs
- Never add `height`, `min-height`, or sizing directly to `<AppShell>`
- Only the content area scrolls — sidebar and navbar are always fixed
- Never pass `collapsed` to `Sidebar` — AppShell injects it automatically

---

## Navbar

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'title' \| 'breadcrumbs'` | `'title'` | `'title'` for top-level pages, `'breadcrumbs'` for detail views |
| `title` | string | `'Title'` | Page title, sentence case |
| `rightActions` | ReactNode | — | Primary CTA, always rightmost |
| `leftActions` | ReactNode | — | Secondary actions on the left |
| `breadcrumbItems` | array | — | Required when `variant="breadcrumbs"` |
| `showDescription` | boolean | false | Show subtitle below title |
| `description` | ReactNode | — | Subtitle content |

### Top-level page

```tsx
<Navbar
  variant="title"
  title="Dashboard"
  rightActions={<Button variant="primary" size="md">New project</Button>}
/>
```

### Detail view

```tsx
<Navbar
  variant="breadcrumbs"
  breadcrumbItems={[
    { id: 'projects', label: 'Projects' },
    { id: 'current', label: 'Project Alpha', variant: 'current' },
  ]}
  rightActions={<Button variant="primary" size="md">Save changes</Button>}
/>
```

### CTA hierarchy — right side, left to right

Ghost → Secondary → **Primary** (primary always rightmost, maximum one per view)

```tsx
rightActions={
  <>
    <Button variant="ghost" size="md">Export</Button>
    <Button variant="secondary" size="md">Import</Button>
    <Button variant="primary" size="md">New project</Button>
  </>
}
```

### Rules

- Never show back arrow on top-level pages (Dashboard, Projects, Tasks, People, Notes)
- Back arrow only appears on detail views via `variant="breadcrumbs"`
- Primary CTA always in `rightActions` — never inside a Card, never floating
- Never use `position: fixed` or `position: absolute` on any Button
- All titles and labels: sentence case always
- Never add an in-page back button on a detail view when breadcrumb navigation is in the navbar — back navigation belongs in the breadcrumb trail and back control only
- Never show a separate title navbar on detail views — the breadcrumb trail is the page title

---

## List and detail navigation

Always implement list-to-detail navigation at the app shell level. Selection state lives in the app shell; the detail component receives the selected entity as a prop.

| View | Navbar | Sidebar |
|---|---|---|
| List page | `variant="title"` | Parent item selected (e.g. "Projects") |
| Detail page | `variant="breadcrumbs"` | Same parent item still selected |

### Rules

- Always lift selected-entity state to the app shell — never swap list and detail views inside the list page component.
- Always use `Navbar variant="title"` on list pages and `Navbar variant="breadcrumbs"` on detail pages.
- Always pass the selected entity to the detail component as a prop from shell state.
- Always keep the parent sidebar item selected on both list and detail routes.
- Never implement in-page back navigation (e.g. "All projects") as the primary pattern — back navigation belongs in the navbar breadcrumb and back control only.
- Never repeat the entity name in a `SectionHeader` on a detail page when it already appears as the current breadcrumb item.

```tsx
// ✅ CORRECT — shell-level list and detail
function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <AppShell
      header={
        selectedProject ? (
          <Navbar
            variant="breadcrumbs"
            breadcrumbItems={[
              { id: 'projects', label: 'Projects', onClick: () => setSelectedProject(null) },
              { id: 'current', label: selectedProject.name, variant: 'current' },
            ]}
          />
        ) : (
          <Navbar variant="title" title="Projects" rightActions={...} />
        )
      }
      sidebar={<Sidebar sections={sectionsWithProjectsSelected />} />
    >
      {selectedProject ? (
        <ProjectDetail project={selectedProject} />
      ) : (
        <ProjectsList onSelectProject={setSelectedProject} />
      )}
    </AppShell>
  );
}
```

---

## Sidebar

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `sections` | SidebarSection[] | Yes | Nav item sections |
| `selectorProps` | object | Yes | Workspace selector at top |
| `showSearch` | boolean | No | Show search bar |
| `searchSlot` | ReactNode | No | Pass `<SearchBar />` when `showSearch` is true |
| `bottomContent` | ReactNode | No | Settings + User pinned to bottom |

**Never pass `collapsed` — AppShell controls it automatically.**

### Sidebar structure — always in this order

1. Workspace selector — via `selectorProps`
2. Search bar — via `showSearch` + `searchSlot`
3. Main navigation items — via `sections`
4. Settings + User Name — via `bottomContent` (always pinned to bottom)

### SidebarSection shape

```ts
{
  id: string
  title?: string
  items: SidebarMenuItem[]
}
```

### SidebarMenuItem shape

```ts
{
  id: string
  label: string           // sentence case always
  icon?: ReactNode        // lucide-react icon at size={16}
  selected?: boolean      // true for the active page — keep parent item selected on both list and detail routes
  onClick?: () => void
  showBadge?: boolean
  badgeCount?: number
  badgeVariant?: BadgeVariant
  showAvatar?: boolean
  avatarProps?: AvatarProps
  buttonRef?: Ref<HTMLButtonElement>                 // popup triggers only — anchor for e.g. NotificationCenter
  'aria-haspopup'?: 'dialog' | 'menu' | 'listbox'    // set when the item opens a panel instead of navigating
  'aria-expanded'?: boolean
  'aria-controls'?: string
}
```

### SidebarMenuSelector variant

AppShell controls collapsed state. Mirror it in `bottomContent`:

```tsx
<SidebarMenuSelector variant={collapsed ? 'icon' : 'full'} label="Settings" ... />
<SidebarMenuSelector variant={collapsed ? 'icon' : 'full'} label="User Name" ... />
```

### Full example

```tsx
import { AppShell, Navbar, Sidebar, SidebarMenuSelector, Button, SearchBar } from 'ds-ngr';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, FileText, Settings } from 'lucide-react';

<div style={{ height: '100vh', display: 'flex' }}>
  <AppShell
    header={
      <Navbar
        variant="title"
        title="Dashboard"
        rightActions={<Button variant="primary" size="md">New project</Button>}
      />
    }
    sidebar={
      <Sidebar
        selectorProps={{
          label: 'WorkScope',
          avatarProps: {
            size: 'xs',
            variant: 'organization',
            fill: 'initials',
            initials: 'WS',
            name: 'WorkScope',
          },
        }}
        showSearch
        searchSlot={<SearchBar placeholder="Search" aria-label="Search" />}
        sections={[
          {
            id: 'main',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, selected: true, onClick: () => {} },
              { id: 'projects', label: 'Projects', icon: <FolderKanban size={16} />, onClick: () => {} },
              { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} />, onClick: () => {} },
              { id: 'people', label: 'People', icon: <Users size={16} />, onClick: () => {} },
              { id: 'notes', label: 'Notes', icon: <FileText size={16} />, onClick: () => {} },
            ],
          },
        ]}
        bottomContent={
          <>
            <SidebarMenuSelector
              variant="full"
              label="Settings"
              showIcon
              icon={<Settings size={16} />}
              onClick={() => {}}
            />
            <SidebarMenuSelector
              variant="full"
              label="User Name"
              showAvatar
              avatarProps={{ size: 'xs', fill: 'initials', initials: 'UN', name: 'User Name' }}
              onClick={() => {}}
            />
          </>
        }
      />
    }
  >
    <SectionHeader title="Dashboard" size="large" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>
      {/* sections here */}
    </div>
  </AppShell>
</div>
```

### Rules

- Only include sidebar items explicitly specified — never invent extra sections
- Never add Automations, Agents, Bookmarked, or other invented nav items
- Never pass `collapsed` prop manually
- Always keep the parent sidebar item selected on both list and detail routes (e.g. "Projects" selected for both the projects list and a single project detail view)
- Never deselect the parent nav item when navigating from list to detail
{% endraw %}
