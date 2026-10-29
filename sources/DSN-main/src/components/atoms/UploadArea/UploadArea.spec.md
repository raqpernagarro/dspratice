# UploadArea

**Tier:** atom  
**Location:** `src/components/atoms/UploadArea/UploadArea.spec.md`  
**Version:** 1.0.0

## What it is

A labelled drag-and-drop zone that is also a button opening the system file picker, reporting the chosen or dropped files.

## When to use

- Use when uploading is the main task of a step or panel (e.g. a document upload step in a flow) and needs a prominent target
- Use when users are expected to drag files in, or to add several files at once (`multiple`)

## When NOT to use

- Do not use for attaching a single file as one field among others in a form → use `AttachmentField` instead
- Do not use for incidental attachments in a message or comment composer → use the composer's attach action with `AttachmentChip` (e.g. `PromptInput`, `RichTextEditor`) instead
- Do not use to list files that are already uploaded → use `FileRow` or `AttachmentCard` instead

## Variant selection

UploadArea has no `variant` prop.

| Setting | Use when |
|-------|----------|
| `multiple` off (default) | One file per upload |
| `multiple` | Several files may be dropped or picked at once — say so in `dragText` or `helperText` |
| `disabled` | Uploading is not available yet (e.g. a prerequisite step is incomplete) |

## Spatial contract

- **Owns its padding:** yes — the drop zone owns its inset and minimum height
- **Owns its margin:** no — inside a `Form`, the form owns spacing between fields
- **Fills its container:** yes — stretches to its parent's width
- **Notes:** it only collects files. Show accepted files and upload progress below it with `FileRow` (or `AttachmentCard` for images).

## Composition rules

- ✅ Can be used inside: `Form`, `Modal` and `Drawer` content, a dedicated upload step
- ✅ Pair with: a list of `FileRow` (`state="uploading"` with progress, then `"default"`) for the accepted files
- ❌ Never place inside: a `Card` header, a `Toolbar` or another drop zone
- ❌ Never hide the click-to-browse fallback — the zone is already a button; don't replace it with a drop-only target

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Always — the default is the literal "Label"; name the file: "Signed contract" |
| `accept` | `string` | Always when types are limited, e.g. `".pdf,image/png"` — filters both picked and dropped files |
| `maxSizeText` | `string` | Always — the accepted types and size limit, e.g. "PDF, PNG or JPG up to 10 MB"; not shown when omitted |
| `helperText` | `string` | The default is the literal "Help text" — override it, or pass `''` |
| `onFilesSelected` | `(files: File[]) => void` | Always — receives only files matching `accept`; check size here |
| `onFilesRejected` | `(files: File[]) => void` | With `accept` — files that don't match; show a clear error naming them |
| `dragText` / `dropText` | `string` | When the default instructions don't fit, e.g. "Drag and drop the signed contract or press to upload" |

## Common mistakes

1. **Not stating accepted types and size limits up front** — see Props reference (UploadArea in AI.md).
2. **Silently ignoring rejected files** — handle `onFilesRejected`; see Props reference.
3. **No progress feedback after acceptance** — see Composition rules (UploadArea in AI.md).
4. **Using it as a single-file form field** — see When NOT to use.

## Examples

```tsx
// Most common usage
<UploadArea
  label="Supporting documents"
  accept=".pdf,image/png,image/jpeg"
  multiple
  maxSizeText="PDF, PNG or JPG up to 10 MB each"
  helperText=""
  onFilesSelected={(files) => addValidFiles(files)}
  onFilesRejected={(files) => showTypeError(files)}
/>
{uploads.map((u) => (
  <FileRow key={u.id} fileName={u.name} fileType={u.type} fileSize={u.size} previewVariant="file"
    state={u.done ? 'default' : 'uploading'} uploadProgress={u.progress} onCancelUpload={() => cancel(u.id)} />
))}

// Non-obvious: a gated upload step
<UploadArea label="Signed contract" accept=".pdf" maxSizeText="PDF up to 10 MB" disabled={!termsAccepted}
  helperText="Accept the terms to upload the contract." onFilesSelected={upload} />
```
