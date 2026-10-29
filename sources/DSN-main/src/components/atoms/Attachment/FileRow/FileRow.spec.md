# FileRow

**Tier:** atom  
**Location:** `src/components/atoms/Attachment/FileRow/FileRow.spec.md`  
**Version:** 1.0.0

## What it is

A file list row with a thumbnail, file name, type and size, optional copy-link and download actions, or an upload progress bar with a cancel button while uploading.

## When to use

- Use to list files that belong to a record (documents on a project, files in a detail drawer)
- Use with `state="uploading"` to show progress for files accepted by `UploadArea`, then switch to `"default"` when done

## When NOT to use

- Do not use for a visual gallery where the preview matters → use `AttachmentCard` instead
- Do not use for compact attachments in a composer → use `AttachmentChip` instead
- Do not use for a single-file form field → use `AttachmentField` instead
- Do not use for many files with sorting and filtering → use `DataTable` instead
- Do not use to view an image full size → use `MediaViewer` instead

## Variant selection

### `state` prop

| Value | Use when |
|-------|----------|
| `"default"` | The file is available — shows type and size, plus copy link / download for the handlers you pass |
| `"uploading"` | The file is uploading — shows progress and cancel; set `uploadProgress` |
| `"hover"` | Static previews only — real rows get hover from CSS |

### `previewVariant` prop

| Value | Use when |
|-------|----------|
| `"file"` (default) | Non-image files — generic file icon |
| `"image"` | Images — pass `previewSrc`; without it the file icon shows |

## Spatial contract

- **Owns its padding:** yes
- **Owns its margin:** no — the list container owns gaps between rows
- **Fills its container:** yes — spans the list width
- **Notes:** stack rows in a vertical flex list with a spacing token gap.

## Composition rules

- ✅ Can be used inside: detail drawers and panels, below an `UploadArea`, page sections
- ❌ Never place inside: a `DataTable` cell — use a column `render` instead
- ❌ Never combine with: extra copy-link or download buttons — pass `onCopyLink` / `onDownload` instead

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `fileName` | `string` | Always — the default is the literal "File name" |
| `fileType`, `fileSize` | `string` | Whenever known, e.g. "PDF", "4.2 MB" — omitted values are not shown |
| `previewVariant` + `previewSrc` | — | `previewVariant="image"` with `previewSrc` for images; the default `"file"` shows a file icon |
| `onCopyLink` / `onDownload` | `() => void` | Each button renders only when its handler is passed |
| `uploadProgress` | `number` (0–100) | With `state="uploading"` — defaults to 0 |
| `onCancelUpload` | `() => void` | With `state="uploading"` |

## Common mistakes

1. **Listing files in a `MediaViewer`** — it views media full size; list files with `FileRow` (AI.md, MediaViewer).
2. **Image file without `previewVariant="image"` and `previewSrc`** — it shows a generic file icon; see Props reference.

## Examples

```tsx
// Most common usage — a record's documents
<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
  {docs.map((d) => (
    <FileRow key={d.id} fileName={d.name} fileType={d.ext.toUpperCase()} fileSize={d.size}
      onCopyLink={() => copyLink(d)} onDownload={() => download(d)} />
  ))}
</div>

// Non-obvious: an upload in progress
<FileRow fileName="site-plan.png" fileType="PNG" fileSize="4.2 MB" previewVariant="image" previewSrc={localPreview}
  state="uploading" uploadProgress={progress} onCancelUpload={cancel} />
```
