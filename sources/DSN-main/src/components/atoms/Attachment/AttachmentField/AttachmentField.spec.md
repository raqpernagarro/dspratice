# AttachmentField

**Tier:** atom  
**Location:** `src/components/atoms/Attachment/AttachmentField/AttachmentField.spec.md`  
**Version:** 1.0.0

## What it is

A labelled single-file form field: an "Upload file" button that, once a file is picked, is replaced by an `AttachmentChip` with the file's name, size, preview and a remove action.

## When to use

- Use when a form needs exactly one file as one field among others (e.g. a CV, a receipt, a logo)

## When NOT to use

- Do not use for several files, or when drag-and-drop is the main interaction → use `UploadArea` instead
- Do not use to display files that already belong to a record → use `FileRow` or `AttachmentCard` instead
- Do not use for attachments in a message composer → use `PromptInput` or `RichTextEditor` attachments instead

## Variant selection

AttachmentField has no `variant` prop.

| State | Use when |
|-------|----------|
| Empty | No file yet — shows the upload button |
| File selected | Shows an `AttachmentChip`; images get a thumbnail preview |
| `loading` | The selected file is uploading — remove is disabled |
| `error` + `errorMessage` | The file was rejected (type, size, upload failure) |
| `disabled` | The field is unavailable |

## Spatial contract

- **Owns its padding:** yes
- **Owns its margin:** no — inside a `Form`, the form owns spacing between fields
- **Fills its container:** yes — the field spans its parent's width; the button and chip inside size to content
- **Notes:** the native file input is visually hidden; the button opens it.

## Composition rules

- ✅ Can be used inside: `Form`, `Fieldset`, `Drawer` and `Modal` content
- ❌ Never combine with: an `UploadArea` for the same value
- ❌ Never add margin or gap on the field inside a `Form` (LCB-09)

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Always — the default is the literal "Label"; name the file: "Receipt" |
| `helperText` | `string` | State accepted types and size limit; the default is the literal "Help text" |
| `accept` | `string` | When types are limited, e.g. `".pdf,image/*"` |
| `value` + `onChange` | `File \| null` + callback | Controlled usage — validate type and size in `onChange` and set `error` when invalid |
| `error` + `errorMessage` | `boolean` + `string` | Always pass a specific message, e.g. "File exceeds 5 MB" — the default text is a placeholder |
| `loading` | `boolean` | While the selected file uploads |
| `uploadButtonLabel` | `string` | When "Upload file" is not specific, e.g. "Upload receipt" |

## Common mistakes

1. **Not stating accepted types and size limits** — put them in `helperText`; see Props reference (UploadArea in AI.md).
2. **Using it for several files** — see When NOT to use.
3. **Shipping the "Label" / "Help text" / default error text** — see Props reference.

## Examples

```tsx
// Most common usage
<AttachmentField
  label="Receipt"
  helperText="PDF or image, up to 5 MB"
  accept=".pdf,image/*"
  value={receipt}
  onChange={(file) => { setReceipt(file); setTooBig(!!file && file.size > 5_000_000); }}
  error={tooBig}
  errorMessage="File exceeds 5 MB"
/>

// Non-obvious: uploading immediately after pick
<AttachmentField label="Company logo" helperText="PNG or SVG" accept="image/png,image/svg+xml" value={logo} onChange={uploadLogo} loading={uploading} uploadButtonLabel="Upload logo" />
```
