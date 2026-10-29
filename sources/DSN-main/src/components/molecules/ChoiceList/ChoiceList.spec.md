# ChoiceList

**Tier:** molecule
**Location:** `src/components/molecules/ChoiceList/ChoiceList.spec.md`
**Version:** 1.0.0

## What it is

A sectioned, `role="group"` list of mixed selectable rows — `MenuCell` (action/navigation), `Checkbox`, or `Radio` cells — with optional section headers and optional roving-tabindex keyboard navigation across menu cells.

## When to use

- Use for menu-like selection surfaces where rows may be a mix of kinds (plain menu actions, checkboxes, radios) grouped into labeled sections — e.g. a filter panel, a settings menu inside a popover, a column-visibility picker.
- Use `enableMenuKeyboardNavigation` when the list behaves like a menu (opened from a trigger, arrow-key navigable) rather than a static form field.

## When NOT to use

- Do not use for a simple single-selection form field → use `SingleChoice` instead.
- Do not use for a simple multi-selection form field → use `MultiChoice` instead.
- Do not use for a flat list of plain actions with no selection state → use a plain list of `MenuCell`s or `PopoverMenu` instead.

## Variant selection

### Item `kind` field

| Value | Use when |
|-------|----------|
| `"menu-cell"` | The row triggers an action or navigation, not a persisted selection. |
| `"checkbox-cell"` | The row represents an independent boolean toggle within the section. |
| `"radio-cell"` | The row is part of a mutually-exclusive choice within the section. |

## Spatial contract

- **Owns its padding:** yes — sections, section headers, and item rows are all laid out internally.
- **Owns its margin:** no — spacing relative to surrounding content (e.g. inside a `PopoverWrapper`) must come from the parent layout.
- **Fills its container:** yes — stretches to the parent's width.
- **Notes:** `showSectionHeaders` controls whether each section's `SectionHeader` (`size="small"`) renders — sections without a meaningful title should set this `false` rather than passing an empty `title`.

## Composition rules

- ✅ Can be used inside: `PopoverWrapper`/`PopoverMenu` content, filter panels, settings drawers.
- ✅ Composes `MenuCell`, `Checkbox`, `Radio`, and `SectionHeader` internally per item `kind` — configure via each item's `props`, not by mounting these atoms separately inside `ChoiceList`.
- ❌ Never mix `ChoiceList` with `SingleChoice`/`MultiChoice` for the same conceptual group — `ChoiceList` is for mixed-kind, menu-style sectioned lists; `SingleChoice`/`MultiChoice` are for simple single-kind form fields.
- ❌ Never rely on `radio-cell` items across different sections to be mutually exclusive automatically — grouping/exclusivity across sections must be coordinated by the caller via shared state, since each section is its own `role="group"`.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `sections` | `ChoiceListSection[]` | Each section needs a unique `id`, `title`, and an `items` array of mixed-kind entries. |
| `enableMenuKeyboardNavigation` | `boolean` | Set `true` when the list is opened as a menu (e.g. from a trigger button) and should support arrow-key/Home/End navigation across `menu-cell` items. |
| `onMenuEscape` | `() => void` | Set alongside `enableMenuKeyboardNavigation` to close the containing popover/menu on `Escape`. |
| `showSectionHeaders` | `boolean` | Set `false` when section titles are only used for `aria-label` grouping, not visible headers. |
| `variant` | `'default' \| 'switchers' \| 'checkbox' \| 'radio'` | Figma: Choice list `Variant`. Renders every row with the same control and overrides each item's `kind`; omit to mix row kinds. |

## Common mistakes

1. **Using `ChoiceList` for a simple single-kind form field** — use `SingleChoice`/`MultiChoice` instead, which are purpose-built for that simpler case.
2. **Expecting `radio-cell` items in different sections to be mutually exclusive automatically** — each section is an independent `role="group"`; cross-section exclusivity must be coordinated by the caller.
3. **Setting `enableMenuKeyboardNavigation` without `onMenuEscape`** — leaves the menu with no way to close via keyboard when used as a popover-triggered menu.
4. **Mounting `MenuCell`/`Checkbox`/`Radio` directly as children instead of via the `items` array** — `ChoiceList` renders these internally per item `kind`; direct children bypass its section/keyboard-navigation logic.

## Examples

```tsx
// Most common usage — settings menu with mixed sections
<ChoiceList
  title="View settings"
  sections={[
    {
      id: 'display',
      title: 'Display',
      items: [
        { id: 'compact', kind: 'radio-cell', props: { label: 'Compact', checked: density === 'compact' } },
        { id: 'comfortable', kind: 'radio-cell', props: { label: 'Comfortable', checked: density === 'comfortable' } },
      ],
    },
    {
      id: 'actions',
      title: 'Actions',
      items: [{ id: 'export', kind: 'menu-cell', props: { label: 'Export view' } }],
    },
  ]}
/>

// Non-obvious case — keyboard-navigable menu inside a popover
<ChoiceList
  sections={menuSections}
  enableMenuKeyboardNavigation
  onMenuEscape={() => setOpen(false)}
/>
```
