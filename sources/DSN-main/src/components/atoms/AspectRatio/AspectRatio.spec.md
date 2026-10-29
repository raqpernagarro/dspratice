# AspectRatio

**Tier:** atom  
**Location:** `src/components/atoms/AspectRatio/AspectRatio.spec.md`  
**Version:** 1.0.0

## What it is

A box that takes its width from its container and derives its height from a fixed width-to-height ratio, clipping a single media child to that shape.

## When to use

- Use when an image, video, or thumbnail must keep the same proportions at every container width.
- Use when a grid of media tiles must line up regardless of each source file's native dimensions.
- Use when a loading placeholder must reserve the exact space of media that has not arrived yet — wrap `SkeletonLoading type="image"` with the same `ratio` the loaded media will use.
- Use when a photo must be clipped to a circle or oval and no `Avatar` semantics (initials fallback, status, sizing scale) are needed.

## When NOT to use

- Do not use as a general layout container for text, forms, or controls → use page and section layout (`AppShell` content area, `Card`) instead.
- Do not use for a user or organization identity picture → use `Avatar` instead; it owns the identity sizes and the initials fallback.
- Do not use for an attached file preview → use `FileThumbnail` / `AttachmentCard` instead.
- Do not nest an `AspectRatio` inside another `AspectRatio` → one level is enough; put any overlay inside the single child.
- Do not place inside a shrink-to-fit parent (`inline-flex`, `width: fit-content`, a float) → give it a parent with a definite width (block, grid cell, or stretched flex item). It contributes no intrinsic width and collapses to zero otherwise.

## Variant selection

### `ratio` prop (required) — Figma `Ratio`

| Value | Use when |
|-------|----------|
| `"16:9"` | Video, hero banners, widescreen media. Figma default. |
| `"21:9"` | Cinematic or panoramic banners spanning a full content width. |
| `"3:2"` | Standard photography from cameras. |
| `"4:3"` | Gallery and card tiles where a slightly taller frame fits more subject. |
| `"1:1"` | Square thumbnails and product tiles; with `shape="ellipse"` for circular photos. |
| `"3:4"` | Portrait photos. |
| `"9:16"` | Vertical video and story-format media. |

### `shape` prop — Figma `Shape`

| Value | Use when |
|-------|----------|
| `"rectangle"` | Default. Media sits inside a container that already owns its corners (e.g. a `Card` body), or edge-to-edge media. |
| `"rounded"` | Standalone media that needs softened corners, matching the control radius (`--shape-radius-md`). |
| `"ellipse"` | Oval crop; a circle when `ratio="1:1"`. |

### `fit` prop — code only (in Figma: the Media layer's image scale mode)

| Value | Figma scale mode | Use when |
|-------|------------------|----------|
| `"cover"` | Fill | Images and video — fill the box and crop overflow. The usual choice. |
| `"contain"` | Fit | The whole media must stay visible (logos, diagrams); letterboxes. |
| `"center"` | Crop | The child keeps its natural size, centered (an icon or small graphic on a placeholder). |
| omitted | — | The child sets its own size and position. |

## Spatial contract

- **Owns its padding:** no — the content slot fills the box edge to edge.
- **Owns its margin:** no — space it from siblings with `--space-*` on the parent.
- **Fills its container:** yes, horizontally — width is always the full containing block; height comes from `ratio`.
- **Notes:** Never set a height on its own — it overrides the ratio. To size from height instead, set `width: auto` together with a height on a wrapper. The ratio is a class-level CSS rule (never inline), so a breakpoint-specific ratio can be set from app CSS under `@media` / `@container` targeting `.dsn-aspect-ratio`; always keep a default ratio outside the query.

## Composition rules

- ✅ Can be used inside: grid cells, block containers, `Card` bodies, stretched flex items.
- ✅ Can wrap: `<img>`, `<video>`, `SkeletonLoading`, or one wrapper element holding media plus an overlay or caption.
- ❌ Never place inside: shrink-to-fit parents or another `AspectRatio` — see When NOT to use.
- ❌ Never combine with: more than one direct child when `fit` is set — every direct child is stretched to fill the box.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `ratio` | `'1:1' \| '4:3' \| '3:2' \| '16:9' \| '21:9' \| '3:4' \| '9:16'` | Always — it is a string union, not a number. |
| `fit` | `'cover' \| 'contain' \| 'center'` | Set for `<img>` / `<video>` children so they need no width, height, or object-fit styles of their own. |
| `shape` | `'rectangle' \| 'rounded' \| 'ellipse'` | Only when the default square corners are wrong for the context. |
| `children` | `ReactNode` | Exactly one child. Media children carry their own `alt` (`alt=""` when decorative). |

## Accessibility

- `AspectRatio` adds no role, no accessible name, and is not focusable — the child carries the whole description.
- Every `<img>` child needs `alt`; use `alt=""` when the image is purely decorative.

## Common mistakes

1. **Passing a number or `"16/9"` as `ratio`** — the prop is a string union; see Props reference.
2. **Repeating `width`, `height`, or `object-fit` on the child when `fit` is set** — `fit` already sizes the child; see `fit` prop.
3. **Passing an image and a caption as two children** — wrap them in one child; see Composition rules.
4. **Setting only a height on the box** — breaks the ratio; see Spatial contract.
5. **Using it for a profile picture** — use `Avatar`; see When NOT to use.

## Examples

~~~tsx
// Most common: responsive 16:9 image
<AspectRatio ratio="16:9" fit="cover">
  <img src={heroUrl} alt="Team planning session around a whiteboard" />
</AspectRatio>

// Loading placeholder that reserves the final media space
<AspectRatio ratio="4:3" fit="cover" shape="rounded">
  {isLoading ? <SkeletonLoading type="image" /> : <img src={url} alt={caption} />}
</AspectRatio>

// Circular photo that is not an identity avatar
<AspectRatio ratio="1:1" fit="cover" shape="ellipse">
  <img src={photoUrl} alt="Product sample on a white background" />
</AspectRatio>
~~~
