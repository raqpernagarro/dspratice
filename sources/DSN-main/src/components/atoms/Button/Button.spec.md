# Button

**Tier:** atom
**Location:** `src/components/atoms/Button/Button.spec.md`
**Version:** 1.0.1
**Date:** 2026-07-28

## What it is

A `<button>` element that triggers an action, with four visual-hierarchy variants, two sizes, optional leading/trailing icon slots, an inline keyboard-shortcut badge, and disabled/loading states.

## When to use

- Use when the user needs to trigger a one-off action — submitting a form, confirming a decision, opening a dialog, executing a command.
- Use when the action has a clear, instructable verb-led label ("Save changes", "Delete record", "Export as CSV").
- Use in a table cell when the action is `ghost` or `plain` variant, `sm` size only.
- Use for inline secondary row-level actions — reply, edit, delete, or similar compact utilities in lists, comment threads, or dense rows — with `variant="ghost"`, `size="sm"`, optional leading icon, and a short verb-led label.

## When NOT to use

- Do not use raw HTML `<button>` or hand-built button CSS when `Button` covers the action — consuming apps must not replicate DS button appearance with custom classes.
- Do not pass label text via a `label` prop — `Button` has no `label` prop; pass label text as `children`. Do not infer the API from form field components such as `TextInput` or `Select`.
- Do not use when the action navigates to another page without triggering anything → use a link instead.
- Do not use when the action toggles a setting on or off → use `Switcher` instead.
- Do not use when the action selects one option from a mutually exclusive set → use `SegmentControl` or `Tab` instead.
- Do not use for a persistent active/inactive icon control in a toolbar (bold, italic, view mode) → use `ToggleButton` instead.
- Do not use for a stacked icon+label control in a bottom toolbar or action panel → use `VerticalButton` instead.
- Do not use `variant="ghost"` as a quieter primary CTA — if the action is the main outcome of the view, use `secondary` or `primary` instead.
- Do not position a `Button` with `position: fixed` or `position: absolute` to create a floating action button → use `Navbar` `rightActions` instead.
- Do not mount a standalone `Button` beside `EmptyState` just to get a primary/secondary pair → use `EmptyState`'s `showMainCta` / `showSecondaryOption` instead.

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"primary"` | This is the single highest-priority action on the screen — object creation, the rightmost CTA in a `Navbar`. Maximum one per view; never two Primary buttons side by side unless they represent a mutually exclusive forced choice with equal consequence. |
| `"secondary"` | Supporting the primary action, or one of several equally-weighted actions where none deserves primary emphasis. |
| `"ghost"` | Low-emphasis utility actions — filtering, sorting, copying, inline editing, and inline secondary row-level actions (reply, edit, delete in lists or comment threads). Not a "quieter primary" — if the action matters as the main outcome, use `secondary`. |
| `"plain"` | Dismissive or secondary actions in space-constrained contexts ("Cancel", "Skip", "Learn more"). `sm` size only — never `md`. |

### `size` prop

| Value | Use when |
|-------|----------|
| `"md"` | Default. Use for every button that stands on its own on the page — page actions, form actions, a Copy button under a code block. |
| `"sm"` | Only when the button sits inside another component or control: inside an input, a table cell, a toolbar, a card or navbar action slot, a comment row. Required if `variant="plain"`. Never pick `sm` just to make a standalone button look lighter. |

### `destructive` prop

| Value | Use when |
|-------|----------|
| `true` | The action is irreversible or has significant consequences (delete, remove member, discard). Use sparingly — pair with `ghost` or `plain` for the dismissive action in a confirmation group, never with a second Primary. |
| `false` | All other actions. |

## Spatial contract

- **Owns its padding:** yes — padding is derived from `size` (`md` = 8px, `sm` = 4px via `control/button/inset/*` tokens). Do not wrap in an additional padded container expecting to control button height.
- **Owns its margin:** no — the component has no external margin; spacing between buttons in a group must be applied by the parent layout (e.g. flex `gap`).
- **Fills its container:** no — width is intrinsic to content plus padding; it does not stretch to fill a parent unless the parent forces it.
- **Notes:** Height is fully derived from padding + content line-height (no explicit `height` set) — changing `size` tokens changes height automatically.

## Composition rules

- ✅ Can be used inside: `Navbar` (`rightActions`), dialogs/modals, forms, toolbars, table cells (`ghost`/`plain`, `sm` only).
- ❌ Never place with `position: fixed` or `position: absolute` — there is no floating-action-button pattern in this system; use `Navbar` `rightActions` instead.
- ❌ Never combine two `primary` variant buttons in the same view/group — exactly one Primary action per view.
- ❌ Never combine a `destructive` Primary button with a non-destructive Primary button in the same group — two competing primaries with different intents.
- ❌ Never mount a standalone `Button` next to `EmptyState` to fake a primary/secondary pair — use `EmptyState`'s CTA props.

## Inline secondary actions

Canonical pattern for compact row-level actions that must not read as primary CTAs:

```tsx
<Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>

<Button variant="ghost" size="sm" showLeadingIcon leadingIcon={<Reply />}>Reply</Button>

<Button variant="ghost" size="sm" showLabel={false} leadingIcon={<Trash2 />} aria-label="Delete comment" />
```

- Always use `variant="ghost"` and `size="sm"`.
- Always pass label text as `children` — never as a `label` prop.
- Add `showLeadingIcon` and a Lucide icon when the icon aids scanability; omit the text label only when space is tight and `aria-label` names the action.
- Never substitute raw HTML `<button>` elements or custom button CSS classes.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'plain'` | Always set deliberately per the variant table above; defaults to `'primary'`. |
| `size` | `'sm' \| 'md'` | Set `'sm'` for dense/table contexts or whenever `variant="plain"` is used. |
| `destructive` | `boolean` | Set `true` only for irreversible/high-consequence actions; label must name what is destroyed (e.g. "Delete account"). |
| `loading` | `boolean` | Set while the triggered action is in flight; replaces leading icon with a spinner and sets `aria-busy`. |
| `showLabel` | `boolean` | Set `false` only for icon-only buttons, and always pair with `aria-label`. |
| `aria-label` | `string` | Required whenever `showLabel={false}`. |
| `children` | `ReactNode` | Required for labeled buttons — pass button label text here; there is no `label` prop. |
| `showLeadingIcon` / `leadingIcon` | `boolean` / `ReactNode` | Set for inline secondary actions when an icon aids recognition. |
| `shortcut` / `shortcutLabel` / `shortcutAriaLabel` | `boolean` / `string` / `string` | Set on the primary submit button to surface a keyboard shortcut badge (e.g. `⌘↵` per AI.md); `shortcutAriaLabel` is required when `shortcut` is true or the badge is silently omitted. |
| `aria-haspopup` | enum | Set when the button opens a menu/listbox/dialog (dropdown triggers); omit for regular action buttons. |

## Common mistakes

1. **Using `variant="plain"` at `size="md"`** — Plain is `sm`-only per AI.md and the component spec; at `md` it breaks the documented size contract. Use `sm`.
2. **Placing two `primary` buttons side by side** — AI.md and the spec both call out a maximum of one Primary per view; use `secondary` for the second action.
3. **Using `position: fixed`/`absolute` to create a floating action button** — explicitly forbidden in AI.md; use `Navbar` `rightActions`.
4. **Setting `showLabel={false}` without `aria-label`** — the component silently omits the shortcut badge and leaves the button without an accessible name; always pair icon-only configuration with `aria-label`.
5. **Using `aria-pressed` on a Main or Destructive button** — AI.md restricts `aria-pressed` to `ToggleButton`/`VerticalButton`; Main/Destructive buttons trigger actions, not state.
6. **Mounting a standalone `Button` beside `EmptyState` to fake primary/secondary** — AI.md directs use of `EmptyState`'s `showMainCta`/`showSecondaryOption` props instead.
7. **Using raw HTML `<button>` or custom button CSS for DS actions** — always use `Button`; if no variant fits, that is a DS gap — use the closest documented variant today.
8. **Passing label text as a `label` prop** — `Button` uses `children` only; do not infer the API from form field components.

## Examples

```tsx
// Most common usage
<Button onClick={save}>Save changes</Button>

// Inline secondary action — ghost, sm, optional leading icon
<Button variant="ghost" size="sm" showLeadingIcon leadingIcon={<Pencil />} onClick={onEdit}>
  Edit
</Button>

// Non-obvious case — icon-only ghost button, sm, with required aria-label
<Button variant="ghost" size="sm" showLabel={false}
  showLeadingIcon leadingIcon={<MoreIcon />} aria-label="More options" />
```
