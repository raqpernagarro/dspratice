# RichTextEditor

**Tier:** molecule  
**Location:** `src/components/molecules/RichTextEditor/RichTextEditor.spec.md`  
**Version:** 1.0.0

## What it is

A labelled rich text field with a formatting toolbar (block type, bold, italic, underline, strikethrough, link, lists, alignment, undo/redo), attachment chips, and an optional footer with a checkbox and Cancel / Confirm, emitting HTML.

## When to use

- Use when the user writes formatted prose — descriptions, notes, long comments — and needs headings, lists, links or emphasis
- Turn on the footer (`showFooter`) when the editor is a self-contained composer with its own submit (e.g. a comment box with "Notify followers")

## When NOT to use

- Do not use for plain multi-line text → use `TextArea` instead
- Do not use for a single-line value → use `TextInput` instead
- Do not use for an AI chat prompt → use `PromptInput` instead
- Do not use to display formatted content read-only in a page → render the sanitized HTML instead

## Variant selection

RichTextEditor has no `variant` prop.

### Footer

| Setting | Use when |
|-------|----------|
| `showFooter` off (default) | The editor is one field in a `Form` — the form owns the submit CTA (LCB-09) |
| `showFooter` on | Standalone composer that submits itself (comments, replies) |

### State

| Prop | Use when |
|-------|----------|
| `readOnly` | Content is shown in the editor chrome but cannot change (e.g. a locked record) |
| `disabled` | The field is temporarily unavailable |

## Spatial contract

- **Owns its padding:** yes — label, toolbar, editor, footer and helper row own their spacing
- **Owns its margin:** no — inside a `Form`, the form owns spacing between fields
- **Fills its container:** yes — stretches to its parent's width
- **Notes:** the editor grows with its content; constrain height on a wrapper if needed.

## Composition rules

- ✅ Can be used inside: `Form` (footer off), `Drawer` and `Modal` content, detail panels
- ❌ Never combine with: a form submit CTA while `showFooter` is on — two competing submits
- ❌ Never render the emitted HTML without sanitizing it

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Always — the default is the literal "Label" |
| `value` + `onChange` | `string` (HTML) + callback | Controlled usage — the value is an HTML string |
| `helperText` | `string` | The default is the literal "Help text" — override it, or pass `''` |
| `helperIcon` | `ReactNode` | Optional 16×16 icon at the start of the helper / error row; none by default |
| `maxLength` | `number` | Shows a character counter and an over-limit state; it does not stop typing, so validate on submit |
| `showFooter` | `boolean` | See Variant selection — defaults to off |
| `footerLabel` + `footerChecked` + `onFooterCheckedChange` | — | With the footer on — the default label is the literal "Label" |
| `confirmLabel` + `onConfirm` | `string` + callback | With the footer on — a specific verb, e.g. "Post comment" |
| `attachments` + `onAttachmentRemove` / `onAddAttachment` | — | When files can be attached; the add button only renders with `onAddAttachment` |

The link button opens a popover with a URL field. Bare domains get `https://`; `javascript:`, `data:` and `vbscript:` URLs are rejected.

## Common mistakes

1. **Two submits in a form** — see Composition rules (LCB-09).
2. **Relying on `maxLength` to block input** — see Props reference.
3. **Shipping the "Label" / "Help text" defaults** — see Props reference.

## Examples

```tsx
// Most common usage — a field in a form
<Form onSubmit={save}>
  <RichTextEditor label="Description" value={html} onChange={setHtml} helperText="" />
</Form>

// Non-obvious: standalone comment composer
<RichTextEditor
  label="Add a comment"
  placeholder="Write a comment…"
  showFooter
  footerLabel="Notify followers"
  footerChecked={notify}
  onFooterCheckedChange={setNotify}
  confirmLabel="Post comment"
  onConfirm={post}
  onCancel={reset}
  helperText=""
/>
```
