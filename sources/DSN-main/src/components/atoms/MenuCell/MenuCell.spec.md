# MenuCell

**Tier:** atom  
**Location:** `src/components/atoms/MenuCell/MenuCell.spec.md`  
**Version:** 1.0.0

## What it is

A single menu row (`role="menuitem"` by default) with an optional icon or avatar, label, description, badge, tag, shortcut, check mark, trailing action or switch.

## When to use

- Use as the row of a custom menu or listbox only when `PopoverMenu`, `Select`, `Combobox` or `ChoiceList` cannot express the content — those components render MenuCell for you
- Use `variant="switcher"` for a menu row that toggles a setting in place
- Use `role="option"` with `aria-selected` when the row lives inside a `role="listbox"`

## When NOT to use

- Do not use to build a dropdown or action menu by hand → use `PopoverMenu` instead
- Do not use to build a select or picker → use `Select` or `Combobox` instead
- Do not use for a list of selectable options in a form → use `ChoiceList` instead
- Do not use for sidebar navigation rows → use `SidebarMenuSelector` instead
- Do not use for label–value rows in a detail panel → use `DataListCell` instead

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"default"` | An action or option row; `selected` shows a check mark |
| `"switcher"` | The row toggles a setting immediately; the row renders a `Switcher` |

### `destructive` prop

| Value | Use when |
|-------|----------|
| `false` (default) | Regular actions |
| `true` | The action deletes or removes something |

## Spatial contract

- **Owns its padding:** yes — the row owns its inset and height
- **Owns its margin:** no
- **Fills its container:** only with `fullWidth`; otherwise it keeps a fixed default menu width — set `fullWidth` when the menu container sets the width
- **Notes:** the menu container owns spacing between rows; never add gaps or padding to the cell.

## Composition rules

- ✅ Can be used inside: an element with `role="menu"` (default role) or `role="listbox"` (with `role="option"`)
- ✅ Rendered for you by: `PopoverMenu`, `Select`, `Combobox`, `ChoiceList`, `Pagination`, `PhoneInput`
- ❌ Never place inside: a container without a menu or listbox role — the `menuitem` role would be orphaned

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Always — sentence case, verb-led for actions |
| `showLeadingIcon` + `leadingIcon` | `boolean` + `ReactNode` | A lucide-react icon at size 16; set `showLeadingIcon={false}` when no icon is used |
| `showTrailingIcon` | `boolean` | Set `false` when no check mark or trailing icon is wanted |
| `showDescription` + `description` | `boolean` + `string` | A second line under the label; both are required |
| `shortcut` + `shortcutLabel` + `shortcutAriaLabel` | — | The action has a keyboard shortcut |
| `switcherChecked` + `onSwitcherChange` | `boolean` + callback | `variant="switcher"` |
| `role` + `aria-selected` | `AriaRole` + `boolean` | `role="option"` inside a listbox |
| `showButtons` + `actionIcon` + `actionAriaLabel` + `onActionClick` | `boolean` + `ReactNode` + `string` + callback | A secondary per-row action; pass a lucide-react icon at size 16 and a label naming the action (defaults: `Ellipsis`, "Open actions") |

## Common mistakes

1. **Hand-built menus from MenuCell rows** — see When NOT to use (Pattern 7, PopoverMenu).
2. **Leaving default icons on** — set `showLeadingIcon` and `showTrailingIcon` to `false` when no icons are needed; see Props reference.
3. **Orphaned `menuitem` role** — see Composition rules.

## Examples

```tsx
// Most common usage — inside a menu container
<div role="menu" aria-label="Project actions">
  <MenuCell label="Rename" leadingIcon={<Pencil size={16} />} showTrailingIcon={false} onClick={rename} />
  <MenuCell label="Delete" leadingIcon={<Trash2 size={16} />} showTrailingIcon={false} destructive onClick={confirmDelete} />
</div>

// Non-obvious: a listbox option
<div role="listbox" aria-label="Assignee">
  <MenuCell role="option" aria-selected={selected} selected={selected} label="Alex Chen" showAvatar showLeadingIcon={false} onClick={select} />
</div>
```
