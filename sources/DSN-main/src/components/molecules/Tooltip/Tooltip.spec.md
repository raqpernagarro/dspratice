# Tooltip

A tooltip is a small, text-only overlay that reveals supplementary information about an element when the user hovers over or focuses it. It is transient — it disappears when the trigger loses hover or focus.

---

## When to use

Use a tooltip to provide **brief, supplementary context** that helps the user understand an element — without cluttering the primary layout with always-visible text.

Typical uses:
- Labeling icon-only buttons where the icon alone may be ambiguous
- Revealing the full text of a truncated label
- Providing a short definition or explanation for a term or abbreviation
- Showing keyboard shortcuts associated with an action

**Do not use a tooltip when:**
- The information is critical and the user must see it to complete their task → place it inline instead
- The content is longer than one short sentence → use Popover instead
- The content includes interactive elements (links, buttons) → use Popover instead
- The trigger is a disabled element — tooltips on disabled controls are unreliable across devices and assistive technologies; use a visible explanation next to the element instead
- The user is on a touch device primarily — tooltips are hover-dependent and inaccessible to touch-only users; ensure the information is available through another means

---

## Tooltip vs Popover

| Component | Trigger | Content | Interactive content |
|---|---|---|---|
| **Tooltip** | Hover or focus | Plain text only, one short sentence | No |
| **Popover** | Click or tap | Rich content — text, structure, links | Yes |

The key distinction is **trigger and richness**. Tooltips are passive and appear on hover. Popovers are intentional and appear on click. If the user needs to interact with the content, it must be a Popover.

---

## Single variant

Tooltip has one form — a small text container with an arrow pointing to its trigger. There are no size or severity variants. Content constraints enforce the component's purpose:

- Plain text only — no icons, no buttons, no links
- One sentence maximum — if more is needed, use Popover
- The arrow positions automatically based on available space

---

## Placement

- The tooltip positions itself relative to its trigger, adjusting automatically to stay within the viewport.
- Prefer placing tooltips above the trigger — this is the most natural reading position and least likely to be obscured by the cursor.
- The tooltip should not overlap the element it describes. The arrow and spacing make the association clear.
- Never trigger a tooltip from another overlay (modal, popover, drawer) — layering overlays creates depth and focus management problems.

---

## Interaction

- On desktop: tooltip appears on hover after a short delay (100–200ms). The delay prevents tooltips from flashing on every cursor pass.
- On keyboard: tooltip appears when the trigger receives focus via `Tab`.
- The tooltip disappears when the cursor leaves the trigger, focus moves away, or the user presses `Escape`.
- Tooltips are not triggered by click or tap — if the interaction requires a deliberate action, use Popover.
- Do not make tooltip content interactive. Users cannot move their cursor into the tooltip without it disappearing.

---

## Accessibility

- Tooltips surface content that is not visible by default. Ensure that content is associated with the trigger via `aria-describedby` pointing to the tooltip's `id`, or use the native `title` attribute as a fallback (though `aria-describedby` is preferred for reliability).
- For icon-only buttons, the tooltip text should match the button's `aria-label` — they describe the same thing. Do not create a mismatch where the tooltip says "Export as CSV" but the `aria-label` says "Download".
- Tooltips must be focusable via keyboard — the trigger must be in the tab order and the tooltip must appear on focus.
- `Escape` must dismiss a visible tooltip.
- Do not put essential information only in a tooltip. Touch users and some screen reader configurations will never encounter it. Tooltips are supplementary, not primary.

---

## Content guidelines

- One sentence, maximum. If you're writing two sentences, use a Popover.
- Be specific and direct: "Export table as CSV" not "Export options".
- For keyboard shortcuts, use the platform's standard notation: "Save (Ctrl+S)" on Windows/Linux, "Save (⌘S)" on Mac.
- For truncated text tooltips, show the full untruncated string — no additional commentary.
- Use sentence case.
- Do not repeat the label of the element the tooltip is on — add context, don't echo: a button labeled "Delete" doesn't need a tooltip that says "Delete". It might need one that says "Permanently delete this record".
