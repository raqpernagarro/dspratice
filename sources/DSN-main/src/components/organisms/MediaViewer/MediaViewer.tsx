import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  File,
  FileText,
  Minus,
  Plus,
  Video,
  X,
} from 'lucide-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { Avatar } from '../../atoms/Avatar';
import { Button } from '../../atoms/Button';
import { ButtonGroup } from '../../atoms/ButtonGroup';
import { FileThumbnail } from '../../atoms/Attachment/FileThumbnail';
import { Tag } from '../../atoms/Tag';
import { useDialogFocus } from '../../../hooks/useDialogFocus';
import { useIsClient } from '../../../hooks/useIsClient';
import { useSlideNavigation } from '../../../hooks/useSlideNavigation';
import './MediaViewer.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MediaViewerItemType = 'image' | 'video' | 'pdf' | 'file';

export interface MediaViewerOwner {
  /** Person or team who posted or owns the file. */
  name: string;
  /** Avatar image. Initials are used when omitted. */
  avatarSrc?: string;
}

export interface MediaViewerItem {
  /** Stable key for the item. */
  id: string;
  /** How the item is rendered. `file` shows a "no preview" card. */
  type: MediaViewerItemType;
  /** URL of the image, video, PDF or file. */
  src: string;
  /** File name. Shown in the top bar and used as the item's accessible name. */
  title: string;
  /** Alternative text. Required for `type="image"`. */
  alt?: string;
  /** Image shown in the thumbnail strip. Images fall back to `src`; other types show a file icon. */
  thumbnailSrc?: string;
  /** Poster frame for `type="video"`. */
  poster?: string;
  /** MIME type, e.g. "application/pdf". Drives the file-type tag; falls back to the title's extension. */
  mimeType?: string;
  /** Pre-formatted file size, e.g. "2.4 MB". */
  size?: string;
  /** Who posted or owns the file. */
  owner?: MediaViewerOwner;
  /** Pre-formatted date, e.g. "12 Mar 2026". */
  createdAt?: string;
  /** Extra metadata rendered under the title. */
  meta?: ReactNode;
}

export interface MediaViewerProps {
  /** Files to show, in order. */
  items: MediaViewerItem[];

  /** Accessible name of the viewer dialog, e.g. "Project files". */
  label: string;

  /** Open state when controlled. Set together with `onOpenChange`. */
  open?: boolean;
  /**
   * Initial open state when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the viewer asks to open or close. */
  onOpenChange?: (open: boolean) => void;

  /** Current item (0-based) when controlled. Set together with `onIndexChange`. */
  index?: number;
  /**
   * Initial item when uncontrolled (0-based).
   * @default 0
   */
  defaultIndex?: number;
  /** Called with the new 0-based index whenever the item changes. */
  onIndexChange?: (index: number) => void;

  /**
   * Actions for the current item (share, download, export…). Return `Button`s —
   * they are laid out in a spaced `ButtonGroup` in the top bar.
   */
  actions?: (item: MediaViewerItem) => ReactNode;

  /**
   * Show zoom out / reset / zoom in controls. Only rendered for images.
   * @default true
   */
  showZoom?: boolean;
  /**
   * Show the "3 / 27" position counter.
   * @default true
   */
  showCounter?: boolean;
  /**
   * Show a strip of thumbnails below the stage.
   * @default false
   */
  showThumbnails?: boolean;
  /**
   * Show owner, date, file type and size in the top bar. The title is always shown.
   * @default true
   */
  showMetadata?: boolean;
  /**
   * Close on Escape.
   * @default true
   */
  closeOnEscape?: boolean;

  /** Additional CSS class names merged onto the root element. */
  className?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;
/** Pixels moved per arrow key press / pan button click while zoomed. */
const PAN_STEP = 80;

type PanDirection = 'up' | 'down' | 'left' | 'right';

const PAN_KEYS: Record<string, PanDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const MIME_LABELS: Record<string, string> = {
  jpeg: 'JPG',
  quicktime: 'MOV',
  'svg+xml': 'SVG',
  plain: 'TXT',
};

/** Short file-type label: "PDF", "MP4", "JPG". */
export function getFileTypeLabel(item: Pick<MediaViewerItem, 'mimeType' | 'title'>): string | undefined {
  if (item.mimeType) {
    const subtype = item.mimeType.split('/')[1]?.toLowerCase();
    if (subtype) return MIME_LABELS[subtype] ?? subtype.toUpperCase();
  }
  const ext = item.title.includes('.') ? item.title.split('.').pop() : undefined;
  return ext ? (MIME_LABELS[ext.toLowerCase()] ?? ext.toUpperCase()) : undefined;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

/** Elements that use arrow keys themselves — viewer navigation stays out of their way. */
function ownsArrowKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('video, audio, iframe, input, textarea, select, [contenteditable="true"], [role="menu"], [role="listbox"]'),
  );
}

// ─── Stage renderers ─────────────────────────────────────────────────────────

function NoPreview({ item, reason }: { item: MediaViewerItem; reason: string }) {
  const typeLabel = getFileTypeLabel(item);
  const icon =
    item.type === 'pdf' ? <FileText size={48} strokeWidth={1.75} aria-hidden="true" /> : undefined;
  return (
    <div className="dsn-media-viewer-fallback">
      <FileThumbnail variant="file" size="xxLarge" icon={icon} aria-label={typeLabel ? `${typeLabel} file` : 'File'} />
      <p className="dsn-media-viewer-fallback-title">{item.title}</p>
      <p className="dsn-media-viewer-fallback-text">{reason}</p>
      <a className="dsn-media-viewer-fallback-link" href={item.src} target="_blank" rel="noreferrer">
        Open in new tab
      </a>
    </div>
  );
}

function pdfViewerUnavailable(): boolean {
  return typeof navigator !== 'undefined' && (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled === false;
}

// ─── MediaViewer ─────────────────────────────────────────────────────────────

/**
 * Full-screen viewer (lightbox) for images, PDFs and video. Steps through a set of
 * files like Carousel, with a top bar for file metadata, item actions, zoom and close.
 *
 * @aiSelectWhen The user opens a file or image to see it large, and may step through the rest of the set
 * @aiSelectWhen A file preview needs actions such as download, share or export next to it
 *
 * @aiAvoid Do not use for an inline gallery inside the page — use Carousel instead
 * @aiAvoid Do not use for a task or decision — use Modal instead
 * @aiAvoid Do not use to list or pick files — use AttachmentField or FileRow instead
 *
 * @aiVariant showThumbnails — sets of more than a few files where users jump to a specific one
 * @aiVariant showMetadata=false — when owner, date and type add nothing (e.g. a product photo gallery)
 * @aiVariant showZoom — default on; only rendered for images
 *
 * @aiSpatial Portaled to document.body and covers the viewport; ignores the layout of its mount point
 *
 * @aiCompose actions returns Buttons only (icon-only ghost Buttons with aria-label); the viewer wraps them in a ButtonGroup
 * @aiCompose Never open a Modal or another MediaViewer from inside a MediaViewer
 */
export function MediaViewer({
  items,
  label,
  open,
  defaultOpen = false,
  onOpenChange,
  index,
  defaultIndex = 0,
  onIndexChange,
  actions,
  showZoom = true,
  showCounter = true,
  showThumbnails = false,
  showMetadata = true,
  closeOnEscape = true,
  className,
}: MediaViewerProps) {
  const isClient = useIsClient();
  const isOpenControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isOpenControlled ? open : internalOpen;

  const dialogRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [scale, setScale] = useState(1);
  const titleId = useId();

  const count = items.length;
  const {
    current,
    lastIndex,
    hasNavigated,
    goTo,
    handleKeyDown: handleNavKeyDown,
    swipeHandlers,
    prevArrowRef,
    nextArrowRef,
  } = useSlideNavigation({
    count,
    index,
    defaultIndex,
    onIndexChange,
    canSwipe: () => scale <= MIN_SCALE,
  });
  const item = items[current] as MediaViewerItem | undefined;

  // Slides with content: the current one plus any still sliding out. Everything
  // else is an empty placeholder in the track, so far-off PDFs and videos never load.
  const [mounted, setMounted] = useState<number[]>([current]);

  const requestClose = () => {
    if (!isOpenControlled) setInternalOpen(false);
    onOpenChange?.(false);
  };

  useDialogFocus({
    isOpen,
    dialogRef,
    onEscape: requestClose,
    closeOnEscape,
    getInitialFocus: (dialog) => dialog.querySelector<HTMLElement>('button.dsn-media-viewer-close'),
  });

  // Zoom always starts at 100% on a new item.
  useEffect(() => {
    setScale(1);
  }, [current]);

  // Keep outgoing slides rendered until the track finishes sliding (see onTransitionEnd).
  // With reduced motion there is no transition, so drop them straight away.
  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setMounted((prev) => (reduceMotion ? [current] : prev.includes(current) ? prev : [...prev, current]));
  }, [current]);

  // A video that slides out stops playing.
  useEffect(() => {
    dialogRef.current
      ?.querySelectorAll<HTMLVideoElement>('.dsn-media-viewer-item:not([data-current]) video')
      .forEach((video) => video.pause());
  }, [current]);

  // Preload neighbouring images so stepping through feels instant.
  useEffect(() => {
    if (!isOpen) return;
    [current - 1, current + 1].forEach((i) => {
      const neighbour = items[i];
      if (neighbour?.type === 'image') {
        const img = new Image();
        img.src = neighbour.src;
      }
    });
  }, [isOpen, current, items]);

  useEffect(() => {
    if (!isOpen || !showThumbnails || !hasNavigated) return;
    thumbRefs.current[current]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [isOpen, current, showThumbnails, hasNavigated]);

  useEffect(() => {
    if (!import.meta.env.DEV || !isOpen) return;
    items.forEach((it) => {
      if (it.type === 'image' && !it.alt) {
        console.warn(`[MediaViewer] Image "${it.title}" has no alt text.`);
      }
    });
  }, [isOpen, items]);

  if (!isOpen || !item) return null;

  const isImage = item.type === 'image';
  const zoomVisible = showZoom && isImage;
  const hasNav = count > 1;
  const typeLabel = getFileTypeLabel(item);
  const percent = Math.round(scale * 100);
  const isZoomed = zoomVisible && scale > MIN_SCALE;

  /** Moves the view over a zoomed image — keyboard (2.1.1) and single-pointer (2.5.7) alternative to drag-panning. */
  const pan = (direction: PanDirection) => {
    const zoom = zoomRef.current;
    if (!zoom) return;
    const { positionX, positionY, scale: currentScale } = zoom.instance.transformState;
    const dx = direction === 'left' ? PAN_STEP : direction === 'right' ? -PAN_STEP : 0;
    const dy = direction === 'up' ? PAN_STEP : direction === 'down' ? -PAN_STEP : 0;
    const bounds = zoom.instance.bounds;
    const clampTo = (value: number, min?: number, max?: number) =>
      min === undefined || max === undefined ? value : Math.min(max, Math.max(min, value));
    zoom.setTransform(
      clampTo(positionX + dx, bounds?.minPositionX, bounds?.maxPositionX),
      clampTo(positionY + dy, bounds?.minPositionY, bounds?.maxPositionY),
      currentScale,
      150,
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (ownsArrowKeys(event.target)) return;
    if (zoomVisible && (event.key === '+' || event.key === '=')) {
      event.preventDefault();
      zoomRef.current?.zoomIn(ZOOM_STEP);
      return;
    }
    if (zoomVisible && event.key === '-') {
      event.preventDefault();
      zoomRef.current?.zoomOut(ZOOM_STEP);
      return;
    }
    if (zoomVisible && event.key === '0') {
      event.preventDefault();
      zoomRef.current?.resetTransform();
      return;
    }
    // While zoomed, arrow keys pan the image instead of changing slides.
    if (isZoomed && PAN_KEYS[event.key] && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      pan(PAN_KEYS[event.key]);
      return;
    }
    handleNavKeyDown(event);
  };

  const renderStage = (slide: MediaViewerItem, isCurrent: boolean) => {
    switch (slide.type) {
      case 'image':
        // Only the current image is zoomable; others render the same layout without zoom state.
        return isCurrent ? (
          <TransformWrapper
            ref={zoomRef}
            minScale={MIN_SCALE}
            maxScale={MAX_SCALE}
            centerOnInit
            doubleClick={{ mode: scale > MIN_SCALE ? 'reset' : 'zoomIn', step: 1 }}
            panning={{ disabled: scale <= MIN_SCALE }}
            onTransformed={(_ref, state) => setScale(state.scale)}
          >
            <TransformComponent
              wrapperClass="dsn-media-viewer-zoom"
              contentClass="dsn-media-viewer-zoom-content"
            >
              <img className="dsn-media-viewer-image" src={slide.src} alt={slide.alt ?? ''} draggable={false} />
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <div className="dsn-media-viewer-zoom">
            <div className="dsn-media-viewer-zoom-content">
              <img className="dsn-media-viewer-image" src={slide.src} alt={slide.alt ?? ''} draggable={false} />
            </div>
          </div>
        );
      case 'video':
        return (
          <video
            className="dsn-media-viewer-video"
            src={slide.src}
            poster={slide.poster}
            controls
            preload="metadata"
            aria-label={slide.title}
          />
        );
      case 'pdf':
        return pdfViewerUnavailable() ? (
          <NoPreview item={slide} reason="This browser can't show PDFs here." />
        ) : (
          <iframe className="dsn-media-viewer-pdf" src={slide.src} title={slide.title} />
        );
      default:
        return <NoPreview item={slide} reason="There's no preview for this file type." />;
    }
  };

  const metaLine = showMetadata
    ? [item.owner?.name, item.createdAt].filter(Boolean).join(' · ')
    : '';

  const rootClass = ['dsn-media-viewer', className].filter(Boolean).join(' ');

  // No document during SSR; the portal mounts once hydrated.
  if (!isClient) return null;

  return createPortal(
    <div
      ref={dialogRef}
      className={rootClass}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-describedby={titleId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <header className="dsn-media-viewer-topbar">
        <div className="dsn-media-viewer-info">
          {showMetadata && item.owner && (
            <Avatar
              size="sm"
              fill={item.owner.avatarSrc ? 'picture' : 'initials'}
              src={item.owner.avatarSrc}
              initials={getInitials(item.owner.name)}
              name={item.owner.name}
              className="dsn-media-viewer-avatar"
            />
          )}
          <div className="dsn-media-viewer-text">
            <div className="dsn-media-viewer-title-row">
              <h2 id={titleId} className="dsn-media-viewer-title">{item.title}</h2>
              {showMetadata && typeLabel && (
                <Tag label={typeLabel} size="sm" variant="neutral" className="dsn-media-viewer-type" />
              )}
              {showMetadata && item.size && (
                <span className="dsn-media-viewer-size">{item.size}</span>
              )}
            </div>
            {(metaLine || (showMetadata && item.meta)) && (
              <div className="dsn-media-viewer-meta">
                {metaLine && <span>{metaLine}</span>}
                {showMetadata && item.meta}
              </div>
            )}
          </div>
        </div>

        <div className="dsn-media-viewer-controls">
          {actions && (
            <ButtonGroup spaceBetween aria-label="File actions">
              {actions(item)}
            </ButtonGroup>
          )}
          {zoomVisible && (
            <ButtonGroup aria-label="Zoom" className="dsn-media-viewer-zoom-controls">
              <Button
                variant="secondary"
                showLabel={false}
                showLeadingIcon
                leadingIcon={<Minus size={16} />}
                aria-label="Zoom out"
                disabled={scale <= MIN_SCALE}
                onClick={() => zoomRef.current?.zoomOut(ZOOM_STEP)}
              />
              <Button
                variant="secondary"
                aria-label={`Reset zoom, currently ${percent}%`}
                disabled={scale <= MIN_SCALE}
                onClick={() => zoomRef.current?.resetTransform()}
                className="dsn-media-viewer-zoom-value"
              >
                {`${percent}%`}
              </Button>
              <Button
                variant="secondary"
                showLabel={false}
                showLeadingIcon
                leadingIcon={<Plus size={16} />}
                aria-label="Zoom in"
                disabled={scale >= MAX_SCALE}
                onClick={() => zoomRef.current?.zoomIn(ZOOM_STEP)}
              />
            </ButtonGroup>
          )}
          {isZoomed && (
            <ButtonGroup aria-label="Move image" className="dsn-media-viewer-pan-controls">
              {([
                ['left', 'Move left', <ArrowLeft size={16} />],
                ['up', 'Move up', <ArrowUp size={16} />],
                ['down', 'Move down', <ArrowDown size={16} />],
                ['right', 'Move right', <ArrowRight size={16} />],
              ] as const).map(([direction, ariaLabel, icon]) => (
                <Button
                  key={direction}
                  variant="secondary"
                  showLabel={false}
                  showLeadingIcon
                  leadingIcon={icon}
                  aria-label={ariaLabel}
                  onClick={() => pan(direction)}
                />
              ))}
            </ButtonGroup>
          )}
          <Button
            variant="ghost"
            showLabel={false}
            showLeadingIcon
            leadingIcon={<X size={16} />}
            aria-label="Close viewer"
            onClick={requestClose}
            className="dsn-media-viewer-close"
          />
        </div>
      </header>

      <div className="dsn-media-viewer-stage" {...swipeHandlers}>
        <div
          className="dsn-media-viewer-track"
          style={{ transform: `translateX(-${current * 100}%)` }}
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget) setMounted([current]);
          }}
        >
          {items.map((it, i) => {
            const isCurrent = i === current;
            return (
              <div
                key={it.id}
                className="dsn-media-viewer-item"
                role="group"
                aria-roledescription="slide"
                aria-label={`${it.title}, ${i + 1} of ${count}`}
                aria-hidden={isCurrent ? undefined : true}
                // @types/react 18 lacks `inert`; React 19 treats it as a boolean.
                {...({ inert: !isCurrent } as Record<string, boolean>)}
                data-current={isCurrent || undefined}
                data-type={it.type}
              >
                {(isCurrent || mounted.includes(i)) && renderStage(it, isCurrent)}
              </div>
            );
          })}
        </div>

        {hasNav && (
          <>
            <div ref={prevArrowRef} className="dsn-media-viewer-arrow" data-side="previous">
              {current > 0 && (
                <button
                  type="button"
                  className="dsn-media-viewer-arrow-button"
                  aria-label="Previous file"
                  onClick={() => goTo(current - 1)}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            <div ref={nextArrowRef} className="dsn-media-viewer-arrow" data-side="next">
              {current < lastIndex && (
                <button
                  type="button"
                  className="dsn-media-viewer-arrow-button"
                  aria-label="Next file"
                  onClick={() => goTo(current + 1)}
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </>
        )}

        {showCounter && hasNav && (
          <div className="dsn-media-viewer-counter" aria-hidden="true">
            {current + 1} / {count}
          </div>
        )}
      </div>

      <div className="dsn-media-viewer-live" aria-live="polite" aria-atomic="true">
        {hasNavigated ? `${item.title}, ${current + 1} of ${count}` : ''}
      </div>

      {showThumbnails && hasNav && (
        <div className="dsn-media-viewer-thumbnails" role="group" aria-label="Thumbnails">
          {items.map((it, i) => {
            const thumbSrc = it.thumbnailSrc ?? (it.type === 'image' ? it.src : undefined);
            const Icon = it.type === 'video' ? Video : it.type === 'pdf' ? FileText : File;
            return (
              <button
                key={it.id}
                ref={(el) => { thumbRefs.current[i] = el; }}
                type="button"
                className="dsn-media-viewer-thumbnail"
                aria-label={`Show ${it.title}`}
                aria-current={i === current || undefined}
                onClick={() => goTo(i)}
              >
                {thumbSrc ? (
                  <img src={thumbSrc} alt="" />
                ) : (
                  <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body,
  );
}

export default MediaViewer;
