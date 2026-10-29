# MediaViewer

**Tier:** organism  
**Location:** `src/components/organisms/MediaViewer/MediaViewer.spec.md`  
**Version:** 1.0.0  
**Also known as:** lightbox, file preview

## What it is

A full-screen viewer for images, PDFs and video. It steps through a set of files like `Carousel` and has a top bar for file metadata (owner, date, file type, size), actions for the current file (share, download, export…), zoom for images, and close.

## When to use

- Use when the user opens an image or file from a list, grid or attachment and needs to see it large.
- Use when the user should step through the rest of the set without closing the preview.
- Use when the preview needs actions next to it, such as download, share or export.

## When NOT to use

- Do not use for an inline gallery that stays in the page layout → use `Carousel` instead.
- Do not use for a task or decision → use `Modal` instead.
- Do not use to list, pick or upload files → use `AttachmentField`, `FileRow` or `UploadArea` instead.
- Do not use to show Office documents or other formats the browser can't render. They get the "no preview" card. Convert them to PDF on the server if a preview matters.

## Item types

| `type` | Renders | Notes |
|--------|---------|-------|
| `"image"` | `<img>`, fitted whole (contain), pinch / wheel / button zoom up to 400% | `alt` is required (dev warning). Neighbouring images are preloaded. |
| `"video"` | Native `<video controls>` | Unmounted when the user moves on, so playback stops. Set `poster`. |
| `"pdf"` | The browser's built-in PDF viewer in an `<iframe>` | Zoom and pages come from the browser's own viewer, so the viewer's zoom controls are hidden. Where the browser can't show PDFs (`navigator.pdfViewerEnabled === false`, e.g. most phones), shows the "no preview" card with **Open in new tab**. |
| `"file"` | "No preview" card | For anything else (zip, docx…). |

## Variant selection

| Prop | Use when |
|------|----------|
| `showZoom` (default `true`) | Images. Hidden for other types automatically. Turn off only for small images where zoom adds nothing. |
| `showCounter` (default `true`) | Always for sets. Hidden with one item. |
| `showThumbnails` | Sets of more than a few files where users jump to a specific one. Images use `src` if `thumbnailSrc` is missing; other types show a file icon. |
| `showMetadata` (default `true`) | Turn off when owner, date, type and size add nothing, e.g. a product photo gallery. The title is always shown. |

## Top bar

- **Left:** owner `Avatar` (when `owner` is set), file `title` (heading), file-type `Tag` (from `mimeType`, otherwise the title's extension), `size`, then "Owner · date" and the `meta` slot. Below 640px only the title is shown.
- **Right:** the `actions` render prop for the current item in a spaced `ButtonGroup` labelled "File actions", then the zoom `ButtonGroup` (images only), then the close button.
- Actions are the app's job. The viewer only lays them out. Return icon-only ghost `Button`s with an `aria-label` that names the file, e.g. `Download site-plan.jpg`. Keep to 4 or fewer.

## Spatial contract

- **Owns its padding:** yes — top bar, stage and thumbnail strip manage their own insets.
- **Owns its margin:** n/a — portaled to `document.body` and covers the viewport (`position: fixed; inset: 0; z-index: var(--z-index-modal)`).
- **Fills its container:** fills the viewport. The stage is dark in both themes (`--color-background-fixed-dark-primary`), and the top bar uses the themed surface so DS buttons render normally.

## Composition rules

- ✅ Open it from: thumbnails, `AttachmentCard`, `FileRow`, `Carousel` slides, `DataTable` cells.
- ✅ `actions` returns `Button` elements only. The viewer wraps them in a `ButtonGroup`.
- ❌ Never open a `Modal` or another `MediaViewer` from inside a MediaViewer.
- ❌ Never put a `PopoverMenu` in `actions` yet. It portals outside the viewer's focus trap. Use separate buttons.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `items` | `MediaViewerItem[]` | Always. Order = navigation order. |
| `label` | `string` | Always — names the dialog ("Project files"). Noun phrase, sentence case. |
| `open` + `onOpenChange` | `boolean`, `(open) => void` | Almost always — the viewer is opened from something else on the page. |
| `index` + `onIndexChange` | `number`, `(i) => void` | When opening at the clicked file, or syncing with a URL. Otherwise `defaultIndex`. |
| `actions` | `(item) => ReactNode` | When the current file can be shared, downloaded or exported. |
| `MediaViewerItem.owner` / `createdAt` / `size` | | Pre-formatted strings. The viewer does not format dates or sizes. |

## Accessibility

- `role="dialog"` + `aria-modal="true"`, named by `label`, described by the current file title.
- Focus moves to **Close viewer** on open, Tab is trapped inside, and focus returns to the trigger on close. Escape closes (`closeOnEscape`).
- Keyboard: ArrowLeft/ArrowRight/Home/End change file. `+` / `-` / `0` zoom in, zoom out and reset images. While an image is zoomed, the arrow keys pan it instead of changing file. Navigation keys are ignored while focus is in the video, the PDF frame or a form control, so their own keys keep working.
- The current file is a `role="group"` with `aria-roledescription="slide"` and the label "site-plan.jpg, 3 of 27". Changes are announced in a polite live region after user navigation only. The visual counter is `aria-hidden`. Slides that are not current are `aria-hidden` and `inert`. The slide transition uses `--motion-transition-normal`, like `Carousel`, and is turned off under `prefers-reduced-motion`.
- If the focused arrow is removed at either end, focus moves to the opposite arrow.
- Touch swipe changes file when the image is not zoomed. Arrow buttons are the single-pointer alternative (WCAG 2.5.7). Mouse drags pan a zoomed image and never change file; the "Move image" button group (shown only while zoomed) is the single-pointer alternative to drag-panning (WCAG 2.5.7).
- The zoom-reset button shows the percentage and is labelled "Reset zoom, currently 150%" (label in name, WCAG 2.5.3).

## Testing note

The image zoom uses `react-zoom-pan-pinch`, which needs `ResizeObserver`. jsdom has none, so stub it in test setup when rendering the viewer with an image.

## Common mistakes

1. **Rendering it in place and expecting it to sit in the layout** — it is portaled and covers the viewport; see Spatial contract.
2. **Missing `alt` on images** — the title is not alt text.
3. **Formatting sizes or dates inside the viewer** — pass pre-formatted strings.
4. **Adding zoom buttons for PDFs** — the browser's PDF viewer owns zoom.
5. **Opening at index 0 when the user clicked file 5** — pass `index`.

## Examples

~~~tsx
const [open, setOpen] = useState(false);
const [index, setIndex] = useState(0);

<FileGrid onOpen={(i) => { setIndex(i); setOpen(true); }} />

<MediaViewer
  label="Project files"
  items={files}
  open={open}
  onOpenChange={setOpen}
  index={index}
  onIndexChange={setIndex}
  showThumbnails
  actions={(file) => (
    <>
      <Button variant="ghost" showLabel={false} showLeadingIcon leadingIcon={<Share2 size={16} />}
        aria-label={`Share ${file.title}`} onClick={() => share(file)} />
      <Button variant="ghost" showLabel={false} showLeadingIcon leadingIcon={<Download size={16} />}
        aria-label={`Download ${file.title}`} onClick={() => download(file)} />
    </>
  )}
/>
~~~
