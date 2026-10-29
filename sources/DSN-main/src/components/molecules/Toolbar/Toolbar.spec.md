# Toolbar

**Tier:** molecule
**Location:** `src/components/molecules/Toolbar/Toolbar.spec.md`
**Version:** 1.1.0  
**Date:** 2026-10-09

## What it is

A two-sided action row (`role="toolbar"`) with left and right slots that auto-normalizes the size and variant of `Button` and `Checkbox` children it contains.

## When to use

- Use as the bottom bar of `Card`, `Modal`, or `Drawer` via their built-in `bottomBar*` props
- Use standalone on top of a list or section (`DataTable`, kanban board, list) — always with `variant="filter-bar"`, placed outside the table or board component
- Use one anchored `PopoverMenu` trigger per multi-value filter dimension (status, assignee, etc.) — see MultiSelectAnchored pattern in `specs/molecules/popover.md`

## When NOT to use

- Do not mount a standalone `Toolbar` inside `Card`, `Modal`, or `Drawer` content to act as a footer → use the organism's own `bottomBarLeftActions` / `bottomBarRightActions` / `bottomBar` props instead
- Do not use for a single icon-only persistent toggle control → use `ToggleButton` instead
- Do not use for view-switching tabs → use `SegmentControl` or `Tabs` instead
- Do not model multi-value toolbar filters as a single `Select` with an "All" sentinel empty option → use `PopoverMenu` with checkbox-cell sections and Confirm/Cancel

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"default"` | Toolbar at the **bottom** of a section — `Card`/`Modal`/`Drawer` bottom bar. Renders an upward elevation shadow separating it from the content above |
| `"filter-bar"` | Any toolbar on **top** of a list or section — search/filter row above a `DataTable`, kanban board or list. View switcher and ghost `SearchBar` on the left, filter controls on the right. Looks like a bottom bar — same background, padding and compact single row — with no elevation shadow |
| `"plain"` | A minimal, chrome-light toolbar context |

### `size` prop

| Value | Use when |
|-------|----------|
| `"lg"` (default) | Standard bottom bar density |
| `"md"` | Denser footer, e.g. filter bars |
| `"sm"` | Compact contexts; child `Button`/`Checkbox` are normalized to `sm` |

## Spatial contract

- **Owns its padding:** yes — internal layout and gap between left/right action groups are managed by `Toolbar` itself.
- **Owns its margin:** no — it does not space itself from siblings; place it within normal layout flow (e.g. above `DataTable`, or via an organism's bottom-bar slot).
- **Fills its container:** yes — splits into left/right sides spanning the available width.
- **Notes:** Never add `padding`/`margin` directly to a `Toolbar` instance — it is pre-built chrome inside `Card`/`Modal`/`Drawer`. Toolbar buttons are **never full width by default** — a lone action keeps its content width, aligned to its slot. Pass `singleActionFullWidth` only when a design explicitly calls for a stretched single action. Auth and other stacked CTAs use `Button fullWidth` inside a `Form`, not a `Card` bottom bar.

## Composition rules

- ✅ Can be used inside: `Card`, `Modal`, `Drawer` (via their bottom-bar props, not by manual mounting); standalone above `DataTable` as a filter bar
- ✅ For multi-value filter dimensions: one `PopoverMenu` trigger per dimension using the MultiSelectAnchored pattern — rich variant, checkbox-cell sections, Confirm/Cancel bottom bar
- ❌ Never place inside: `Card`/`Modal`/`Drawer` content as a manually-mounted footer — use the organism's bottom-bar props
- ❌ Never combine with: a custom `padding`/`margin`/`gap` override on the `Toolbar` element itself — it is pre-built chrome
- ❌ Never use a single `Select` with an "All" empty option for multi-select toolbar filtering — empty checkbox selection means no filter applied

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `leftActions` / `rightActions` | `React.ReactNode` | Pass `Button`/`Checkbox` elements — their `size` and `variant` are auto-normalized to match the Toolbar's `size`. A `SearchBar` is forced to `variant="ghost"` (no label or helper row; `label` becomes its `aria-label`). In `filter-bar`, a `SegmentControl` (view switcher) is forced to hug its content (`fullWidth={false}`) |
| `variant` | `"default" \| "filter-bar" \| "plain"` | `"filter-bar"` whenever the toolbar sits on top of a list or section; `"default"` for bottom bars |
| `singleActionFullWidth` | `boolean` | Default `false` — buttons hug their content. Opt in only when a lone action must span the bar |

## Common mistakes

1. **Mounting a standalone `Toolbar` inside `Card`, `Modal`, or `Drawer` content** — AI.md and the patterns specs require using the organism's built-in `bottomBarLeftActions`/`bottomBarRightActions`/`bottomBar` props instead; a manually mounted Toolbar duplicates chrome.
2. **Adding `padding`/`margin`/`gap` directly to a `Toolbar` instance** — AI.md explicitly forbids styling pre-built chrome like `Toolbar` and `SectionHeader` this way.
3. **Mounting `Toolbar` inside `DataTable`** — the filter bar is a sibling above `DataTable`, never inside it; `DataTable` has no toolbar prop.
4. **Using `Select` with an "All" sentinel for multi-value filters** — use `PopoverMenu` with checkbox-cell sections; empty selection means no filter applied.
5. **Omitting `showTrailingIcon: false` on checkbox-cell filter items** — `Checkbox` defaults `showTrailingIcon` to true and shows a placeholder trailing icon when none is provided; always set both `showLeadingIcon: false` and `showTrailingIcon: false` when icons are not needed.
6. **Using `variant="default"` for a toolbar on top of a list or section** — `default` casts an upward elevation shadow meant for bottom bars; a toolbar on top of a list or section is always `variant="filter-bar"`, which has no shadow.
7. **Putting a labeled `SearchBar` in a filter bar** — a filter bar is a compact row like a bottom bar; the search is always ghost with `aria-label`. `Toolbar` forces this, but write it that way.
8. **Using a custom filter row for board views** — always use `variant="filter-bar"` with view switcher and search on the left and filter controls on the right, matching sibling list pages in the same feature area.

## Examples

```tsx
// Most common usage — Card/Modal/Drawer bottom bar via built-in props
<Card
  bottomBarLeftActions={<Checkbox label="Select all" showTrailingIcon={false} />}
  bottomBarRightActions={
    <>
      <Button variant="ghost" size="md">Cancel</Button>
      <Button variant="primary" size="md">Confirm</Button>
    </>
  }
/>

// Non-obvious case — standalone filter bar above DataTable
<Toolbar
  variant="filter-bar"
  size="md"
  leftActions={<SearchBar variant="ghost" placeholder="Search filters" aria-label="Search filters" />}
  rightActions={
    <>
      <Button variant="secondary" size="md">Clear</Button>
      <Button variant="primary" size="md">Apply</Button>
    </>
  }
/>
```
