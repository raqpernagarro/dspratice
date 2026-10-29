# CustomViewTab

**Tier:** atom
**Location:** `src/components/atoms/CustomViewTab/CustomViewTab.spec.md`
**Version:** 1.0.0

## What it is

A `role="tablist"` row for **user-defined, removable views** — saved filters, custom table views, or named display presets — with an optional inline "add view" `Button` after the tab row. Each tab can carry a leading icon, a remove affordance, and an associated `role="tabpanel"` when `showPanels` is true.

## When to use

- Use when users can create, name, and remove their own views on top of the same underlying data (e.g. saved filter tabs above a `DataTable`).
- Use when each view is a distinct named section the user switches between, and views are expected to be added or removed over time.
- Use with `showPanels={false}` when the tab row only drives external content (the table or chart below updates based on `value` / `onChange`).

## When NOT to use

- Do not use for fixed, product-defined navigation sections → use `Tab` instead (no add/remove affordances).
- Do not use when switching is a display preference with no distinct content panel and no user-created views → use `SegmentControl` instead.
- Do not use when the goal is filtering the same content inline → use `Chip` or a filter panel instead.
- Do not mix `CustomViewTab` items and `Tab` items in the same row — all tabs in a group must be the same type.
- `CustomViewTabs` is an alias export (`export const CustomViewTabs = CustomViewTab`) — same component and props; do not treat it as a separate API.

## Variant selection

`CustomViewTab` has no visual `variant` prop. Behavior is controlled by item-level flags and layout props.

### `showPanels` prop

| Value | Use when |
|-------|----------|
| `true` (default) | Each tab's `panel` renders in a `role="tabpanel"` below the row |
| `false` | The tab row only drives external state — typical for saved views above a `DataTable` |

### `CustomViewTabItem.removable`

| Value | Use when |
|-------|----------|
| `true` (default) | User may delete this view |
| `false` | View must persist (e.g. a system default tab) |

## Spatial contract

- **Owns its padding:** yes — the tab list row, add button wrap, and each panel manage their own internal layout.
- **Owns its margin:** no — place it within the parent's normal layout flow (typically directly above the content it controls).
- **Fills its container:** yes — the tab row spans the width of its container; overflow tabs scroll horizontally within the list.
- **Notes:** The selected tab's panel must render directly below the tab row when `showPanels` is true.

## Composition rules

- ✅ Can be used inside: page content areas above `DataTable`, filterable list headers, dashboard view switchers.
- ❌ Never place inside: another tab list — do not nest `CustomViewTab` inside `Tab` or another `CustomViewTab`.
- ❌ Never combine with: `Tab` items in the same row — use one tab component type per group.
- Pair with `DataTable` or other main content via controlled `value` / `onChange` when `showPanels={false}`.

## Removal contract

- **Keyboard path:** with focus on a tab (`role="tab"`), press **`Delete`** to remove it. This calls `onRemove` with that tab's `value`.
- **Mouse path:** the visible **X** control on each removable tab is a mouse-only affordance. It is `aria-hidden="true"` and is not in the keyboard focus order — do not expose it as the primary remove action for assistive tech or document it as a focusable button.
- Consumers must implement `onRemove` to update `tabs` and selection state when a view is deleted.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `tabs` | `CustomViewTabItem[]` | Each item needs `value`, `label`; set `panel` when `showPanels` is true |
| `value` / `defaultValue` / `onChange` | `string` / `string` / `(value: string) => void` | Controlled or uncontrolled selection |
| `onRemove` | `(value: string) => void` | Required when tabs are `removable` — handle Delete key and mouse X |
| `addActionLabel` / `onAddAction` | `string` / `() => void` | Set together to show the trailing "add view" ghost `Button` |
| `showPanels` | `boolean` | `false` when content lives outside the component (typical with `DataTable`) |
| `CustomViewTabItem.removable` | `boolean` | `false` for views that cannot be deleted |
| `CustomViewTabItem.removeAriaLabel` | `string` | Not used for the aria-hidden X — reserved for future use; keyboard remove uses the tab label context |

## Common mistakes

1. **Expecting the X button to be keyboard-focusable** — removal for keyboard users is **Delete** on the focused tab only; the X is mouse-only and `aria-hidden`.
2. **Using `CustomViewTab` for static product navigation** — use `Tab` when views are fixed and not user-created.
3. **Mixing `Tab` and `CustomViewTab` in one row** — pick one component for the entire tab group.
4. **Omitting `onRemove` while tabs are removable** — Delete and the mouse X both no-op without a handler.
5. **Treating `CustomViewTabs` as a different component** — it is the same export under another name.

## Examples

```tsx
// Saved views above a DataTable — panels rendered elsewhere
<CustomViewTab
  tabs={savedViews}
  value={activeViewId}
  onChange={setActiveViewId}
  onRemove={handleRemoveView}
  addActionLabel="Add view"
  onAddAction={handleAddView}
  showPanels={false}
  aria-label="Saved views"
/>
<DataTable columns={columns} rows={filteredRows} />

// With inline panels
<CustomViewTab
  tabs={[
    { value: 'all', label: 'All items', panel: <AllItemsPanel />, removable: false },
    { value: 'mine', label: 'My items', panel: <MyItemsPanel /> },
  ]}
  defaultValue="all"
  onRemove={(id) => setViews((views) => views.filter((v) => v.value !== id))}
  aria-label="Item views"
/>
```

## Interaction

- Click or tap a tab to select it. Arrow keys (`←`/`→`), `Home`, and `End` move focus between tabs. `Enter`/`Space` selects the focused tab.
- **`Delete`** on a focused removable tab calls `onRemove`.
- The trailing add `Button` is a separate focus stop — it does not participate in tab arrow-key navigation.

## Accessibility

- `role="tablist"` on the list container, `role="tab"` on each tab trigger, `role="tabpanel"` on each panel when `showPanels` is true.
- Selected tab: `aria-selected={true}`, `tabIndex={0}`; others: `tabIndex={-1}`.
- Remove X control: `aria-hidden="true"` — not announced; keyboard users use **Delete** on the tab.
- Disabled tabs: `aria-disabled="true"`, `tabIndex={-1}`.
