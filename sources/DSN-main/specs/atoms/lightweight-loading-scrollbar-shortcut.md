# Skeleton loading

Skeleton screens are placeholder shapes shown during content loading. They mimic the layout of the content that will appear, reducing perceived wait time and preventing layout shift.

## When to use

Use skeleton loading when content takes more than ~300ms to load and the shape of the content is known in advance. Use Spinner instead when the operation is indeterminate or when there is no predictable content shape to mirror.

**Do not use skeleton loading for:**
- Instant operations (under ~300ms) — showing a skeleton briefly before immediate content creates unnecessary flicker
- Background operations the user didn't trigger — use a subtle progress indicator instead
- Operations where the result shape is unknown

## Types

| Type | Use |
|---|---|
| `Avatar` | Placeholder for an avatar — circular shape matching the Avatar component's size |
| `Pill` | Placeholder for a line of text — use multiple stacked pills for text blocks |
| `Image` | Placeholder for an image, thumbnail, or card media area |
| `Card` | Placeholder for a full card component |

**Composing skeletons:** Build skeleton layouts by combining multiple types to mirror the real content structure. A list item skeleton might combine an Avatar pill on the left with two Pill rows on the right. Match the skeleton composition as closely as possible to the actual content layout to minimize visual shift when content loads.

## Rules

- Skeleton shapes animate with a shimmer or pulse to signal activity. Never show static skeleton shapes — static grey boxes look like errors or broken states.
- Replace all skeletons simultaneously when content is ready — do not replace parts of a skeleton one by one, which creates jitter.
- Do not show skeleton loading for content that is already cached or available locally.
- Skeleton shapes must not be interactive — remove all event listeners from skeleton placeholders.

## Accessibility

- Skeleton containers must have `aria-busy="true"` and `aria-label="Loading"` (or equivalent) while loading, and `aria-busy="false"` when content is ready.
- Screen readers must not attempt to read skeleton placeholder content — use `aria-hidden="true"` on individual skeleton shapes.

---

# Spinner

A spinning indicator for indeterminate loading states — when progress cannot be measured or expressed as a percentage.

## When to use

Use a Spinner when an operation is in progress and its duration is unknown. Use Progress bar when progress can be measured. Use Skeleton when the shape of the loading content is known.

## Sizes

| Value | Use |
|---|---|
| `sm` | Inline within buttons, compact components, or tight spaces |
| `lg` | Standard standalone loading indicator for panels or page sections |
| `xl` | Full-panel or full-section loading states |
| `xxl` | Full-page loading states |

## Rules

- Always pair a Spinner with a text label when used standalone — "Loading…", "Saving…", "Processing…". A spinner alone gives no context.
- For button loading states, use `sm` inline within the button and disable the button while loading.
- Do not use multiple spinners simultaneously on the same screen — consolidate into one.

## Accessibility

- The spinner container must have `role="status"` and `aria-label` describing the operation: `aria-label="Loading results"`.
- The spinner graphic itself should be `aria-hidden="true"` — the label carries the meaning.
- Announce completion via `aria-live="polite"` when the operation finishes.

---

# Loading / Bar

A thin horizontal bar that fills from left to right to indicate page-level or app-level loading progress. Appears at the top of the screen.

## When to use

Use the Loading bar for **page navigation or top-level operations** where a spinner would be too intrusive and a skeleton is not applicable — the bar sits at the edge of the viewport and does not interrupt the layout.

Do not use it within components or panels — use Spinner or Skeleton there instead.

## Rules

- The Loading bar is always positioned at the top of the viewport — never inline within content.
- Single variant, no configuration. It animates automatically when mounted.
- Remove it immediately when the operation completes — do not leave it partially filled.

## Accessibility

- Implement as an `aria-live="polite"` region that announces when loading starts and finishes.
- Use `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-valuenow` reflecting current progress (or omit `aria-valuenow` for indeterminate states).

---

# Progress bar

A horizontal bar that fills to reflect the completion percentage of a known, measurable process.

## When to use

Use a Progress bar when progress can be expressed as a percentage and the user benefits from seeing how far along a process is — file uploads, multi-step task completion, onboarding checklists.

Use Spinner for indeterminate operations. Use Loading bar for page-level navigation.

## Rules

- Single variant. No size or color options — the component adapts to its container width.
- Always show the percentage or step count alongside the bar — do not make the user estimate progress from the fill alone.
- Update the bar in real time as progress advances. Do not jump from 0% to 100% at completion.
- For multi-step processes, consider a step indicator (stepper) instead — it communicates discrete stages more clearly than a continuous bar.

## Accessibility

- Use `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-valuenow` set to the current percentage.
- Include `aria-label` describing what is progressing: `aria-label="Uploading file"`.
- Announce significant milestones (e.g. completion) via `aria-live="polite"`.

---

# Scrollbar

A visual indicator of scroll position within a scrollable container. Expands slightly on hover to become easier to grab.

## Directions

| Value | Use |
|---|---|
| `Vertical` | Scrollable content taller than its container |
| `Horizontal` | Scrollable content wider than its container — tables, timelines, carousels |

## States

| State | Behaviour |
|---|---|
| `Default` | Thin, low-prominence bar — present but unobtrusive |
| `Hover` | Slightly wider — easier to grab and drag |

## Rules

- The scrollbar is a system-level component in most environments. DS-Ngr provides a custom scrollbar for contexts where the native scrollbar does not match the design language (e.g. styled panels, modals, sidebars).
- Never hide the scrollbar entirely in scrollable areas — its presence communicates that more content exists.
- Do not use both vertical and horizontal scrollbars on the same container unless the content is genuinely two-dimensional (e.g. a large data table). Nested scroll axes are disorienting.
- The scrollbar track and thumb must meet minimum contrast requirements to be visible against the container background.

## Accessibility

- Custom scrollbars must not replace native scroll behavior — they are visual overlays only. The underlying scroll mechanism must remain fully keyboard and assistive-technology accessible.
- Ensure scrollable containers have `tabindex="0"` so they can receive focus and be scrolled via keyboard arrow keys.

---

# Shortcut

A visual badge that displays a keyboard shortcut key or key combination. Used inline within tooltips, menus, and help text to communicate available keyboard shortcuts.

## Sizes

| Value | Use |
|---|---|
| `sm` | Inline within tooltip text, compact menus |
| `md` | Standalone shortcut references, help panels, onboarding |

## Content color

| Value | Use |
|---|---|
| `Default` | On light backgrounds — standard usage |
| `Inverted` | On dark backgrounds — tooltips with dark treatment, dark mode surfaces |

## Rules

- Shortcut is non-interactive — it is a display element only, never clickable.
- Use platform-standard notation consistently:
  - Mac: `⌘`, `⌥`, `⇧`, `⌃`
  - Windows/Linux: `Ctrl`, `Alt`, `Shift`
  - Do not mix notations — detect the platform and show the appropriate symbols
- Keep shortcut labels to the actual key(s) only — no descriptive text inside the badge: `⌘S` not `⌘ Save`
- Pair with the action label when used in menus or tooltips — the shortcut badge sits at the trailing edge of the row, the action label at the leading edge

## Accessibility

- The key symbol characters (⌘, ⇧, etc.) are not reliably announced by screen readers. Provide a text equivalent via `aria-label` on the shortcut element: `aria-label="Command S"`.
- When used inside a tooltip or menu item, the shortcut's accessible label should be part of the parent element's full description — do not rely on the badge alone.
