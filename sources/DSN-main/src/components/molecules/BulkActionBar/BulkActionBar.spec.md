# BulkActionBar

**Tier:** molecule  
**Location:** `src/components/molecules/BulkActionBar/BulkActionBar.spec.md`  
**Version:** 1.0.0

## What it is

A floating `role="toolbar"` bar that shows how many items are selected, the actions that apply to the whole selection, and a button to clear the selection.

## When to use

- Use when one or more rows are selected in a multi-select `DataTable` or list and actions apply to all of them (LCB-06b)
- Use `hasDropdown` on an action that opens a menu of further options (e.g. Move to…)

## When NOT to use

- Do not use when nothing is selected → render nothing; do not show a disabled bar
- Do not use for page-level actions that don't depend on a selection → use `Navbar` `rightActions` instead
- Do not use for filter and view controls above a table → use `Toolbar` instead
- Do not use for actions on a single row → use row-level ghost `Button`s or the row's menu instead

## Variant selection

BulkActionBar has no `variant` prop.

### Per-action options

| Option | Use when |
|-------|----------|
| default | A regular bulk action (Export, Assign, Archive) |
| `destructive` | The action deletes or removes the selected items |
| `hasDropdown` | The action opens a menu instead of running immediately |
| `disabled` | The action exists but cannot apply to the current selection |

## Spatial contract

- **Owns its padding:** yes
- **Owns its margin:** no
- **Fills its container:** no — it sizes to its content
- **Notes:** it does not position itself and accepts only `className`. Place it in an absolutely positioned wrapper inside a `position: relative` container around the `DataTable`, centered near the bottom with spacing tokens.

## Composition rules

- ✅ Can be used inside: a positioned wrapper next to the `DataTable` it acts on
- ❌ Never place inside: the `DataTable` itself, a `Card`, or the `Navbar`
- ❌ Never position via props or inline styles on the component — position the wrapper

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `selectedCount` | `number` | Always — the live selection size; render the bar only when it is above 0 |
| `actions[].label` | `string` | Count-aware: "Delete 3", not "Delete" |
| `onDismiss` | `MouseEventHandler` | Always — must clear the entire selection |
| `onCountClick` | `MouseEventHandler` | When the count button should open a selection summary or select-all menu |
| `actions[].aria-label` | `string` | When the label alone is ambiguous for screen readers |

## Common mistakes

1. **Rendering with zero selected** — see Props reference (LCB-06b).
2. **Positioning the component instead of a wrapper** — see Spatial contract (LCB-06b).
3. **Static action labels** — labels must be count-aware; see Props reference (LCB-06b).
4. **`onDismiss` only hiding the bar** — it must clear the selection; see Props reference (LCB-06b).

## Examples

```tsx
// Most common usage
<div style={{ position: 'relative' }}>
  <DataTable ... />
  {selectedCount > 0 && (
    <div style={{ position: 'absolute', bottom: 'var(--space-md)', left: '50%', transform: 'translateX(-50%)' }}>
      <BulkActionBar
        selectedCount={selectedCount}
        onDismiss={clearSelection}
        actions={[
          { label: `Export ${selectedCount}`, icon: <Download size={16} />, onClick: exportSelected },
          { label: `Delete ${selectedCount}`, icon: <Trash2 size={16} />, destructive: true, onClick: confirmDelete },
        ]}
      />
    </div>
  )}
</div>

// Non-obvious: an action that opens a menu
{ label: 'Move to', icon: <FolderInput size={16} />, hasDropdown: true, onClick: openMoveMenu }
```
