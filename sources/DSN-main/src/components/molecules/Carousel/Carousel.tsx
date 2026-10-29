import { Children, isValidElement, useEffect, useId, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AspectRatio } from '../../atoms/AspectRatio';
import type { AspectRatioRatio } from '../../atoms/AspectRatio';
import { useSlideNavigation } from '../../../hooks/useSlideNavigation';
import './Carousel.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CarouselShape = 'rectangle' | 'rounded';

export interface CarouselSlideProps {
  /** Slide content — usually one `<img>` with meaningful `alt`. */
  children: ReactNode;
  /** Image shown in the thumbnail strip. Required on every slide when `showThumbnails` is set. */
  thumbnailSrc?: string;
  /**
   * Accessible name of the thumbnail button.
   * @default 'Show slide n'
   */
  thumbnailAlt?: string;
}

export interface CarouselProps {
  /** Accessible name of the carousel region, e.g. "Project photos". */
  label: string;

  /** One `CarouselSlide` per slide. */
  children: ReactNode;

  /**
   * Shape of the frame every slide is shown in.
   * @default '16:9'
   */
  ratio?: AspectRatioRatio;

  /**
   * Frame corners. `rounded` uses `--shape-radius-md`.
   * @default 'rectangle'
   */
  shape?: CarouselShape;

  /** Current slide (0-based). Set together with `onIndexChange` to control the carousel. */
  index?: number;

  /**
   * Initial slide when uncontrolled (0-based).
   * @default 0
   */
  defaultIndex?: number;

  /** Called with the new 0-based index whenever the slide changes. */
  onIndexChange?: (index: number) => void;

  /**
   * Show the "3 / 27" position counter over the frame.
   * @default true
   */
  showCounter?: boolean;

  /**
   * Show one dot per slide over the frame. Only for sets of 10 slides or fewer.
   * @default false
   */
  showDots?: boolean;

  /**
   * Show a strip of thumbnails below the frame. Needs `thumbnailSrc` on every slide.
   * @default false
   */
  showThumbnails?: boolean;

  /** Additional CSS class names merged onto the root element. */
  className?: string;
}

const MAX_DOTS = 10;

// ─── CarouselSlide ───────────────────────────────────────────────────────────

/**
 * One slide of a `Carousel`. Renders its children; the parent Carousel owns
 * the slide wrapper, its ARIA, and the thumbnail.
 */
export function CarouselSlide({ children }: CarouselSlideProps) {
  return <>{children}</>;
}

// ─── Carousel ────────────────────────────────────────────────────────────────

/**
 * Shows a set of slides one at a time in a fixed-ratio frame, with previous/next
 * arrows, a position counter, and optional dots and thumbnails.
 *
 * @aiSelectWhen Showing several images (or cards) in the space of one, where the user steps through them in order
 *
 * @aiAvoid Do not use to show all items at once — use a grid of AspectRatio tiles instead
 * @aiAvoid Do not use for paging through table rows or records — use Pagination instead
 * @aiAvoid Do not use for a single image — use AspectRatio instead
 * @aiAvoid Do not use for full-screen viewing of images, PDFs or video — use MediaViewer instead
 * @aiAvoid Do not use to switch between views or panels of content — use Tab or SegmentControl instead
 *
 * @aiVariant showCounter — default on; the "3 / 27" position label
 * @aiVariant showDots — small sets only (10 or fewer slides)
 * @aiVariant showThumbnails — large photo sets where users jump to a specific image; every slide needs thumbnailSrc
 *
 * @aiSpatial Width is 100% of the container; frame height comes from ratio. Controls are overlaid inside the frame; thumbnails add a row below. No outer margin
 *
 * @aiCompose Children must be CarouselSlide elements, one per slide; each image child carries its own alt text
 * @aiCompose Never place inside a shrink-to-fit parent (inline-flex, width: fit-content) — the frame collapses to zero width
 */
export function Carousel({
  label,
  children,
  ratio = '16:9',
  shape = 'rectangle',
  index: controlledIndex,
  defaultIndex = 0,
  onIndexChange,
  showCounter = true,
  showDots = false,
  showThumbnails = false,
  className,
}: CarouselProps) {
  const slides = Children.toArray(children).filter(
    (child): child is ReactElement<CarouselSlideProps> => isValidElement(child),
  );
  const count = slides.length;

  const {
    current,
    lastIndex,
    hasNavigated,
    goTo,
    handleKeyDown,
    swipeHandlers,
    prevArrowRef,
    nextArrowRef,
  } = useSlideNavigation({ count, index: controlledIndex, defaultIndex, onIndexChange });

  const id = useId();
  const trackId = `${id}-track`;
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keep the active thumbnail visible — only after user navigation, so the
  // page never scrolls on mount.
  useEffect(() => {
    if (!showThumbnails || !hasNavigated) return;
    thumbRefs.current[current]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [current, showThumbnails, hasNavigated]);

  const dotsVisible = showDots && count > 1 && count <= MAX_DOTS;
  useEffect(() => {
    if (import.meta.env.DEV && showDots && count > MAX_DOTS) {
      console.warn(
        `[Carousel] showDots supports up to ${MAX_DOTS} slides (got ${count}). Use showThumbnails or the counter instead.`,
      );
    }
  }, [showDots, count]);

  const rootClass = ['dsn-carousel', className].filter(Boolean).join(' ');
  const hasControls = count > 1;

  return (
    <section
      className={rootClass}
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      <AspectRatio ratio={ratio} shape={shape} className="dsn-carousel-frame">
        <div className="dsn-carousel-viewport" {...swipeHandlers}>
          <div
            id={trackId}
            className="dsn-carousel-track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((slide, i) => {
              const isCurrent = i === current;
              return (
                <div
                  key={slide.key ?? i}
                  className="dsn-carousel-slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                  aria-hidden={isCurrent ? undefined : true}
                  // @types/react 18 lacks `inert`; React 19 treats it as a boolean.
                  {...({ inert: !isCurrent } as Record<string, boolean>)}
                  data-current={isCurrent || undefined}
                >
                  {slide}
                </div>
              );
            })}
          </div>
        </div>

        {hasControls && (
          <>
            <div ref={prevArrowRef} className="dsn-carousel-arrow" data-side="previous">
              {current > 0 && (
                <button
                  type="button"
                  className="dsn-carousel-arrow-button"
                  aria-label="Previous slide"
                  onClick={() => goTo(current - 1)}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            <div ref={nextArrowRef} className="dsn-carousel-arrow" data-side="next">
              {current < lastIndex && (
                <button
                  type="button"
                  className="dsn-carousel-arrow-button"
                  aria-label="Next slide"
                  onClick={() => goTo(current + 1)}
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </>
        )}

        {dotsVisible && (
          <div className="dsn-carousel-dots" role="group" aria-label="Choose slide">
            {slides.map((slide, i) => (
              <button
                key={slide.key ?? i}
                type="button"
                className="dsn-carousel-dot"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current || undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}

        {showCounter && hasControls && (
          <div className="dsn-carousel-counter" aria-hidden="true">
            {current + 1} / {count}
          </div>
        )}
      </AspectRatio>

      <div className="dsn-carousel-live" aria-live="polite" aria-atomic="true">
        {hasNavigated ? `Slide ${current + 1} of ${count}` : ''}
      </div>

      {showThumbnails && hasControls && (
        <div className="dsn-carousel-thumbnails" role="group" aria-label="Thumbnails">
          {slides.map((slide, i) => (
            <button
              key={slide.key ?? i}
              ref={(el) => { thumbRefs.current[i] = el; }}
              type="button"
              className="dsn-carousel-thumbnail"
              aria-label={slide.props.thumbnailAlt ?? `Show slide ${i + 1}`}
              aria-current={i === current || undefined}
              onClick={() => goTo(i)}
            >
              <AspectRatio ratio="1:1" fit="cover">
                <img src={slide.props.thumbnailSrc} alt="" />
              </AspectRatio>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default Carousel;
