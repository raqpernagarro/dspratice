# Checkbox
<!--
Version: 1.0.0
Date: 2026-06-25
-->

A checkbox allows a user to select one or more independent options from a set. Each checkbox operates autonomously — selecting one does not affect any other.

---

## When to use

Use a checkbox when the user can select **any number of options**, including none or all.

Use a checkbox when the selection takes effect only after an explicit confirmation action (e.g. a submit button). The checkbox records intent; the action applies it.

**Do not use a checkbox when:**
- Only one option can be selected at a time → use Radio instead
- The selection takes immediate effect with no confirmation step → use Switcher instead
- The options are part of a compact, token-like selection pattern → use Chip instead

---

## Checkbox vs Radio vs Switcher

This distinction is critical for correct usage. All three involve selection, but they differ in multiplicity and immediacy.

| Component | How many can be selected | When does it take effect |
|---|---|---|
| **Checkbox** | Any number (zero to all) | On explicit confirmation |
| **Radio** | Exactly one | On explicit confirmation |
| **Switcher** | One per switcher (on/off) | Immediately, no confirmation needed |

If you're unsure between Checkbox and Switcher, ask: *does the user need to submit or save for this to matter?* If yes, use Checkbox. If the toggle immediately changes something in the UI or system, use Switcher.

---

## Sizes

| Value | Use |
|---|---|
| `md` | Default. Use in standard forms and lists. |
| `sm` | Dense layouts, data tables, or when paired with compact surrounding components. |

Use the same size consistently within a single list or form group. Never mix `md` and `sm` checkboxes in the same group.

---

## States

`Selected` and `Disabled` are independent boolean properties. All combinations are valid.

| State | Description |
|---|---|
| `Default` | Resting state. Awaiting interaction. |
| `Hover` | Pointer is over the checkbox. |
| `Pressed` | Checkbox is actively being clicked or tapped. |
| `Focused` | Checkbox has keyboard focus. Must be visually distinct from Default. |
| `Disabled` | Checkbox is non-interactive. The current value (selected or unselected) is preserved but cannot be changed. |

**On `Selected=True` + `Disabled=True`:** The checkbox appears checked but locked. Use this when a selection is required by the system and the user cannot override it. Always pair with an explanation of why the option is fixed.

**On indeterminate state:** When a checkbox controls a group of sub-items and only some are selected, the checkbox should display an indeterminate state (dash/mixed indicator). This is a visual state to implement in code — it is not a separate Figma variant. Use `aria-checked="mixed"` for this case.

---

## Placement

- Checkboxes belong in forms, filter panels, settings screens, or any context where the user is building a selection before committing.
- Always group related checkboxes together under a shared label or section header.
- Place the checkbox control to the left of its label. Never place the label to the left of the control without a strong layout reason.
- In a list context, use consistent vertical spacing between items. Use the `sm` size when list density is a priority.
- Do not use a single standalone checkbox to toggle a system setting — use Switcher instead.

### PopoverMenu checkbox-cell items

When rendering checkboxes inside `PopoverMenu` choice lists (`kind: 'checkbox-cell'`):

- Always set `showLeadingIcon: false` and `showTrailingIcon: false` when no icons are needed.
- Never rely on defaults alone — `showTrailingIcon` defaults to true and renders a placeholder trailing icon when `trailingIcon` is omitted.
- Treat empty selection as no filter applied — do not add an "All" sentinel option for unfiltered state in toolbar filter menus.

---

## Interaction

- Clicking or tapping anywhere on the checkbox **or its label** should toggle the selection. The entire row is the hit target, not just the control.
- Checkbox state changes are **not immediate** — they are staged until the user confirms via a submit or apply action.
- Keyboard: `Space` toggles the focused checkbox. `Tab` moves focus between checkboxes in the group.
- When all items in a group are selected, a parent "select all" checkbox (if present) should reflect `Selected=True`. When some are selected, it should reflect indeterminate. When none are selected, `Selected=False`.

---

## Accessibility

- Each checkbox must have an associated label — either a visible text label or an `aria-label`.
- Use `role="checkbox"` with `aria-checked="true"`, `aria-checked="false"`, or `aria-checked="mixed"` (for indeterminate).
- Group related checkboxes in a `<fieldset>` with a `<legend>` that describes the group. This gives screen reader users the context for what they're choosing within.
- `Disabled` checkboxes should still be announced by screen readers with their current state. Use `aria-disabled="true"` rather than the HTML `disabled` attribute where possible, to keep them in the reading order.
- The `Focused` state must meet WCAG AA contrast requirements for focus indicators.
- Do not rely on color alone to communicate selection — the checked visual indicator (checkmark) must be present.

---

## Content guidelines

**Labels:**
- Be specific and self-contained. The user should understand the option without reading surrounding content.
- Use positive framing where possible: "Receive notifications" rather than "Don't disable notifications".
- Keep labels concise — one line is ideal, two lines is the maximum before the layout breaks down.
- Use sentence case: "Send weekly summary" not "Send Weekly Summary".
- Avoid starting all labels with the same word — it creates a wall of text that's hard to scan.

**Group labels:**
- A group of checkboxes should always have a heading or question that frames the choice: "Notification preferences", "Visible columns", "Filters".
- The group label should not duplicate what each individual checkbox already says.

**Error messages:**
- If a form requires at least one checkbox to be selected, show the error at the group level, not on individual checkboxes. Example: "Select at least one option to continue."
