# Input / Select

A dropdown input for selecting a single value from a predefined list. The options are hidden until the user opens the control.

---

## When to use

Use Select when the user must choose **one value from a fixed list** that is too long to display as radio buttons (typically 7+ options), or when space is constrained.

**Do not use when:**
- There are 6 or fewer options and space allows → use Radio instead (all options visible reduces cognitive load)
- The user can select multiple values → use Autocomplete multi or Multi choice input instead
- The user needs to type a value that may or may not match a list → use Autocomplete instead
- The options change dynamically based on prior input → consider Autocomplete with server-side filtering

---

## States

| State | Description |
|---|---|
| `Default` | Control is closed. Shows selected value or placeholder. |
| `Hover` | Pointer over the closed control. |
| `Pressed` | Control is actively being clicked — dropdown is about to open. |
| `Focused` | Control has keyboard focus, dropdown is closed. |
| `Error` | No valid selection made, or selection fails validation. |
| `Disabled` | Non-interactive. Current selection (if any) is preserved. |

Note: Select uses `Default` and `Pressed` rather than `Empty`/`Filled`/`Active` — it does not have a typing state. The open/closed state of the dropdown panel is separate from these input states.

---

## Rules

- Always include a placeholder option ("Select an option", "Choose...") when no default is pre-selected — never leave the control visually empty with no indication of what it does.
- The placeholder must not be selectable as a valid value — it is a prompt, not an option.
- Pre-select a default value when one option is clearly the most common or recommended choice.
- Group related options with `optgroup` labels when the list has distinct categories.
- Keep option labels short and parallel in structure — all nouns, all verb phrases, never mixed.
- Always show a search field in the dropdown when the list has more than 10 options — `Select` does this automatically; never pass `searchable={false}` there.
- Use `Combobox` for free-text or async option sets.

## Accessibility

- Use native `<select>` where possible — it provides free keyboard navigation and screen reader support.
- For custom select implementations, use `role="combobox"` with `aria-expanded`, `aria-haspopup="listbox"`, and `aria-controls` pointing to the options list (`role="listbox"` with `role="option"` items).
- Mandatory fields set `aria-required="true"` by default; `optional={true}` suppresses it. No required marker exists. See AI.md LCB-08.
- `aria-invalid="true"` in Error state.

## Content guidelines

- Label: noun phrase. "Country", "Status", "Assigned to".
- Placeholder: "Select [label]" or "Choose [label]". "Select country", "Choose status".
- Option labels: short, parallel, sentence case. No "Select..." option within the list itself.
- Error: "Select a country to continue" not "Required field".

---

# Input / Autocomplete multi

A text input with a dropdown that allows searching and selecting multiple values. Each selected value is represented as a chip inside the input field.

---

## When to use

Use Autocomplete multi when the user needs to **select multiple values from a potentially large or dynamic list**, and typing to filter is more efficient than scrolling.

Typical uses: assigning multiple tags, selecting multiple team members, choosing multiple categories.

**Do not use when:**
- Only one value can be selected → use Select or Autocomplete single instead
- The list is small and fixed → use Checkbox group or Multi choice input instead
- The user cannot enter values not in the list → clarify whether free-form entry is permitted

---

## States

Filled · Hover · Active · Focused · Error · Disabled

Note: there is no explicit `Empty` state listed in Figma — the `Active` state represents the field when the user is typing to search. `Filled` represents the field with at least one chip selected.

---

## Interaction

- Typing filters the dropdown list in real time.
- Selecting an option from the dropdown adds it as a chip inside the input.
- Each chip has an individual remove (×) control to deselect that value.
- When all chips are removed, the field returns to its empty/active state.
- Pressing `Backspace` with an empty text field removes the last chip.
- The dropdown closes when the user clicks outside, presses `Escape`, or moves focus away.

## Sizes

Only `sm` is defined in Figma for this component. Use consistently.

## Accessibility

- Use `role="combobox"` with `aria-multiselectable="true"` and `aria-expanded`.
- Each selected chip must have an accessible remove button: `aria-label="Remove [value]"`.
- The dropdown list uses `role="listbox"` with `role="option"` items and `aria-selected`.
- Announce chip additions and removals via `aria-live="polite"`.

## Content guidelines

- Label: describes the type of values being collected. "Tags", "Assignees", "Permissions".
- Placeholder: "Search and select [label]" or "Add [label]".
- Error: "Select at least one [value type]" for required fields.

---

# Input / Horizontal input

A layout variant where the label is positioned to the left of the input control rather than above it, on the same horizontal row.

---

## When to use

Use Horizontal input in dense settings panels, property editors, or description list contexts where vertical space is at a premium and label–value pairs are the primary layout pattern.

**Do not use in:**
- Standard forms where users are expected to scan labels top to bottom — the vertical (stacked) layout is faster to scan
- Mobile layouts where horizontal space is insufficient
- Forms with long labels — horizontal layout breaks badly when labels wrap

---

## States

| State | Description |
|---|---|
| `Default` | Resting state, no interaction. |
| `Error` | Validation error. |

Note: Horizontal input has fewer explicit states in Figma than the standard text input — hover, focus, and active states are handled by the embedded control (text input, select, etc.) inside the horizontal layout.

---

## Structure

Horizontal input is a **layout wrapper** — it positions a label and an input control side by side. The embedded control can be any appropriate input type: text, select, number, etc.

- Label: left-aligned, fixed width, vertically centered with the control.
- Control: fills the remaining width to the right of the label.

## Rules

- Use consistent label widths within a group of horizontal inputs — misaligned labels create visual noise.
- The label must not wrap — keep labels short enough to fit on one line.
- In Error state, the error message appears below the control (right column), not below the entire row.
- Always remove wrapper `gap` for stacked or wrapped `HorizontalInput` row demos so vertical spacing comes only from component and layout intent (e.g. the `AlignedRows` demo).

## Content guidelines

- Label: ultra-concise noun or noun phrase — even shorter than standard labels because horizontal space is shared. "Name", "Status", "Due date".
- Avoid labels longer than 3–4 words in horizontal layout.
