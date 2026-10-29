import type { ReactNode } from 'react';
import './AspectRatio.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AspectRatioRatio = '1:1' | '4:3' | '3:2' | '16:9' | '21:9' | '3:4' | '9:16';
export type AspectRatioFit = 'cover' | 'contain' | 'center';
export type AspectRatioShape = 'rectangle' | 'rounded' | 'ellipse';

export interface AspectRatioProps {
  /**
   * Width-to-height ratio of the box. Width comes from the container; height is derived.
   * Matches the Figma `Ratio` variant.
   */
  ratio: AspectRatioRatio;

  /**
   * How the child is sized inside the box.
   * - `cover`   — fills the box and crops (images, video)
   * - `contain` — fills the box and letterboxes
   * - `center`  — keeps the child's natural size, centered
   * When omitted, the child styles itself.
   */
  fit?: AspectRatioFit;

  /**
   * Outline of the box. Matches the Figma `Shape` variant.
   * - `rectangle` — square corners (default)
   * - `rounded`   — `--shape-radius-md` corners
   * - `ellipse`   — oval clip; a circle when `ratio="1:1"`
   * @default 'rectangle'
   */
  shape?: AspectRatioShape;

  /** One child — an image, video, or a single wrapper for overlays. */
  children: ReactNode;

  /** Additional CSS class names merged onto the root element. */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Keeps its child at a fixed width-to-height ratio as the container resizes.
 *
 * @aiSelectWhen Showing media (image, video, thumbnail, avatar photo) that must keep consistent proportions across screen sizes
 *
 * @aiAvoid Do not use as a general layout container for text, forms or controls — use AppShell content / Card instead
 * @aiAvoid Do not use for a user or organization identity picture — use Avatar instead
 * @aiAvoid Do not use for attached file previews — use FileThumbnail / AttachmentCard instead
 * @aiAvoid Do not nest AspectRatio inside another AspectRatio — put overlays inside its single child
 *
 * @aiVariant ratio="16:9" — video, hero and widescreen media
 * @aiVariant ratio="4:3" | "3:2" — photos and gallery tiles
 * @aiVariant ratio="1:1" — square thumbnails; with shape="ellipse" for circular profile photos
 * @aiVariant ratio="3:4" | "9:16" — portrait and story-format media
 * @aiVariant shape="rounded" — standalone media that needs softened corners
 *
 * @aiSpatial Width is 100% of the containing block; height comes from the ratio. No internal padding. Never set a height alone — it breaks the ratio
 *
 * @aiCompose Never place inside a shrink-to-fit parent (inline-flex, width: fit-content, floats) — it has no intrinsic width and collapses to zero
 * @aiCompose Use fit="cover" for images and video so the child needs no width/height/object-fit styles. Wrap overlays and captions in a single child. The child carries alt text; AspectRatio adds no role or accessible name
 */
export function AspectRatio({
  ratio,
  fit,
  shape = 'rectangle',
  children,
  className,
}: AspectRatioProps) {
  const rootClass = ['dsn-aspect-ratio', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-ratio={ratio} data-shape={shape} data-fit={fit}>
      <div className="dsn-aspect-ratio-content">{children}</div>
    </div>
  );
}

export default AspectRatio;
