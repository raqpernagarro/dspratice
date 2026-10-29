{% raw %}
# Drawer

**Tier:** organism
**Location:** `src/components/organisms/Drawer/Drawer.spec.md`
**Version:** 1.0.0

## What it is

A partial overlay or stacked side panel, with optional header (`SectionHeader`), content slot, and bottom action bar (`Toolbar`), for row detail, filter, and secondary-task views.

## When to use

- Use when the user needs more space than a popover but should retain partial context of the page behind it (row detail, filter set, quick edit)
- Use when the user clicks a table row to see details
- Use when there are 13+ filter options and a dedicated "Filters" panel is needed

## When NOT to use

- Do not use when the task needs exclusive focus with no background reference → use `Modal` instead
- Do not use when the content is a single short line → use `Tooltip` instead
- Do not use when the interaction is anchored to a trigger with a small menu → use `Popover` instead

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"overlay"` (default) | Drawer should float above the page content with a backdrop and focus trap, dismissible by overlay click or Escape |
| `"stacked"` | Drawer should render inline as a persistent side panel (`role="complementary"`) without a backdrop or focus trap, e.g. always-visible secondary panels |

### `placement` prop

| Value | Use when |
|-------|----------|
| `"right"` (default) | Standard drawer entry point, consistent with most detail/filter panels |
| `"left"` | The product's navigation or layout convention calls for a left-anchored panel |

## Spatial contract

- **Owns its padding:** yes — header, content, and bottom bar each manage their own internal spacing via `dsn-drawer-header`, `dsn-drawer-content`, `dsn-drawer-bottom-bar`.
- **Owns its margin:** yes — in `overlay` variant it is portaled to `document.body` and positioned independently of where `Drawer` is mounted in JSX; in `stacked` variant it renders inline and participates in normal layout flow.
- **Fills its container:** no for `overlay` (fixed overlay panel sized by `width`); yes for `stacked` (renders as a normal flow child sized by `width`, participates in surrounding flex/grid layout).
- **Notes:** `.dsn-drawer-content` is full-bleed; `DataListCell` rows inside it use `--space-md` horizontal padding to align with `SectionHeader` and `Toolbar`. Stack cells directly — no negative-margin wrapper. Custom non-list content should use the same `--space-md` horizontal inset.

## Composition rules

- ✅ Can be used inside: any component tree for `overlay` variant (portals to `document.body`); a layout container for `stacked` variant since it renders inline
- ❌ Never place inside: `Breadcrumbs` context — never place `Breadcrumbs` inside a Drawer
- ❌ Never combine with: a `max-width`-capped `DataListCell` stack inside drawer content — use a full-bleed list wrapper at full panel width instead

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `variant` | `"overlay" \| "stacked"` | Use `"stacked"` for always-visible secondary panels without a backdrop; otherwise use the default `"overlay"` |
| `placement` | `"left" \| "right"` | Set to `"left"` only when product convention requires a left-anchored panel |
| `width` | `number \| string` | Set to control panel width; default `"40%"` |
| `showToggle` / `toggleChecked` / `onToggleChange` | `boolean` / `boolean` / `(checked: boolean) => void` | Use when the drawer header needs an inline on/off control alongside the close button |
| `closeOnOverlayClick` / `closeOnEscape` | `boolean` | Set to `false` only for `overlay` variant when accidental dismissal must be prevented for a critical task |
| `showBottomBar` | `boolean` | Set to `false` when the drawer has no confirm/cancel actions (e.g. read-only detail view) |

## Common mistakes

1. **Capping a `DataListCell` stack in drawer content with an arbitrary `max-width`** — AI.md (LCB-06d) requires a full-bleed list wrapper that cancels the drawer content inset and uses the full available panel width.
2. **Placing `Breadcrumbs` inside a Drawer** — AI.md explicitly forbids placing Breadcrumbs inside cards, modals, or drawers.
3. **Using a Drawer when the task needs exclusive focus with no background reference** — use `Modal` instead, per AI.md's Drawer/Modal "never for" guidance.

## Examples

```tsx
// Most common usage — overlay drawer with row detail
<Drawer
  open={open}
  onOpenChange={setOpen}
  title="Task details"
  onCancel={() => setOpen(false)}
  onConfirm={handleSave}
/>

// Non-obvious case — stacked drawer with DataListCell metadata
<Drawer variant="stacked" title="Task details" showBottomBar={false}>
  <DataListCell alignment="inline" title="Status" description="In progress" showActions={false} />
</Drawer>
```

## Accessibility

- Overlay drawers use `role="dialog"` with focus trap; stacked drawers use `role="complementary"`.
- Always provide a dismiss control and support `Escape` when `closeOnEscape` is enabled.
- Focus moves into the drawer on open and returns to the trigger on close (overlay variant only).
{% endraw %}
