# Callout

**Tier:** molecule
**Location:** `src/components/molecules/Callout/Callout.spec.md`
**Version:** 1.0.0

## What it is

An inline, dismissible message panel (`role="alert"` for errors, `role="status"` otherwise) with a severity icon, title, optional description/content, and an optional footer with supporting text and actions.

## When to use

- Use for contextual, inline messages tied to a specific area of the page — a form section warning, a page-level informational notice, a success confirmation after an action.
- Use `severity="error"` only for messages requiring immediate attention — it renders as `role="alert"` with `aria-live="assertive"`, which interrupts screen reader announcements.
- Use `actions`/`supporting` when the message needs a response (e.g. "Retry", "Dismiss", "Learn more") rather than being purely informational.

## When NOT to use

- Do not use for a transient, auto-dismissing confirmation after an action (e.g. "Changes saved") → use `Toast` instead.
- Do not use for a blocking confirmation the user must acknowledge before proceeding → use `AlertDialog` instead.
- Do not use for form-field-level validation errors → use the field's own `error`/`errorMessage` props instead.

## Variant selection

### `severity` prop

| Value | Use when |
|-------|----------|
| `"default"` | Neutral, informational context — no success/warning/error connotation. |
| `"success"` | Confirms a completed action or healthy state. |
| `"warning"` | Flags a caution or approaching issue that doesn't block the user. |
| `"error"` | Something has gone wrong or is blocked — renders `role="alert"`/`aria-live="assertive"`. Use sparingly; reserve for messages needing immediate attention. |

## Spatial contract

- **Owns its padding:** yes — header, content, and footer regions are all laid out internally.
- **Owns its margin:** no — placement relative to surrounding content (e.g. above a form, below a page header) must come from the parent layout.
- **Fills its container:** yes — stretches to the parent's width.
- **Notes:** the footer (`Toolbar`) only renders when `actions` or `supporting` is provided — do not add an empty footer wrapper expecting one to always appear.

## Composition rules

- ✅ Can be used inside: page headers, form sections, dashboard panels.
- ✅ Composes `Button` (dismiss control) and `Toolbar` (footer actions) internally — these are implementation details, not separate components to mount alongside it.
- ❌ Never use `severity="error"` for non-urgent informational messages — the `assertive` live region interrupts other screen reader announcements and should be reserved for genuine errors.
- ❌ Never rely on `Callout` for transient success feedback that should auto-dismiss — use `Toast` for that pattern instead.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `severity` | `'default' \| 'success' \| 'warning' \| 'error'` | See variant table above; defaults to `'default'`. |
| `dismissible` | `boolean` | Set `false` only when the message must remain visible until the underlying condition is resolved (rare) — defaults to `true`. |
| `actions` / `supporting` | `React.ReactNode` | Provide together or separately to render a footer via the internal `Toolbar`; omit both to render no footer. |
| `icon` | `React.ReactNode` | Override only when the default severity icon doesn't fit the message — otherwise rely on the automatic icon per `severity`. |

## Common mistakes

1. **Using `severity="error"` for non-urgent messages** — triggers `aria-live="assertive"`, interrupting other screen reader output; reserve for genuine blocking errors.
2. **Using `Callout` for transient post-action confirmation** — that pattern belongs to `Toast`, which auto-dismisses; `Callout` is a persistent inline panel.
3. **Using `Callout` for field-level validation** — individual form fields have their own `error`/`errorMessage` props for that; `Callout` is for section/page-level messages.
4. **Manually mounting a `Toolbar` below `Callout` for actions** — pass `actions`/`supporting` instead; the component already renders its footer via an internal `Toolbar`.

## Examples

```tsx
// Most common usage — informational, dismissible
<Callout severity="default" title="New feature available" description="Try the updated dashboard layout." />

// Non-obvious case — error with actions
<Callout
  severity="error"
  title="Sync failed"
  description="We couldn't sync your latest changes."
  actions={<Button variant="secondary" size="sm">Retry</Button>}
  dismissible={false}
/>
```
