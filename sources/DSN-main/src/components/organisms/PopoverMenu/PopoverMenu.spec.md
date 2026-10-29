# PopoverMenu

**Tier:** organism
**Location:** `src/components/organisms/PopoverMenu/PopoverMenu.spec.md`
**Version:** 1.0.0

## What it is

An overlay triggered by an explicit click or tap that displays richer content anchored to the triggering element. Unlike a tooltip, it persists until dismissed and can contain structured content and interactive elements.

## When to use

- Use to surface contextual content or actions related to a specific element without navigating away or opening a full modal
- Use for compact action menus, contextual forms, filter panels, and content previews

## When NOT to use

- Do not use when the content is a single short sentence with no interaction → use `Tooltip` instead
- Do not use when the content demands full attention and must block the rest of the UI → use `Modal` instead
- Do not use when the content is a persistent panel the user interacts with over an extended period → use `Drawer` instead
- Do not use when the trigger is part of a navigation structure → use a dedicated navigation component

## Variant selection

| Value | Use when |
|-------|----------|
| `rich` | Structured content with headers, sections, or bottom bars — filter panels, multi-step confirmations |
| `simple` | Flat action menu with 2–6 options and no grouping |

For toolbar multi-select filters, use `PopoverMenu` `variant="rich"` with checkbox-cell `choiceLists`, `showBottomBar`, and Cancel/Confirm — see the MultiSelectAnchored story pattern. Filter popovers auto-render a header **Clear** control when any checkbox is selected; it clears the draft selection without closing the popover.

## Spatial contract

- **Owns its padding:** yes — panel chrome and menu item spacing are internal
- **Owns its margin:** no — positioned relative to trigger via `PopoverWrapper`
- **Fills its container:** no — anchored overlay with viewport-safe clamping
- **Notes:** Rich headers use `SectionHeader` (`data-size="medium"`). Consuming apps need `ds-ngr/global.css` for matching header height. Use `anchorRef` on a wrapper div when the trigger does not forward refs. Anchored menus reposition with their trigger on scroll by default (`repositionOnScroll`); pass `onExternalScroll` to dismiss instead, matching `Select`.

## Composition rules

- ✅ Can be used with: `Button`, Select-style triggers, toolbar filter controls
- ❌ Never nest `PopoverMenu` inside another open popover
- ❌ Never model multi-select filters as a single `Select` with an "All" sentinel option
- ❌ Never omit `showLeadingIcon: false` and `showTrailingIcon: false` on checkbox-cell items when no icons are needed

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `anchorRef` | `RefObject` | Required for anchored positioning — attach to a wrapper around the trigger |
| `showBottomBar` | `boolean` | Set for deferred Cancel/Confirm flows — do not auto-close on outside click with unsaved input |
| `choiceLists` | `ChoiceList[]` | Use checkbox-cell items for multi-select filter sections |
| `showClearFilters` | `boolean` | Auto-enabled for checkbox-cell filter popovers; shows Clear in the header when any filter is selected |
| `onClearFilters` | `() => void` | Called after the header Clear control resets all checkbox filters in the popover |
| `headerTrailingControl` | `React.ReactNode` | Override the auto-generated header trailing slot |
| `showSearch` | `boolean` | Set `true` whenever the list has more than 10 items — `PopoverMenu` never adds search automatically |

## Common mistakes

1. **Using tooltip for interactive content** — tooltips are hover-only and non-interactive
2. **Adding an "All" option to represent unfiltered state** — empty checkbox selection means no filter applied
3. **Clipping the panel inside `overflow: hidden` ancestors** — breaks keyboard access and visibility
4. **Omitting `showSearch` on lists with more than 10 items** — always set it; unlike `Select`, `PopoverMenu` does not add search automatically
5. **Setting `max-height` or `overflow` on menu content** — `PopoverWrapper` caps the height and scrolls only the content area; header, search and bottom bar stay pinned

## Examples

~~~tsx
<PopoverMenu
  variant="rich"
  anchorRef={triggerRef}
  choiceLists={filterSections}
  showBottomBar
  onConfirm={applyFilters}
/>
~~~
