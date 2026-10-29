# AttachmentChip

**Tier:** atom  
**Location:** `src/components/atoms/Attachment/AttachmentChip/AttachmentChip.spec.md`  
**Version:** 1.0.0

## What it is

A compact inline file pill with a small preview, file name and size, and an optional remove button or overflow menu.

## When to use

- Use to show files attached to something being written — a message, comment or prompt — in a compact row
- Use with `action="remove"` while the user can still detach the file
- Use with `action="more"` when attached files offer actions (download, rename, details)

## When NOT to use

- Do not use as a file-picking form field → use `AttachmentField` (which renders this chip) instead
- Do not use for a list of files with type, size, link and download actions → use `FileRow` instead
- Do not use for a visual gallery of attachments → use `AttachmentCard` instead
- Do not use for filter or selection chips → use `Chip` instead

## Variant selection

### `action` prop

| Value | Use when |
|-------|----------|
| `"none"` (default) | Read-only display of an attached file |
| `"remove"` | The user can detach the file — set `onRemove` |
| `"more"` | The file has actions — set `menuOptions` and `onMenuSelect` |

### `size` prop

| Value | Use when |
|-------|----------|
| `"md"` (default) | Standard composers and fields |
| `"sm"` | Dense rows |

### `previewVariant` prop

| Value | Use when |
|-------|----------|
| `"file"` (default) | Non-image files — generic file icon |
| `"image"` | Images — pass `previewSrc`; without it the file icon shows |

## Spatial contract

- **Owns its padding:** yes
- **Owns its margin:** no — the container owns gaps between chips
- **Fills its container:** no — sizes to content; long names truncate
- **Notes:** the `"more"` menu is portalled and positioned by `PopoverWrapper`.

## Composition rules

- ✅ Rendered for you by: `AttachmentField`, `PromptInput`, `RichTextEditor`
- ✅ Can be used inside: message and comment threads, detail panels, wrapping flex rows
- ❌ Never combine with: a hand-built menu next to the chip — use `action="more"` with `menuOptions`

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `fileName` + `fileSize` | `string` | Always — size as a formatted string, e.g. "2.4 MB" |
| `loading` | `boolean` | While the file uploads — actions are disabled |
| `menuOptions` + `onMenuSelect` | `AttachmentChipMenuOption[]` + callback | With `action="more"` — pass your own options; the defaults (Download, Rename, Details) are examples |
| `onRemove` | `() => void` | With `action="remove"` |

## Common mistakes

1. **Using chips as a file list with actions** — see When NOT to use.
2. **Shipping the default menu options** — see Props reference.

## Examples

```tsx
// Most common usage — attached files in a composer
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
  {files.map((f) => (
    <AttachmentChip key={f.id} fileName={f.name} fileSize={f.size} action="remove" onRemove={() => detach(f.id)} />
  ))}
</div>

// Non-obvious: image attachment with actions
<AttachmentChip
  fileName="site-photo.jpg"
  fileSize="1.2 MB"
  previewVariant="image"
  previewSrc={photo.thumbUrl}
  action="more"
  menuOptions={[{ id: 'download', label: 'Download', icon: <Download size={16} /> }]}
  onMenuSelect={handleAction}
/>
```
