# Chip

A chip is a compact, interactive element used to represent a filter, a selectable option, or an input value. Chips are always actionable — if an element is purely informational, use a Tag instead.

---

## When to use

Use a chip when the user needs to **select, activate, or dismiss** a discrete value in a compact, inline context.

Typical uses:
- Filter controls — selecting active filters from a set
- Multi-value input — representing each value the user has entered or chosen
- Contextual options — presenting a set of toggleable choices without the weight of a full form control

**Do not use a chip when:**
- The element is purely informational and carries no action → use Tag instead
- The user is choosing one option from a mutually exclusive set in a form → use Radio instead
- The user is selecting multiple options in a form → use Checkbox instead
- The context is a settings toggle → use Switcher instead

---

## Chip vs Tag vs Badge

These three components are visually similar but serve distinct purposes.

| Component | Interactive | Carries state | Use for |
|---|---|---|---|
| **Chip** | Yes | Yes — `Selected` boolean | Filters, selectable options, input values |
| **Tag** | No | No | Categorization labels, status metadata |
| **Badge** | No | No | Notification counts, attention indicators on other elements |

The clearest test: if the user can click it and something changes, it's a Chip. If it just communicates information, it's a Tag or Badge.

---

## Sizes

| Value | Use |
|---|---|
| `md` | Default. Use in standard filter bars and option sets. |
| `sm` | Compact layouts, inline within text, or dense filter panels. |

Use the same size consistently within a chip group. Never mix `md` and `sm` in the same row or group.

---

## States

`Selected` and `Disabled` are independent boolean properties and combine freely with interaction states.

| State | Description |
|---|---|
| `Default` | Resting state. Chip is interactive and unselected. |
| `Hover` | Pointer is over the chip. |
| `Pressed` | Chip is actively being clicked or tapped. |
| `Focused` | Chip has keyboard focus. Must be visually distinct from Default. |
| `Disabled` | Chip is non-interactive. Its current value (selected or unselected) is preserved. |
| `Selected` | The chip is in its active/on state — a filter is applied, an option is chosen. |

`Selected` can combine with `Hover`, `Pressed`, and `Focused` to represent a selected chip being re-interacted with. Clicking a selected chip deselects it (where the design allows toggling).

---

## Placement

- Chips work best in horizontal, wrapping rows — a "chip group". Use the `Chip group` / `Chip stack` component to manage layout.
- In filter contexts, place the chip group near the content it filters — directly above a list or table, not at the bottom.
- In multi-value input contexts, chips appear inline within or directly below the input field as values are added.
- Do not scatter individual chips across unrelated parts of a layout. Chips communicate a set — isolated chips lose their meaning.
- Do not use chips as navigation — they don't replace Tabs or Segment control for view-switching.

---

## Interaction

- Clicking or tapping a chip toggles its `Selected` state.
- In a filter context, selecting a chip immediately applies the filter — chips follow the same immediacy rule as Switcher. If the filtering operation has latency, show a loading state in the affected content area, not on the chip itself.
- In a multi-value input context, chips can be dismissed individually. The dismiss action (×) removes the value — ensure the tap/click target for dismiss is large enough to be usable without accidentally triggering the chip's main toggle.
- Keyboard: `Space` or `Enter` toggles the focused chip. `Tab` moves focus between chips in the group.
- When all chips in a filter group are deselected, the full unfiltered content should be shown — an empty selection means "no filter applied", not "show nothing".

---

## Accessibility

- Each chip must have a descriptive label — either visible text or `aria-label`.
- Use `role="checkbox"` with `aria-checked="true/false"` for chips in a multi-select filter group.
- Use `role="radio"` within a `radiogroup` for chips in a single-select group.
- Group related chips with a `role="group"` and `aria-label` describing the set: "Filter by status", "Select categories".
- For chips with a dismiss action, the dismiss button must have its own `aria-label`: "Remove [chip label]". Do not let the dismiss action inherit the chip's label alone.
- `Disabled` chips should use `aria-disabled="true"` and remain in the reading order.
- The `Focused` state must meet WCAG AA contrast requirements.

---

## Content guidelines

- Chip labels should be short — ideally 1–3 words. Chips are compact by design; long labels break the layout.
- Use nouns or adjectives for filter chips: "Active", "Overdue", "High priority". Avoid verb phrases.
- Use sentence case: "In progress" not "In Progress".
- Labels should be parallel in structure across a chip group — all nouns, all adjectives, never mixed.
- Avoid abbreviations unless they are universally understood in the product's context.
- Do not truncate chip labels with an ellipsis — if the label is too long, rewrite it.
