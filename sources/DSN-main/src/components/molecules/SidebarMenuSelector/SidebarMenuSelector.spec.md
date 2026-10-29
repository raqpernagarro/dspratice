# SidebarMenuSelector

**Tier:** molecule  
**Location:** `src/components/molecules/SidebarMenuSelector/SidebarMenuSelector.spec.md`  
**Version:** 1.0.0

## What it is

A sidebar row button with an icon or avatar, a label, and optional badge, disclosure chevron and trailing action, in a full-width or icon-only variant.

## When to use

- Use in `Sidebar` `bottomContent` for the Settings and User Name rows
- Use as the workspace selector at the top of `Sidebar` via `selectorProps` (or the `selector` slot)
- Use when a sidebar row opens a panel such as `NotificationCenter` — set `buttonRef` and the `aria-*` popup props

## When NOT to use

- Do not use for main navigation items → use `Sidebar` `sections` items instead; Sidebar renders the rows for you
- Do not use for rows in a dropdown or popover menu → use `MenuCell` (inside `PopoverMenu`) instead
- Do not use outside a sidebar as a generic button → use `Button` instead
- Do not use for in-page navigation → use `TabNav` instead

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"full"` (default) | The sidebar is expanded — icon or avatar plus label |
| `"icon"` | The sidebar is collapsed — icon or avatar only; `label` becomes the accessible name |

In `bottomContent`, mirror the collapsed state injected by `AppShell`: `variant={collapsed ? 'icon' : 'full'}`.

### Leading visual

| Option | Use when |
|-------|----------|
| `showIcon` + `icon` | Settings, actions and destinations — a lucide-react icon at size 16 |
| `showAvatar` + `avatarProps` | The row represents a person (User Name) or an organization (workspace selector) |

## Spatial contract

- **Owns its padding:** yes — the row owns its inset and height
- **Owns its margin:** no
- **Fills its container:** yes — full variant spans the sidebar width
- **Notes:** `selected` adds a selection rail; badge, disclosure and trailing action render in `"full"` only.

## Composition rules

- ✅ Can be used inside: `Sidebar` (`bottomContent`, `selector`)
- ✅ `rightButton` accepts: a small ghost icon `Button` for a row-level action (e.g. add)
- ❌ Never place inside: page content, `Card` or `PopoverMenu`
- ❌ Never hand-build sidebar rows — use this component

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Always — sentence case |
| `icon` | `ReactNode` | Every row unless `showAvatar` is on — when omitted the icon slot is empty, and the `icon` variant would show nothing |
| `showDisclosure` | `boolean` | Workspace selector only — signals a switcher menu |
| `showBadge` + `badgeCount` | `boolean` + `number` | Unread or pending counts (e.g. notifications) |
| `showRightButton` + `rightButton` | `boolean` + `ReactNode` | A row-level action; both are required for it to render |
| `selected` | `boolean` | The row represents the current page |
| `buttonRef`, `aria-haspopup`, `aria-expanded`, `aria-controls` | — | Only when the row opens a popup panel; pass `buttonRef` as the panel's `anchorRef` |

## Common mistakes

1. **`bottomContent` rows not mirroring collapsed state** — see Variant selection.
2. **Missing Settings or User Name rows in `bottomContent`** — see When to use (NAV-02).
3. **Hand-built sidebar rows** — see Composition rules.

## Examples

```tsx
// Most common usage — Sidebar bottomContent
<>
  <SidebarMenuSelector variant={collapsed ? 'icon' : 'full'} label="Settings" showIcon icon={<Settings size={16} />} onClick={openSettings} />
  <SidebarMenuSelector
    variant={collapsed ? 'icon' : 'full'}
    label="User Name"
    showAvatar
    avatarProps={{ size: 'xs', fill: 'initials', initials: 'UN', name: 'User Name' }}
    onClick={openProfile}
  />
</>

// Non-obvious: workspace selector
<SidebarMenuSelector
  label="Acme Inc."
  showAvatar
  avatarProps={{ size: 'xs', variant: 'organization', fill: 'initials', initials: 'AC', name: 'Acme Inc.' }}
  showDisclosure
  onClick={openWorkspaceMenu}
/>
```
