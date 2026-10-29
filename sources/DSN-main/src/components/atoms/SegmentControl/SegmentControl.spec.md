# SegmentControl

**Tier:** atom
**Location:** `src/components/atoms/SegmentControl/SegmentControl.spec.md`
**Version:** 2.0.0  
**Date:** 2026-10-09

## What it is

A `role="radiogroup"` of equal-width selectors that switches between mutually exclusive views or display modes, taking effect immediately with no content panels and no confirmation step.

## When to use

- Use when the user needs to switch between a small number (2–5) of mutually exclusive views or display modes that take effect instantly
- Use for display-mode toggles: "List"/"Grid"/"Map", "Chart"/"Table"
- Use for time-range or filter-scope selection: "Day"/"Week"/"Month", "Mine"/"Team"/"All"

## When NOT to use

- Do not use when there are more than 5 options → use `Select` or `Tabs` instead
- Do not use when the options represent named content sections with distinct panels → use `Tabs` instead
- Do not use when the selection requires confirmation before taking effect → use `Radio` instead
- Do not use when the options are binary and represent a setting → use `Switcher` instead
- Do not use when the options are filters that can stack or combine → use `Chip` instead

## Variant selection

### `fullWidth` prop

| Value | Use when |
|-------|----------|
| `false` (default) | Hugs its content. **Always** use in large containers (page sections, cards, panels) and in any bar that holds several other controls — e.g. a `Toolbar variant="filter-bar"` with a search and filters. Never full-width or fixed-width there |
| `true` | Spans its container. Only when it is the **sole element of a small bar or panel** (e.g. a popover's segment slot, a narrow side panel) **or shares that bar with one or two actions** |

## Spatial contract

- **Owns its padding:** yes — the grouped container and each selector manage their own internal spacing.
- **Owns its margin:** no — it does not space itself from siblings; place it within a toolbar or page header row using normal layout spacing.
- **Fills its container:** no by default (hugs content); yes only with `fullWidth`.
- **Never** set a fixed `width` on a SegmentControl — it either hugs content or fills a small bar via `fullWidth`.
- **Notes:** All selectors within a group must be equal width — the control should feel like a unified unit, not a loose collection.

## Composition rules

- ✅ Can be used inside: a toolbar or page header row, typically right-aligned or centered above the content area it controls
- ❌ Never place inside: the middle of body content → it belongs in a toolbar or control bar
- ❌ Never combine with: a Segment control used as a substitute for navigation — it controls presentation, not destination

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `options` | `SegmentControlOption[]` | Limit to 5 options maximum; all options must be at the same level of abstraction (don't mix view modes with actions/settings) |
| `value` / `defaultValue` / `onChange` | `string` / `string` / `(value: string) => void` | Use `value`+`onChange` for controlled selection; `defaultValue` for uncontrolled |
| `fullWidth` | `boolean` | Set `true` only when the control is alone in a small bar/panel, or shares it with one or two actions. Inside `Toolbar variant="filter-bar"` it is forced to `false` |
| `SegmentControlOption.disabled` | `boolean` | Use sparingly, consistent with other disabled-option guidance in the DS |

## Common mistakes

1. **Using SegmentControl for options with distinct content panels** — AI.md explicitly requires `Tabs` in this case.
2. **Using more than 5 options** — the control becomes unwieldy at that width; use `Select` or `Tabs` instead.
3. **Replacing SegmentControl with plain text or custom buttons** — AI.md forbids reimplementing this pattern manually.
4. **Stretching it in a filter bar or large container** — a view switcher next to a search and filters must hug its content; `fullWidth` or a fixed width there makes it dominate the bar.
4. **Mixing view modes with actions or settings in the same group** — all options must be at the same level of abstraction.
5. **Using SegmentControl as a navigation substitute** — it changes presentation/mode, not the page or route.

## Examples

```tsx
// Most common usage — display mode toggle
<SegmentControl
  options={[
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
  ]}
  defaultValue="list"
  aria-label="View mode"
/>

// Non-obvious case — content-sized control with leading icons
<SegmentControl
  options={[
    { value: 'chart', label: 'Chart', showLeadingIcon: true, leadingIcon: <ChartIcon /> },
    { value: 'table', label: 'Table', showLeadingIcon: true, leadingIcon: <TableIcon /> },
  ]}
  fullWidth={false}
  value={view}
  onChange={setView}
  aria-label="Data representation"
/>
```

## Placement

- Place the Segment control near the content it affects — directly above or in the header of the content area it controls.
- Align it consistently: typically right-aligned in a toolbar or page header row, or centered above a content area.
- Do not place a Segment control in the middle of body content.
- In mobile contexts, ensure the full control is visible without horizontal scrolling.

## Interaction

- Clicking or tapping a selector activates it immediately — no confirmation step.
- Only one selector can be active at a time.
- Keyboard: `Tab` moves focus into the control. Arrow keys (`←`/`→`) move focus between selectors. `Enter`/`Space` activates the focused selector.

## Accessibility

- Use `role="radiogroup"` on the container with an `aria-label` describing what is being controlled (e.g. `aria-label="View mode"`).
- The active selector has `aria-checked="true"`; all others `false`.
- Disabled selectors must have `aria-disabled="true"`.
- Arrow key navigation moves focus and selection together within the group.

## Content guidelines

- Selector labels: 1–2 words, short nouns or noun phrases.
- All options must be parallel in structure — all nouns, all adjectives, or all verb phrases. Never mixed.
- Use sentence case: "List view" not "List View".
- Avoid icon-only selectors unless universally understood and paired with an `aria-label`.
- Do not truncate labels — if a label needs truncating, rewrite it.
