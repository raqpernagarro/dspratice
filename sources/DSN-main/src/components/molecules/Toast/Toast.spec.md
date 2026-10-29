# Toast

**Tier:** molecule
**Location:** `src/components/molecules/Toast/Toast.spec.md`
**Version:** 1.0.0

## What it is

A brief, non-blocking notification with a severity icon, title, optional description/action, and dismiss control, that informs the user of the outcome of an action or a system event.

## When to use

- Use to confirm that a user-initiated action completed: "Changes saved", "Item deleted", "Export ready"
- Use to surface a background system event the user should be aware of: "Connection lost", "Session expiring soon"
- Use to surface a non-critical warning or error that doesn't block the user's current task

## When NOT to use

- Do not use when the information is critical and requires the user to act before continuing → use `Modal` instead
- Do not use when the message is directly related to a specific form field → use inline field validation instead
- Do not use when the event is complex and needs detailed explanation or multiple actions → reconsider `Modal` instead
- Do not use for unsolicited marketing or promotional content the user didn't trigger → not an appropriate use of this component

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"inline"` (default) | Brief confirmations and simple status updates that fit in a single line; use by default |
| `"rich"` | The event warrants more context, a follow-up action, or a description — reach for this only when the extra space is genuinely needed, not for visual variety |

### `severity` prop

| Value | Use when |
|-------|----------|
| `"default"` | Neutral system events or informational confirmations that aren't inherently positive |
| `"success"` | The result of a user-initiated action that completed as expected — the most common severity |
| `"warning"` | A real concern — something completed with a caveat, or a system condition to be aware of; use sparingly, never to soften an error |
| `"error"` | A genuine failure — never for warnings or caveats |

## Spatial contract

- **Owns its padding:** yes — icon, content, action, and dismiss control are laid out internally.
- **Owns its margin:** no — positioning within a toast stack/viewport corner is handled by the surrounding toast container, not by `Toast` itself.
- **Fills its container:** no — sized to its content; `rich` variant wraps title/description, `inline` is constrained to a single line.
- **Notes:** Display toasts in one consistent viewport position across the product (e.g. bottom-center or bottom-right). Stack multiple toasts vertically, capped at 3 visible at once — queue additional events rather than exceeding the cap.

## Composition rules

- ✅ Can be used inside: a fixed-position toast container/region, independent of page layout
- ❌ Never place inside: a context requiring the user to respond before continuing → use `Modal` instead
- ❌ Never combine with: more than one action button in a single `rich` Toast — two competing actions in a temporary notification is too much to process before it disappears

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `variant` | `"inline" \| "rich"` | Use `"rich"` only when a description or follow-up action is genuinely needed |
| `severity` | `"default" \| "success" \| "warning" \| "error"` | Choose based on the nature of the event, not visual preference — see variant table |
| `actionLabel` / `onAction` | `string` / `() => void` | Set for a single follow-up action only (e.g. "Undo", "Retry", "View report") — never more than one action |
| `dismissible` | `boolean` | Keep `true` (default) — always provide a manual dismiss control, especially for `warning` and `error` |
| `autoDismiss` | `boolean` | `true` (default) dismisses after 5s, paused while hovered or while focus is inside. Ignored for `severity="error"` and any toast with `actionLabel` — those always persist until the user dismisses them |
| `description` | `string` | Only rendered when `variant="rich"` — 1–2 sentences of additional context |
| `content` | `React.ReactNode` | Figma: `Content` on Toast / Rich toast. Rich variant only — compact supporting content under the description, e.g. a progress bar. |

## Common mistakes

1. **Using `error` severity for a warning or caveat** — AI.md/spec rules reserve `Error` for genuine failures only; softening a warning into an error misleads urgency.
2. **Using `Toast` for actions requiring user response** — AI.md explicitly forbids this; use `Modal` instead.
3. **Adding "Successfully" as a prefix to toast copy** — AI.md forbids this; state the outcome directly ("Changes saved", not "Successfully saved changes").
4. **Including more than one action button in a Rich toast** — too much to process before the toast disappears; keep it to a single follow-up action.
5. **Using error toasts for form field validation** — that feedback belongs inline next to the field, not in a Toast.

## Examples

```tsx
// Most common usage — inline success confirmation
<Toast variant="inline" severity="success" title="Changes saved" />

// Non-obvious case — rich toast with a single follow-up action
<Toast
  variant="rich"
  severity="error"
  title="Couldn't save changes"
  description="Check your connection and try again."
  actionLabel="Retry"
  onAction={handleRetry}
/>
```

## Placement

- Display toasts in a consistent position across the product — typically bottom-center or bottom-right on desktop, bottom-center on mobile. Choose one position and use it everywhere.
- Toasts float above all other content and must not obscure critical interactive elements — avoid positioning over primary action buttons or navigation.
- Stack multiple toasts vertically if more than one must be shown simultaneously. Limit the stack to 3 — queue additional events.

## Interaction

- Toasts are non-blocking — the user can continue interacting with the page while one is visible.
- Toasts auto-dismiss after a set duration. Recommended durations:
  - `default` / `success`: 4–5 seconds
  - `warning`: 6–8 seconds
  - `error`: persistent until dismissed, or 8–10 seconds minimum
- Always provide a manual dismiss control (×) — do not force the user to wait for auto-dismiss, especially on `warning` and `error`.
- For Rich toast with an action button, persist until the user takes the action or dismisses it — do not auto-dismiss a toast waiting for a response.
- Auto-dismiss pauses while the user hovers over the toast or keyboard focus is inside it, and resumes when both leave.

## Accessibility

- Use `aria-live="polite"` for `default`, `success`, and `warning`; `aria-live="assertive"` for `error`.
- The dismiss button must have a descriptive `aria-label`: "Dismiss notification" or "Close".
- Do not rely on color alone to communicate severity — icon and message text must independently convey urgency.
- Action buttons in Rich toast must be keyboard-focusable and reachable via `Tab`.
- Auto-dismissing toasts must not remove keyboard focus from whatever the user was previously focused on.
- Respect `prefers-reduced-motion` — skip slide-in/out animations and use instant appearance/disappearance instead.

## Content guidelines

**Inline toast:**
- One sentence maximum — use Rich toast if more is needed.
- Lead with the outcome, not the process: "Changes saved" not "We are saving your changes".
- Use past tense for completed actions, present tense for ongoing system states.
- Avoid "Successfully" as a prefix — redundant when severity is `success`.

**Rich toast:**
- Title: short and outcome-focused, same rules as Inline toast.
- Body: 1–2 sentences of additional context.
- Action label: strong verb, specific, sentence case — e.g. "View report", "Retry", "Undo". Never more than one action.

**For Error severity:**
- Be specific about what went wrong: "Couldn't save changes — check your connection" rather than "An error occurred".
- Surface a recovery path clearly, in the message or an action button.
- Never use error toasts for form field validation — that belongs inline next to the field.
