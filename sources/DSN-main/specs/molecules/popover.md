# Popover
<!--
Version: 1.0.0
Date: 2026-06-25
-->

A popover is an overlay triggered by an explicit user action — a click or tap — that displays richer content anchored to the triggering element. Unlike a tooltip, it is intentional, persistent until dismissed, and can contain structured content and interactive elements.

---

## When to use

Use a popover when you need to surface **contextual content or actions** that are related to a specific element, without navigating away or opening a full modal.

Typical uses:
- Displaying a definition, explanation, or detail about a specific term or element
- Showing a compact action menu anchored to a trigger
- Providing a contextual form or set of options (e.g. a date picker trigger, filter options, a quick-edit panel)
- Surfacing a preview of related content without leaving the current context

**Do not use a popover when:**
- The content is a single short sentence with no interaction → use Tooltip instead
- The action or content is important enough to demand full attention and block the rest of the UI → use Modal instead
- The content is a persistent panel that the user will interact with over an extended period → use a Drawer instead
- The trigger is part of a navigation structure and the content is a navigation menu → use a dedicated navigation component

---

## Tooltip vs Popover vs Modal vs Drawer

| Component | Trigger | Blocks background | Persistent | Interactive content |
|---|---|---|---|---|
| **Tooltip** | Hover / Focus | No | No — auto-dismisses | No |
| **Popover** | Click / Tap | No | Yes — until dismissed | Yes |
| **Modal** | Click / Tap | Yes | Yes — until dismissed | Yes |
| **Drawer** | Click / Tap | Partial | Yes — until dismissed | Yes |

Use Popover when the content is contextual and secondary — the user can still see and interact with the background. Use Modal when the content requires focused attention and the background must be blocked.

---

## Types

### Popover container
A free-form container for custom content. Use this when the content doesn't fit the structured menu pattern — a definition, a rich explanation, a compact form, a preview. Content scrolls if it overflows.

### Simple popover menu
A flat list of menu items with no grouping or hierarchy. Use for compact action menus with 2–6 options where no additional structure is needed.

### Complex popover menu
A structured menu with sections, headings, or mixed item types. Use when the menu requires grouping, mixed content types, or a longer list of options. The content area is scrollable.

> Use the simplest type that serves the content. Don't use Complex popover menu for a list of 3 flat options.

---

## Placement

For rich anchored menus (MultiSelect with sections, deferred Cancel/Confirm), use `PopoverMenu` with `anchorRef` — not `PopoverMenu` nested inside another `PopoverWrapper`. See Storybook **Overlays/PopoverMenu → MultiSelectAnchored** for the supported integration pattern. Portal and outside-click dismiss rules for the underlying primitive: `src/components/molecules/PopoverWrapper/PopoverWrapper.spec.md`.

### MultiSelectAnchored pattern (toolbar filters)

Use this pattern for anchored multi-select toolbar filters (status, assignee, priority, etc.):

- Use `PopoverMenu` `variant="rich"` with a Select-style trigger, checkbox-cell `choiceLists` sections, and `showBottomBar` with Cancel/Confirm.
- Always use checkbox-cell choice list items — never model multi-select filtering as a single `Select` with an "All" sentinel empty option.
- Treat empty checkbox selection as no filter applied — do not add a dedicated "All" option to represent unfiltered state.
- Always set `showLeadingIcon: false` and `showTrailingIcon: false` on checkbox-cell items when no icons are needed.

- Always open popovers below the trigger.
- Flip above only when the content does not fit below and there is more room above.
- When the content fits neither side, open on the roomier side.
- Never let a popover overlap its own trigger — shrink it to fit the chosen side instead.
- Always cap popover height at the smaller of `var(--popover-height-max)` and the space available on the side the popover opens on.
- Always keep the popover header, segment, search and bottom bar pinned — only the content area scrolls.
- Never set `max-height` or `overflow` on popover content in a consuming component — `PopoverWrapper` owns both.
- Always show a search field in the popover when a list has more than 10 items. `Select` does this automatically (`searchable` overrides it); `PopoverMenu` needs `showSearch` set explicitly.
- Never pass `searchable={false}` to a `Select` with more than 10 options. Use `Combobox` for free-text or async option sets.
- The arrow (if present on the container type) points to the triggering element, maintaining the visual association.
- Popovers should not be triggered from within another popover — nested popovers create unpredictable layering and focus management issues.
- Avoid triggering popovers from within modals where possible. If necessary, ensure focus management is handled explicitly.
- On mobile, consider whether a bottom sheet is a more appropriate pattern than a popover — anchored overlays are harder to use on small screens.

---

## Interaction

- A popover opens on **click or tap** of its trigger. It does not open on hover.
- Once open, the popover remains visible until explicitly dismissed.
- Dismissal methods:
  - Clicking or tapping anywhere outside the popover
  - Pressing `Escape`
  - Clicking the trigger again (toggle behavior)
  - Completing or cancelling an action within the popover (where applicable)
- The popover does not block the background — the user can scroll or interact with content behind it, though this will typically dismiss the popover.
- For menu types, selecting an item should close the popover automatically.
- For container type with forms or multi-step content, close the popover only when the user explicitly confirms or cancels — do not auto-close on outside click if the user has unsaved input.

---

## Accessibility

- The trigger element must have `aria-haspopup="true"` and `aria-expanded="true/false"` to communicate the popover's state to assistive technologies.
- When the popover opens, focus must move into it — specifically to the first interactive element, or to the popover container itself if there are no interactive elements.
- Always move focus into anchored popovers with `focusWithoutScroll`, and use `scrollIntoPopoverView` to reveal an option without focusing it — never call `element.focus()` or `element.scrollIntoView()` directly on popover content, as both scroll the page to the portal.
- When the popover closes, focus must return to the triggering element.
- `Escape` must close the popover and return focus to the trigger.
- For menu types, use `role="menu"` on the container and `role="menuitem"` on each item. Arrow key navigation must move focus between items within the menu.
- For container type with free-form content, use `role="dialog"` with `aria-label` or `aria-labelledby` describing the popover's purpose.
- Ensure the popover is not clipped by `overflow: hidden` containers — this is a common implementation issue that breaks both visual and keyboard accessibility.

---

## Content guidelines

**Popover container:**
- Include a title if the content's purpose is not immediately clear from context.
- Keep body content concise — popovers are supplementary, not a replacement for a full page. If the content is growing, consider whether a Drawer or a dedicated page is more appropriate.
- Links within popover content should open in the same tab unless they navigate to a completely external resource.

**Simple and complex popover menus:**
- Menu item labels follow the same rules as Button labels — start with a verb when the item triggers an action: "Edit", "Duplicate", "Archive".
- For navigation items (items that lead somewhere rather than do something), use noun or noun-phrase labels: "Settings", "Team members".
- Group destructive actions (Delete, Remove) visually separate from constructive ones, and place them last in the list.
- Use sentence case throughout.
- Limit simple menus to 6 items maximum. Beyond 6, use Complex popover menu with grouping, or reconsider the information architecture.
