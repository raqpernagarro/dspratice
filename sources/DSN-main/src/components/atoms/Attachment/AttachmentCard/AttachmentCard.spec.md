# AttachmentCard

**Tier:** atom  
**Location:** `src/components/atoms/Attachment/AttachmentCard/AttachmentCard.spec.md`  
**Version:** 1.0.0

## What it is

A square attachment tile with a picture or file-icon preview, a title and metadata (inside or below the tile), a loading state, and an optional remove or overflow action.

## When to use

- Use to show attachments as a visual grid where the preview matters — photos, screenshots, design files
- Use `variant="picture"` for images and `variant="file"` for other files in the same grid

## When NOT to use

- Do not use for a scannable list of files with type, size, link and download → use `FileRow` instead
- Do not use for compact inline attachments in a composer → use `AttachmentChip` instead
- Do not use as a general content card → use `Card` instead
- Do not use as a full-size image viewer → open `MediaViewer` from the tile instead

## Variant selection

### `variant` prop

| Value | Use when |
|-------|----------|
| `"file"` (default) | Non-image files — generic file icon |
| `"picture"` | Images — pass `imageSrc` and `imageAlt` |

### `descriptionPosition` prop

| Value | Use when |
|-------|----------|
| `"outside"` (default) | Title and metadata below the tile — easiest to read |
| `"inside"` | Title overlaid on the tile — dense galleries where vertical space is tight |

### `action` prop

| Value | Use when |
|-------|----------|
| `"none"` (default) | Read-only display |
| `"remove"` | The user can remove the attachment — set `onActionClick` |
| `"more"` | The attachment has several actions — `onActionClick` opens your `PopoverMenu` |

## Spatial contract

- **Owns its padding:** yes
- **Owns its margin:** no — the grid container owns gaps between cards
- **Fills its container:** no — fixed tile size; lay tiles out in a wrapping flex or grid
- **Notes:** with `showActionOnHover` (default) the action button appears on hover and focus.

## Composition rules

- ✅ Can be used inside: wrapping flex or grid galleries, `Drawer` and detail-panel content
- ✅ Pair with: `MediaViewer` to open a picture full size
- ❌ Never place inside: a `Card` body as the card's only content — use the gallery directly
- ❌ `action="more"` renders no menu itself — open a `PopoverMenu` anchored to it from `onActionClick`

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `title` | `string` | Always — the file name; the default is the literal "Title" |
| `metaData` | `string` | Always when `hasMetadata` is on — e.g. "PNG · 2.4 MB"; the default is the literal "Meta data" |
| `imageSrc` + `imageAlt` | `string` | With `variant="picture"` — describe the image in `imageAlt` |
| `action` + `onActionClick` | see Variant selection | When the tile is removable or has actions — the default is `"none"` |
| `loading` | `boolean` | While the file uploads or the preview loads |

## Common mistakes

1. **Shipping the "Title" / "Meta data" defaults** — see Props reference.
2. **`action="more"` with no menu** — see Composition rules.

## Examples

```tsx
// Most common usage — a picture gallery
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
  {photos.map((p) => (
    <AttachmentCard key={p.id} variant="picture" imageSrc={p.thumbUrl} imageAlt={p.alt}
      title={p.name} metaData={p.size} action="remove" onActionClick={() => remove(p.id)} />
  ))}
</div>

// Non-obvious: read-only file tile still uploading
<AttachmentCard variant="file" title="brief.pdf" metaData="PDF · 3.1 MB" loading />
```
