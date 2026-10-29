# Carousel

**Tier:** molecule  
**Location:** `src/components/molecules/Carousel/Carousel.spec.md`  
**Version:** 1.0.0

## What it is

A fixed-ratio frame that shows one slide at a time from a set, with previous/next arrows and a "3 / 27" position counter overlaid on the media, plus optional dots and an optional thumbnail strip.

## When to use

- Use when several images (or cards) must share the space of one and the user steps through them in order.
- Use when the user needs to know their position in a set ("3 / 27") while browsing it.
- Use when a large photo set needs both sequential browsing and jumping to a specific image — add `showThumbnails`.

## When NOT to use

- Do not use when all items should be visible at once → use a grid of `AspectRatio` tiles instead.
- Do not use to open images or files full screen → use `MediaViewer` instead.
- Do not use for a single image → use `AspectRatio` instead (Carousel hides its controls with one slide, but adds nothing).
- Do not use for paging through table rows or records → use `Pagination` instead.
- Do not use to switch between views or panels of content → use `Tab` or `SegmentControl` instead.
- Do not use for rotating promotional content that must advance on its own — Carousel never autoplays, by design.

## Variant selection

### Position indicators

| Prop | Use when |
|------|----------|
| `showCounter` (default `true`) | Always, unless dots already convey position in a small set. The only indicator that scales to any set size. |
| `showDots` | Small sets of 10 slides or fewer, where seeing the set size at a glance helps. Above 10 the dots are not rendered (dev warning). |
| `showThumbnails` | Large photo sets where users look for a specific image. Every `CarouselSlide` needs `thumbnailSrc`. |

### `ratio` prop

Same values and guidance as `AspectRatio` — choose the ratio of the majority of the media; every slide is cropped (`object-fit: cover`) to it.

### `shape` prop

| Value | Use when |
|-------|----------|
| `"rectangle"` | Default. Inside a container that already owns its corners, or edge-to-edge. |
| `"rounded"` | Standalone carousel; uses `--shape-radius-md`. |

## Spatial contract

- **Owns its padding:** no — the frame is edge to edge; arrows, counter, and dots are inset inside the frame.
- **Owns its margin:** no — space it from siblings with `--space-*` on the parent.
- **Fills its container:** yes, horizontally — the frame height comes from `ratio`. Thumbnails add a row below the frame.
- **Notes:** Needs a parent with a definite width — inherits the `AspectRatio` contract. Overlay controls always use the inverted surface; do not restyle them per photo.

## Composition rules

- ✅ Can be used inside: page sections, `Card` bodies, `Drawer` and `Modal` content, grid cells.
- ✅ Children: `CarouselSlide` elements only, one per slide. Each slide holds one `<img>`/`<video>` (filled with cover) or one wrapper element.
- ❌ Never place inside: shrink-to-fit parents (`inline-flex`, `width: fit-content`) — the frame collapses to zero width.
- ❌ Never combine with: another Carousel nested in a slide, or interactive controls inside slides that need arrow keys — Carousel uses ArrowLeft/ArrowRight/Home/End while focus is inside it.

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Always — names the carousel region for screen readers (e.g. "Project photos"). Noun phrase, sentence case. |
| `index` + `onIndexChange` | `number`, `(i) => void` | When the parent must know or drive the current slide (e.g. sync with a caption or URL). Otherwise use `defaultIndex`. |
| `CarouselSlide.thumbnailAlt` | `string` | When thumbnails are shown — describe the image so the thumbnail button has a meaningful name. Defaults to "Show slide n". |

## Accessibility

- Region: `aria-roledescription="carousel"` + `aria-label={label}`; each slide is `role="group"` + `aria-roledescription="slide"` + `aria-label="3 of 27"`.
- Off-screen slides are `aria-hidden` and `inert` — their contents cannot be focused.
- Position changes are announced in a polite live region ("Slide 4 of 27") after user navigation, never on mount.
- Keyboard: Tab reaches the arrows, dots, and thumbnails; ArrowLeft/ArrowRight/Home/End move slides while focus is inside. The previous arrow is not rendered on the first slide and the next arrow not on the last; if the focused arrow disappears, focus moves to the opposite arrow.
- Touch swipe is an enhancement; the arrow buttons are the single-pointer non-drag alternative (WCAG 2.5.7). Mouse drags do nothing.
- Dots and arrows have at least a 24px hit area (WCAG 2.5.8). Slide transitions use `--motion-transition-normal`, so reduced-motion users get instant changes.
- Every image needs its own `alt`; the visual counter is `aria-hidden` (the live region and slide labels carry position).

## Common mistakes

1. **Passing plain `<img>` elements as children** — wrap each in `CarouselSlide`; see Composition rules.
2. **Using dots for a large set** — dots stop rendering above 10 slides; see `showDots`.
3. **Enabling thumbnails without `thumbnailSrc`** — every slide needs one; see `showThumbnails`.
4. **Expecting autoplay or looping** — not supported; see When NOT to use.

## Examples

~~~tsx
// Most common: image set with counter
<Carousel label="Project photos" ratio="16:9">
  {photos.map((p) => (
    <CarouselSlide key={p.id}>
      <img src={p.src} alt={p.alt} loading="lazy" />
    </CarouselSlide>
  ))}
</Carousel>

// Large set with thumbnails, controlled
<Carousel label="Site visit photos" ratio="3:2" shape="rounded" showThumbnails
  index={index} onIndexChange={setIndex}>
  {photos.map((p) => (
    <CarouselSlide key={p.id} thumbnailSrc={p.thumb} thumbnailAlt={`Show: ${p.alt}`}>
      <img src={p.src} alt={p.alt} loading="lazy" />
    </CarouselSlide>
  ))}
</Carousel>
~~~
