import './SkeletonLoading.css';

export type SkeletonLoadingType = 'avatar' | 'pill' | 'image' | 'card';

export interface SkeletonLoadingProps {
  type?: SkeletonLoadingType;
  className?: string;
}

/**
 * Shape-matched, aria-hidden animated placeholder for content that hasn't loaded yet.
 *
 * @aiSelectWhen Representing placeholder content while data loads — list rows, cards, avatars, images
 *
 * @aiAvoid Do not use as a page/section-level loading indicator with no shape to match — use LoadingBar or ProgressRing instead
 * @aiAvoid Do not use for a bounded task with a known percentage — use ProgressBar instead
 *
 * @aiVariant type="avatar" — circular avatar/profile image placeholder
 * @aiVariant type="pill" — short text or tag/badge-shaped placeholder
 * @aiVariant type="image" — rectangular image/thumbnail placeholder
 * @aiVariant type="card" — full card-shaped content block placeholder
 *
 * @aiSpatial No internal padding; sizing comes from CSS tied to type. aria-hidden — pair with an aria-live region on the container for screen-reader announcement
 *
 * @aiCompose Match type to the real content it stands in for to avoid a layout shift when content arrives
 */
export function SkeletonLoading({ type = 'avatar', className }: SkeletonLoadingProps) {
  const rootClass = ['dsn-skeleton-loading', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-type={type} aria-hidden="true">
      <div className="dsn-skeleton-loading-glow" />
    </div>
  );
}

export default SkeletonLoading;
