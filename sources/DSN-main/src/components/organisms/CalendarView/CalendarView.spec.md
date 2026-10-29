# CalendarView

`CalendarView` is the organism for month, week, day, and list (agenda) calendar UIs. It wraps FullCalendar with DS-Ngr navigation chrome (`SegmentControl`, prev/next/today) and token-based grid styling.

`DateTimePicker` (single date, range, or with time) is for **selecting dates in forms** — not for scheduling views. See `src/components/atoms/DateTimePicker/DateTimePicker.spec.md`.

---

## When to use

Use `CalendarView` when the user needs a **scheduling or events calendar** — month grid, week/day time grid, or list agenda with events on a timeline.

**Do not use when:**
- The user picks a single date or range inside a form → use `DateTimePicker`
- The UI is a relative time filter ("Last 7 days") → use `Select` or `SegmentControl`, not a calendar grid
- `CalendarView` already covers the layout (month, week, day, list) → never build a custom calendar grid or reimplement FullCalendar chrome in the app

---

## Views

| `defaultView` | Purpose |
|---|---|
| `month` | Day grid for the month |
| `week` | Time grid for the week |
| `day` | Time grid for one day |
| `agenda` | List of events (list week) |

Always use the built-in view switcher — do not replace it with plain buttons or a custom toolbar unless the product spec explicitly requires a different pattern and `CalendarView` cannot be extended in the library.

---

## CalendarEvent.color

`CalendarEvent.color` maps to FullCalendar `backgroundColor` and `borderColor`. It does **not** set readable event text by itself.

**When to use `color`:**
- Subtle category indicators (border accent, list dot) when default event chrome stays on a neutral surface
- Full event fills only when you also supply a contrasting `textColor` in the event mapping (library or app) so title and time remain legible

**Never use as the only event styling:**
- Dataviz series tokens (`--color-{background|border|foreground}-dataviz-*`)
- Semantic status tokens used for warnings or errors (`warning`, `error`)
- Accent or selected text tokens as the event fill expecting readable labels

---

## Event label legibility

Event title and time must stay readable without app-level CSS overrides.

- Always style `.fc-event-title` and `.fc-event-time` with **primary text on a neutral event surface** (default chip styling from `CalendarView`).
- Never style event labels with selected-state or accent text tokens — those are for selection chrome, not dense event chips.
- Never require consuming apps to add local CSS overrides for event contrast — that is owned by `CalendarView` styles and the event color API.

---

## Consuming apps

- Always use `CalendarView` for month/week/day/list calendar UIs when this organism covers the use case.
- Never build a custom calendar grid when `CalendarView` applies.
- Never add app-level overrides on `.fc-event`, `.fc-event-title`, or `.fc-event-time` to fix contrast — report gaps in the library instead.
- When passing `color` on events, either rely on default neutral chips or pair fill colors with an explicit contrasting text color in the documented event mapping.

---

## Building the component (library)

See `AGENTS.md` — `CalendarView` must ship with legible default event styles and a documented `color` / text pairing contract so consumers do not patch FullCalendar classes locally.
