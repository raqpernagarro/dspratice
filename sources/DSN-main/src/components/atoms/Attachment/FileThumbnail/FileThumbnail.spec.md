# FileThumbnail

**Tier:** atom  
**Location:** `src/components/atoms/Attachment/FileThumbnail/FileThumbnail.spec.md`  
**Version:** 1.0.0

## What it is

A small square preview (`role="img"`) showing an image or a file-type icon, in seven sizes, used inside the attachment components.

## When to use

- Use to preview an attachment where a full attachment component is too much — e.g. a file icon in a custom list cell or menu row (AI.md, AspectRatio)
- Use `variant="file"` with a custom `icon` to show a specific file type

## When NOT to use

- Do not use to show a person or organization → use `Avatar` instead
- Do not use for layout images or media with a fixed ratio → use `AspectRatio` instead
- Do not use to view an image full size → use `MediaViewer` instead
- Do not rebuild a file pill or row from thumbnails → use `AttachmentChip`, `FileRow` or `AttachmentCard`, which render it for you

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"file"` (default) | Non-image files — generic file icon, or `icon` |
| `"image"` | Images — pass `imageSrc`; without it the file icon shows |

### `size` prop

| Value | Use when |
|-------|----------|
| `"xxSmall"` (default) – `"small"` | Inline in dense text rows and chips |
| `"medium"` – `"large"` | List rows (`FileRow` uses `"large"`) |
| `"xLarge"` – `"xxLarge"` | Prominent single-file previews |

## Spatial contract

- **Owns its padding:** no
- **Owns its margin:** no
- **Fills its container:** no — fixed square per `size`
- **Notes:** the image is cropped to fill the square.

## Composition rules

- ✅ Rendered for you by: `AttachmentChip`, `FileRow`
- ✅ Can be used inside: custom list cells and menu rows that need a file preview
- ❌ Never place inside: an `Avatar` slot

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `imageSrc` | `string` | With `variant="image"` — without it the thumbnail falls back to the file icon |
| `aria-label` / `imageAlt` | `string` | Describe the file, e.g. "Preview of site-plan.png" — the defaults are generic |
| `icon` | `ReactNode` | `variant="file"` — a lucide-react icon for the file type, e.g. `FileSpreadsheet` |

## Common mistakes

1. **Previewing attachments with `AspectRatio`** — use `FileThumbnail` (AI.md, AspectRatio).

## Examples

```tsx
// Most common usage — file-type icon in a custom row
<FileThumbnail variant="file" size="medium" icon={<FileSpreadsheet size={16} />} aria-label="Spreadsheet" />

// Non-obvious: image preview
<FileThumbnail variant="image" size="large" imageSrc={thumbUrl} aria-label="Preview of site-plan.png" />
```
