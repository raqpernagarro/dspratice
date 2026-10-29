# Input / Slider

A drag-based input for selecting a numeric value or range within a defined min/max boundary. The user drags a handle along a track.

---

## When to use

Use a slider when the user is selecting a value from a **continuous or stepped numeric range** and the approximate value matters more than precision.

Typical uses: price range filters, volume controls, progress thresholds, percentage inputs.

**Do not use when:**
- The exact value is critical and the user needs to type it precisely → use Number input instead
- The range is not meaningful to display visually (e.g. a hidden internal threshold) → use Number input
- The range is very large and fine granularity is needed → consider Number input with explicit min/max constraints

---

## Types

| Type | Description |
|---|---|
| `Max value` | Single handle. User selects one value up to a maximum. |
| `Range` | Two handles. User selects a minimum and maximum value defining a range. |

---

## Stack orientation

| Value | Description |
|---|---|
| `Horizontal` | Track runs left to right. The standard orientation for most contexts. |
| `Vertical` | Track runs bottom to top. Use in specialized contexts — audio controls, vertical scales. |

---

## States

Both types support: Disabled (full slider). The handle supports: Default · Hover · Pressed · Focused · Disabled.

---

## Rules

- Always show the current value alongside the handle — do not make the user guess their selected value from handle position alone. Show the value in a tooltip above the handle during drag, or as a persistent label.
- Display min and max labels at the ends of the track.
- For `Range` type, prevent the two handles from crossing — the minimum handle cannot exceed the maximum handle.
- Define step size explicitly. A step of 1 is default for integers; use larger steps for large ranges (e.g. step 100 for a 0–10,000 range) to make selection practical.
- Provide a Number input alongside the Slider for contexts where precision matters — they work together: editing the number updates the handle, dragging the handle updates the number.

## Accessibility

- Each slider handle must have `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext` (for human-readable representation of the value).
- For `Range` type, use `aria-label` to distinguish handles: "Minimum price", "Maximum price".
- Keyboard: `Arrow keys` increment/decrement by one step. `Page Up/Down` by a larger increment. `Home/End` jump to min/max.
- The full slider must have a visible label via `aria-labelledby` or `aria-label`.

## Content guidelines

- Label: describes what is being set. "Price range", "Maximum file size", "Volume".
- Min/max labels: show the actual values with units. "€0" / "€500", "0 GB" / "10 GB".
- Value tooltip: show the current value with units during interaction.
- For `Range` type, show both values. "€120 – €350".

---

# Input / Upload area

A drag-and-drop zone for uploading files. Provides a clear visual target for dropping files and a fallback click-to-browse action.

---

## When to use

Use Upload area when the primary upload interaction is drag-and-drop, or when the upload context warrants a prominent dedicated area (e.g. a document upload step in a flow).

For incidental file attachment (adding a file to a record or message), use the Attachment chip instead.

---

## States

| State | Description |
|---|---|
| `Empty` | Default resting state. Drop zone visible with instructions. |
| `Hover` | Pointer enters the drop zone — but no file is being dragged. Visual engagement feedback. |
| `Focused` | Drop zone has keyboard focus. |
| `Dropping` | A file is being actively dragged over the drop zone. Strong visual signal that dropping here will trigger upload. |
| `Disabled` | Drop zone is non-interactive. |

---

## Rules

- Always provide a click-to-browse fallback — not all users can drag and drop (accessibility, touch devices, enterprise desktop restrictions).
- Clearly state accepted file types and size limits in the Empty state — do not surprise the user with format errors after upload.
- Show upload progress feedback after a file is dropped — the Upload area itself transitions to a progress state; this is handled by the Attachment component family after the file is accepted.
- For multiple file uploads, specify whether multiple files can be dropped at once or must be added one at a time.
- Reject invalid file types immediately on drop with a clear error — do not silently fail.

## Accessibility

- The drop zone must be keyboard accessible — pressing `Enter` or `Space` when focused opens the system file picker.
- Use `role="button"` with `aria-label` describing the upload action: "Upload files — click or drag and drop".
- `Dropping` state must be announced via `aria-live` when a file enters the drop zone.
- File type and size constraints must be in the accessible description via `aria-describedby`.

## Content guidelines

- Primary instruction: action-focused. "Drop files here" or "Drag and drop files".
- Secondary instruction: the click fallback. "or browse to upload".
- Constraints: "Accepts PDF, PNG, JPG up to 10 MB".
- Do not use vague copy like "Upload your documents here" — name the specific file type if there is one: "Upload the signed contract (PDF)".

---

# Input / Chips / Several

A chip-based multi-value input where each entered or selected value is displayed as a chip inside the input area. The user builds up a set of values one at a time.

---

## When to use

Use Chips input when the user is **building a set of values** — email recipients, tags, keywords — where each value is discrete and individually removable.

This differs from Autocomplete multi in that Chips input is primarily for **free-form entry** (the user types and confirms each value) rather than selecting from a predefined list. The two can be combined when both typed entry and selection from suggestions are supported.

---

## States

Figma shows this as a single assembled component (`Input / Chips/Several`) without explicit state variants — interaction states are handled by the chips themselves and the embedded text field.

---

## Interaction

- The user types a value and presses `Enter` (or a defined separator like comma or Tab) to add it as a chip.
- Each chip has a remove (×) control.
- `Backspace` with an empty text field removes the last chip.
- Duplicate values should either be rejected silently (refocus the existing chip) or shown as an error — define this consistently per product.
- If validation applies (e.g. email format for a recipient field), validate each value before converting to a chip. Show an inline error if the value is invalid.

## Accessibility

- The input group must have a label describing the type of values expected.
- Each chip's remove button must have `aria-label="Remove [value]"`.
- Chip additions and removals must be announced via `aria-live="polite"`.
- The text field must remain focusable at all times — do not trap focus on chips.

## Content guidelines

- Label: "Tags", "Recipients", "Keywords".
- Placeholder: guides entry format. "Add a tag and press Enter", "Type an email address".
- Error (invalid entry): shown inline below the input before the value is converted to a chip. "Enter a valid email address".
