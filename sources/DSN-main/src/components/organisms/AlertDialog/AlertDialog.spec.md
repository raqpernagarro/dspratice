# AlertDialog

**Tier:** organism  
**Location:** `src/components/organisms/AlertDialog/AlertDialog.spec.md`  
**Version:** 1.0.0

## What it is

A modal `role="alertdialog"` confirmation with a title, a message, Cancel and Confirm buttons, and an optional acknowledgement checkbox that gates the Confirm button.

## When to use

- Use when the user must confirm a destructive or high-impact action before it runs (Pattern 7)
- Use `requireAcknowledgement` when the action is irreversible and the user must explicitly accept the consequence before Confirm is enabled

## When NOT to use

- Do not use when the user must complete a form or multi-field task → use `Modal` instead
- Do not use to confirm an action that already happened → use `Toast` instead
- Do not use for a non-blocking notice about the current page → use `Callout` instead
- Do not use for long or reference content → use `Drawer` instead
- Do not use for content anchored to an element → use `PopoverWrapper` or `Tooltip` instead

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"default"` | High-impact but non-destructive confirmations (e.g. publish, send). Confirm label defaults to "Confirm". |
| `"danger"` | Destructive actions (delete, remove, revoke). Confirm renders as a destructive primary button; label defaults to "Delete". |

## Spatial contract

- **Owns its padding:** yes — content and footer own their insets
- **Owns its margin:** no — it is portalled to `document.body` and centered over a backdrop
- **Fills its container:** no — it ignores where it is rendered in the tree
- **Notes:** while open it locks body scroll, traps focus, moves focus to the first focusable control, and returns focus to the trigger on close.

## Composition rules

- ✅ Can be used inside: any component tree — render it next to the trigger that opens it
- ❌ Never place inside: another `AlertDialog` or `Modal` — never nest modals
- ❌ Never auto-open on page load — open it only in response to a user action
- ❌ Never add extra buttons or form fields — it holds exactly one Cancel and one Confirm; use `Modal` for anything more

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `open` + `onOpenChange` | `boolean` + `(open) => void` | Controlled usage — the normal case |
| `title` | `string` | Always — name the action in sentence case, e.g. "Delete project" |
| `message` | `string` | Always — state the consequence, e.g. that it cannot be undone |
| `confirmLabel` | `string` | Always — a specific verb ("Delete project"), not the generic default |
| `onConfirm` | `() => void` | Always — run the action and close the dialog; it does not close itself |
| `onCancel` | `() => void` | Only when Cancel needs side effects; otherwise Cancel just closes |
| `requireAcknowledgement` + `acknowledgementLabel` | `boolean` + `string` | Irreversible actions — the label states what the user accepts |
| `closeOnOverlayClick` | `boolean` | Set `false` for destructive confirmations that must not be dismissed by a stray click |

## Common mistakes

1. **Using AlertDialog for a form or task** — see When NOT to use.
2. **Expecting Confirm to close the dialog** — `onConfirm` must close it; see Props reference.
3. **Nesting dialogs or auto-opening** — see Composition rules.

## Examples

```tsx
// Most common usage
const [open, setOpen] = useState(false);

<Button variant="secondary" size="md" onClick={() => setOpen(true)}>Archive</Button>
<AlertDialog
  open={open}
  onOpenChange={setOpen}
  title="Archive project"
  message="Archived projects are hidden from the list but can be restored."
  confirmLabel="Archive"
  onConfirm={() => { archive(); setOpen(false); }}
/>

// Non-obvious: irreversible delete gated by acknowledgement
<AlertDialog
  open={open}
  onOpenChange={setOpen}
  variant="danger"
  title="Delete project"
  message="This permanently deletes the project and its tasks. This cannot be undone."
  confirmLabel="Delete project"
  requireAcknowledgement
  acknowledgementLabel="I understand this cannot be undone"
  closeOnOverlayClick={false}
  onConfirm={() => { remove(); setOpen(false); }}
/>
```
