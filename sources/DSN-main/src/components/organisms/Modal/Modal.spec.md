# Modal

**Tier:** organism
**Location:** `src/components/organisms/Modal/Modal.spec.md`
**Version:** 1.0.1
**Date:** 2026-07-16

## What it is

A focus-trapped overlay dialog, portaled to `document.body`, with an optional header (`SectionHeader`), content slot, and bottom action bar (`Toolbar`).

## When to use

- Use when the user must complete a task or make a decision before continuing
- Use when the interaction needs exclusive focus with no background reference retained

## When NOT to use

- Do not use when the message is informational only with no action required → use `Toast` instead
- Do not use when the task needs more room than a dialog but should retain partial page context → use `Drawer` instead
- Do not use when the content is anchored to a trigger element (small menu, contextual content) → use `Popover` instead
- Do not use when the content is a single short line → use `Tooltip` instead

## Variant selection

### `headerSize` prop

| Value | Use when |
|-------|----------|
| `"large"` (default) | Standard modal header weight for most dialogs |
| Other `SectionHeaderSize` values | Match header weight to a denser or lighter modal context, consistent with `SectionHeader` usage elsewhere |

### `bottomBarSize` prop

| Value | Use when |
|-------|----------|
| `"lg"` (default) | Standard modal action bar |
| Other `ToolbarSize` values | Match the bottom bar density to the rest of the modal's controls |

## Spatial contract

- **Owns its padding:** yes — header, content, and bottom bar each manage their own internal spacing via `dsn-modal-header`, `dsn-modal-content`, `dsn-modal-bottom-bar`.
- **Owns its margin:** yes — the overlay and backdrop are portaled to `document.body` and positioned independently of where `Modal` is mounted in JSX.
- **Fills its container:** no — it does not participate in the host page's layout flow at all; it renders in a fixed overlay above everything.
- **Notes:** Because it is portaled, surrounding layout containers (flex/grid wrappers, padded sections) have no effect on the Modal's size or position.

## Composition rules

- ✅ Can be used inside: any component tree — render location is irrelevant since it portals to `document.body`
- ❌ Never place inside: another `Modal` — never open a Modal from within a Modal
- ❌ Never combine with: a separately mounted `Toast` for the same action that requires a user response — use the Modal's own confirm/cancel actions instead

## Additional rules

- Modals should contain only one primary action. If two equally weighted actions are needed, use Secondary + Secondary — never two Primary buttons.
- For destructive confirmations, use a destructive Primary button for the confirming action, placed on the right, with "Cancel" on the left.
- "Cancel" is for reversible contexts; "Close" is for informational modals with no action — set `cancelLabel="Close"` accordingly.
- Do not use a Modal for content the user will need to consult repeatedly — the open/close overhead is too high; use a Drawer or persistent panel instead.

## Accessibility

### Initial focus

- Always focus the first focusable element inside `.dsn-modal-content` when the modal opens so form fields receive initial focus instead of header controls such as the close button.
- If the content area has no focusable elements, fall back to the first focusable element anywhere in the dialog.
- Never rely on consuming apps to add `autoFocus` or manual focus refs to work around Modal focus behavior — initial focus targeting is owned by `Modal`.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `open` / `onOpenChange` | `boolean` / `(open: boolean) => void` | Use for controlled open state driven by external triggers |
| `defaultOpen` | `boolean` | Use only for uncontrolled usage where the Modal manages its own open state |
| `closeOnOverlayClick` | `boolean` | Set to `false` only when the action is destructive/critical and accidental dismissal must be prevented |
| `closeOnEscape` | `boolean` | Set to `false` only alongside `closeOnOverlayClick={false}` for the same reason |
| `showHeader` | `boolean` | Set to `false` only when a fully custom `header` node replaces the default title/description layout |
| `header` | `React.ReactNode` | Use to fully replace the default `SectionHeader`-based header |
| `showBottomBar` | `boolean` | Set to `false` when the modal has no confirm/cancel actions (e.g. pure informational content with only the close control) |
| `bottomBar` | `React.ReactNode` | Use to fully replace the default Cancel/Confirm `Toolbar` |
| `cancelLabel` / `confirmLabel` | `string` | Always set to a specific verb ("Delete", "Save") — never "OK" or generic labels |
| `title` | `string` | Always 3–6 words, sentence case — never "Are you sure?" |

## Common mistakes

1. **Opening a Modal from within another Modal** — AI.md explicitly forbids nesting modals; use a single Modal and sequence the flow, or use a `Drawer`/inline step instead.
2. **Using "Are you sure?" as the title** — AI.md requires specific, descriptive titles like "Delete project" in sentence case.
3. **Using generic action labels like "OK" or "Confirm"** — AI.md requires `confirmLabel` to be a specific verb describing the action.
4. **Auto-opening a Modal on page load** — AI.md explicitly forbids this; Modal must be triggered by user action.
5. **Using Modal for informational-only messages** — AI.md states Toast is for informational content; Modal is reserved for tasks requiring a decision.
6. **Adding `autoFocus` or manual focus refs in consuming apps** — initial focus targeting is owned by `Modal`; never work around it in app code.

## Examples

```tsx
// Most common usage
const [open, setOpen] = useState(false);
<Modal
  open={open}
  onOpenChange={setOpen}
  title="Delete project"
  onCancel={() => setOpen(false)}
  onConfirm={handleDelete}
  cancelLabel="Cancel"
  confirmLabel="Delete"
>
  This cannot be undone.
</Modal>

// Non-obvious case: informational modal with no bottom bar
<Modal open={open} onOpenChange={setOpen} title="Release notes" showBottomBar={false}>
  <ReleaseNotesContent />
</Modal>
```
