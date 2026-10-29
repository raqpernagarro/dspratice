# Badge

**Tier:** atom
**Location:** `src/components/atoms/Badge/Badge.spec.md`
**Version:** 1.0.0

## What it is

A badge is a small, non-interactive indicator attached to another element. It draws attention to a count, a status change, or the presence of new information — without interrupting the user's current task.

## When to use

- Use to surface secondary information about another element — typically a count of unread items, pending actions, or a critical status signal — directly on the element it relates to
- Use for notification counts on navigation icons or avatars, pending tasks, alerts, or critical error counts

## When NOT to use

- Do not use when the value is a status label or category → use `Tag` instead
- Do not use when the element is interactive and the user selects or dismisses it → use `Chip` instead
- Do not use when the information is important enough to interrupt the user and demand a response → use `Toast` or an alert banner instead
- Do not use when the count is zero — hide the badge rather than showing "0"
- Do not use when the number is not meaningful without additional context → use inline text instead

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `highlight-soft` | Neutral notification — new or updated, low urgency |
| `highlight-strong` | Stronger emphasis — pending actions, unread items requiring attention |
| `informative` | Informational count — neutral gray, no error or warning implied |
| `inverted` | High contrast on light surfaces — dark background, inverted text |
| `critical` | Urgent count — errors, failures, blocked states that need resolution |

Use `critical` only for genuinely urgent situations. Use `highlight-soft` as the default for informational counts. Never use multiple badge variants on the same element simultaneously.

### `size` prop

| Value | Use when |
|-------|----------|
| `sm` | Default — numeric count on icons, avatars, and compact navigation items |
| `dot` | Presence alone is the signal — no count needed (e.g. online, unread) |

## Spatial contract

- **Owns its padding:** yes — `sm` uses a transparent wrapper with inset buffer for alignment in controls
- **Owns its margin:** no — host element provides positioning context
- **Fills its container:** no — absolutely positioned overlay on the host
- **Notes:** The host element must have `position: relative`. Count badges typically anchor top-right; dot badges often anchor bottom-right (e.g. presence on avatars). The `sm` badge includes a transparent margin buffer (`--badge-inset`, default `4px`) so it aligns vertically with sibling elements when nested inside controls like Checkbox, Radio, or MenuCell. When the badge sits inside a component whose siblings are already the same visual height (e.g. inside a Button), set `--badge-inset: 0` on the parent to remove the buffer.

## Composition rules

- ✅ Can be used inside: icon buttons, avatars, tabs, navigation items, vertical buttons
- ❌ Never place on a text label alone — attach to the nearest icon or visual anchor
- ❌ Never combine with Tag or Chip on the same element for the same signal

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `count` | `number` | Numeric value for `sm` size; omit or ignore for `dot` |
| `aria-label` | `string` | Required for `dot` size; recommended for `sm` — include the value in plain language (e.g. `"3 unread notifications"`) |

## Common mistakes

1. **Showing "0"** — hide the badge when count is zero
2. **Displaying counts ≥ 100 literally** — cap at `"99+"`
3. **Missing `aria-label` on dot badges** — dot has no visible text; label is required
4. **Using badge for text labels** — use `Tag` for categorical labels

## Examples

~~~tsx
// Count on an icon button host
<div style={{ position: 'relative', display: 'inline-flex' }}>
  <IconButton aria-label="Messages, 3 unread" />
  <Badge size="sm" variant="critical" count={3} aria-label="3 unread notifications" />
</div>

// Presence dot on avatar
<div style={{ position: 'relative', display: 'inline-flex' }}>
  <Avatar size="md" variant="profile" fill="initials" initials="AB" name="Ana Beatriz" />
  <Badge size="dot" variant="highlight-strong" aria-label="Online" />
</div>
~~~
