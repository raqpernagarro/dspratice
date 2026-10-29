# Radio

A radio button allows a user to select exactly one option from a set. Selecting any option in a group automatically deselects all others.

---

## When to use

Use a radio when the user must choose **one and only one** option from a mutually exclusive set, and the selection takes effect only after an explicit confirmation action.

Use a radio when all options should be visible simultaneously, so the user can compare them before deciding.

**Do not use a radio when:**
- Multiple options can be selected → use Checkbox instead
- There are more than 6–7 options — the list becomes hard to scan → use a Select (dropdown) instead
- The selection takes immediate effect with no confirmation → use Switcher or Segment control instead
- There is only one option to toggle on or off → use Checkbox or Switcher instead

---

## Radio vs Checkbox vs Select vs Segment control

| Component | Selection | Effect | Best for |
|---|---|---|---|
| **Radio** | Exactly one | On confirmation | Mutually exclusive options, all visible, 2–6 items |
| **Checkbox** | Any number | On confirmation | Independent options, any quantity |
| **Select** | Exactly one | On confirmation | Mutually exclusive options, 7+ items or space-constrained |
| **Segment control** | Exactly one | Immediately | Switching between views or modes, not form submission |

---

## Sizes

| Value | Use |
|---|---|
| `md` | Default. Use in standard forms and settings. |
| `sm` | Dense layouts or when paired with compact surrounding components. |

Use the same size consistently within a single radio group. Never mix `md` and `sm` within the same group.

---

## States

`Selected` and `Disabled` are independent boolean properties. All combinations are valid.

| State | Description |
|---|---|
| `Default` | Resting state. Awaiting interaction. |
| `Hover` | Pointer is over the radio item. |
| `Pressed` | Radio is actively being clicked or tapped. |
| `Focused` | Radio has keyboard focus. Must be visually distinct from Default. |
| `Disabled` | Radio is non-interactive. Its current value is preserved but cannot be changed. |

**On `Selected=True` + `Disabled=True`:** The radio appears selected but locked. Use this when one option is enforced by the system and the user cannot change it. Always explain why the option is fixed.

**There is no indeterminate state for Radio.** Unlike Checkbox, a radio group always has exactly one item selected (or none, before the user has made a choice). If none is pre-selected, ensure the first interaction selects one and cannot return to an unselected state.

---

## Placement

- Radio buttons belong in forms or settings where the user is making a mutually exclusive choice before confirming.
- Always display radio buttons as a group — a single standalone radio button is meaningless without alternatives.
- Group all related radios under a shared label or section header that frames the decision.
- Place the radio control to the left of its label.
- Stack radio groups vertically. Horizontal arrangements are only appropriate for 2–3 very short labels where space is abundant and the options are clearly comparable.
- Pre-select a default option when one choice is strongly recommended or represents the most common case. If all options are equally valid and no default is appropriate, leave all unselected and require the user to choose.

---

## Interaction

- Clicking or tapping anywhere on the radio **or its label** selects that option. The entire row is the hit target.
- Selecting a radio **immediately deselects** all other radios in the same group. This is the fundamental contract of radio behavior.
- Radio state changes are **not immediate** in terms of system effect — they are staged until confirmed via a submit or apply action.
- Keyboard: `Arrow keys` move selection within the group (up/down or left/right). `Tab` moves focus to the next focusable element outside the group. Unlike checkboxes, `Space` does not toggle — it selects the focused radio.

---

## Accessibility

- Wrap all radios in a group with a shared `role="radiogroup"` and an `aria-labelledby` or `aria-label` that describes the group.
- Each radio uses `role="radio"` with `aria-checked="true"` or `aria-checked="false"`.
- Individual radio labels must be associated via `for`/`id` pairing or `aria-labelledby`.
- Within a `radiogroup`, arrow key navigation must move both focus and selection together — this is standard radio behavior and must not be broken.
- `Disabled` radios should be announced by screen readers. Use `aria-disabled="true"` to keep them in reading order while preventing interaction.
- The `Focused` state must meet WCAG AA contrast requirements.
- Do not rely on color alone to communicate selection — the filled indicator must be visually present.

---

## Content guidelines

**Option labels:**
- Each option label should be concise, specific, and mutually exclusive in meaning — if two labels could apply to the same scenario, reconsider the options.
- Use parallel grammatical structure across all options in a group: all nouns, all adjectives, or all verb phrases — never mixed.
- Use sentence case: "Every week" not "Every Week".
- Avoid negations: "No notifications" as an option in a positive list creates cognitive friction. Reframe: "None" or "Off".
- Aim for 1–4 words per label. If an option needs more explanation, add a secondary description line below the label — but keep the label itself short.

**Group labels:**
- Frame the choice as a clear question or category: "Notification frequency", "Report format", "Access level".
- The group label should make each option's meaning unambiguous in context.

**Error messages:**
- If a radio group is required and no selection has been made, show the error at the group level: "Select an option to continue."
- Never show an error on individual radio items — the validation is on the group, not the item.
