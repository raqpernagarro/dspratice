import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './PopoverWrapper.css';

export type PopoverWrapperRole = 'menu' | 'dialog' | 'listbox' | 'group';
export type PopoverWrapperContentPadding = 'none' | 'small';
export type PopoverPreferredPlacement = 'top' | 'bottom' | 'right' | 'auto';

export interface PopoverWrapperProps {
  id?: string;
  header?: React.ReactNode;
  segment?: React.ReactNode;
  search?: React.ReactNode;
  content: React.ReactNode;
  bottomBar?: React.ReactNode;
  role?: PopoverWrapperRole;
  width?: number | string;
  contentPadding?: PopoverWrapperContentPadding;
  className?: string;
  contentClassName?: string;
  anchorRef?: React.RefObject<HTMLElement | null>;
  offset?: number;
  viewportMargin?: number;
  matchAnchorWidth?: boolean;
  minWidth?: number;
  /**
   * Cap for the panel height in px. Defaults to `--popover-height-max` (320px).
   * The effective max-height is `min(cap, space on the chosen side)`; the content area scrolls.
   */
  maxHeight?: number;
  /** When true (default for anchored popovers), locks scroll on scrollable ancestors while open. */
  lockScroll?: boolean;
  /** Called when a scroll happens outside the popover panel (e.g. to dismiss). */
  onExternalScroll?: () => void;
  /** Reposition while the anchor moves on scroll. Defaults to false — popovers stay put while scroll is locked. */
  repositionOnScroll?: boolean;
  /**
   * Preferred placement relative to the anchor. Default `auto` opens below and flips only when the content does not fit below and there is more room above.
   * `right` opens beside the anchor, top-aligned (sidebar items); falls back to `auto` when it does not fit.
   */
  preferredPlacement?: PopoverPreferredPlacement;
  'aria-label'?: string;
  /** When true, sets aria-multiselectable on the panel root (use with role="listbox"). */
  multiselectable?: boolean;
}

type PopoverPlacement = 'bottom' | 'top' | 'right';

interface PopoverPosition {
  top: number;
  left: number;
  width?: number;
  maxHeight: number;
  placement: PopoverPlacement;
}

interface LockedScrollElement {
  element: HTMLElement;
  overflow: string;
  overflowX: string;
  overflowY: string;
}

const BOTTOM_BAR_ACTION_SELECTOR = 'button, a[href], [role="button"]';

let scrollLockDepth = 0;
let lockedScrollElements: LockedScrollElement[] = [];
let activeWheelHandlers = 0;
let wheelPreventHandler: ((event: WheelEvent) => void) | null = null;

/** True when the event target is inside the anchor root or a portaled popover panel. */
export function isPointerInsideAnchoredPopover(
  event: MouseEvent,
  anchorRoot: HTMLElement | null,
  popoverId?: string,
): boolean {
  const target = event.target as Node;
  if (anchorRoot?.contains(target)) {
    return true;
  }
  if (!popoverId) {
    return false;
  }
  return document.getElementById(popoverId)?.contains(target) ?? false;
}

/**
 * Focus an element inside a portaled popover without scrolling the page to document.body.
 * When the popover content is scrolling (max-height reached), the element is still brought
 * into view inside that content area — the page itself never moves.
 */
export function focusWithoutScroll(element: HTMLElement | null | undefined): void {
  if (!element) {
    return;
  }
  element.focus({ preventScroll: true });
  revealInPopoverContent(element);
  // On first open the panel is still `visibility: hidden` (not yet positioned), which makes
  // browsers ignore focus(), and its max-height is not applied yet. Retry once it has landed.
  afterPopoverLayout(() => {
    if (!element.isConnected) {
      return;
    }
    if (document.activeElement !== element) {
      element.focus({ preventScroll: true });
    }
    revealInPopoverContent(element);
  });
}

/** Scroll an element into view inside its popover's content area without focusing it or moving the page. */
export function scrollIntoPopoverView(element: HTMLElement | null | undefined): void {
  if (!element) {
    return;
  }
  revealInPopoverContent(element);
  afterPopoverLayout(() => {
    if (element.isConnected) {
      revealInPopoverContent(element);
    }
  });
}

function afterPopoverLayout(callback: () => void): void {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(callback);
  }
}

function revealInPopoverContent(element: HTMLElement): void {
  const scroller = element.closest<HTMLElement>('.dsn-popover-wrapper-content');
  if (!scroller || scroller.scrollHeight <= scroller.clientHeight) {
    return;
  }
  const elementRect = element.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  if (elementRect.top < scrollerRect.top) {
    scroller.scrollTop -= scrollerRect.top - elementRect.top;
  } else if (elementRect.bottom > scrollerRect.bottom) {
    scroller.scrollTop += elementRect.bottom - scrollerRect.bottom;
  }
}

function readCssPixelVar(name: string, fallback: number): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }

  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readOverflowAxis(element: HTMLElement, axis: 'X' | 'Y'): string {
  const computed = window.getComputedStyle(element);
  const computedValue = axis === 'Y' ? computed.overflowY : computed.overflowX;
  if (computedValue && computedValue !== 'visible') {
    return computedValue;
  }

  const inlineAxis = axis === 'Y' ? element.style.overflowY : element.style.overflowX;
  if (inlineAxis) {
    return inlineAxis;
  }

  return element.style.overflow;
}

function isScrollableElement(element: HTMLElement): boolean {
  const overflowY = readOverflowAxis(element, 'Y');
  const overflowX = readOverflowAxis(element, 'X');
  const overflowAllowsScrollY =
    overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  const overflowAllowsScrollX =
    overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'overlay';

  if (!overflowAllowsScrollY && !overflowAllowsScrollX) {
    return false;
  }

  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth ||
    overflowAllowsScrollY ||
    overflowAllowsScrollX
  );
}

function isInsideAnchoredPopoverElement(target: Node | null): boolean {
  if (!target || !(target instanceof Element)) {
    return false;
  }
  return target.closest('.dsn-popover-wrapper[data-anchored]') !== null;
}

function lockScrollForAnchor(anchor: HTMLElement): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (scrollLockDepth === 0) {
    lockedScrollElements = [];
    let parent: HTMLElement | null = anchor.parentElement;
    while (parent) {
      if (isScrollableElement(parent)) {
        lockedScrollElements.push({
          element: parent,
          overflow: parent.style.overflow,
          overflowX: parent.style.overflowX,
          overflowY: parent.style.overflowY,
        });
        parent.style.overflow = 'hidden';
      }
      parent = parent.parentElement;
    }

    wheelPreventHandler = (event: WheelEvent) => {
      if (isInsideAnchoredPopoverElement(event.target as Node) || anchor.contains(event.target as Node)) {
        return;
      }
      event.preventDefault();
    };
    document.addEventListener('wheel', wheelPreventHandler, { capture: true, passive: false });
    activeWheelHandlers = 1;
  }

  scrollLockDepth += 1;
}

function unlockScrollForAnchor(): void {
  if (typeof window === 'undefined') {
    return;
  }

  scrollLockDepth = Math.max(0, scrollLockDepth - 1);
  if (scrollLockDepth !== 0) {
    return;
  }

  lockedScrollElements.forEach(({ element, overflow, overflowX, overflowY }) => {
    element.style.overflow = overflow;
    element.style.overflowX = overflowX;
    element.style.overflowY = overflowY;
  });
  lockedScrollElements = [];

  if (wheelPreventHandler && activeWheelHandlers > 0) {
    document.removeEventListener('wheel', wheelPreventHandler, { capture: true });
    wheelPreventHandler = null;
    activeWheelHandlers = 0;
  }
}

export function PopoverWrapper({
  id,
  header,
  segment,
  search,
  content,
  bottomBar,
  role = 'menu',
  width,
  contentPadding = 'none',
  className,
  contentClassName,
  anchorRef,
  offset,
  viewportMargin,
  matchAnchorWidth = false,
  minWidth,
  maxHeight,
  lockScroll,
  onExternalScroll,
  repositionOnScroll = false,
  preferredPlacement = 'auto',
  'aria-label': ariaLabel = 'Popover',
  multiselectable,
}: PopoverWrapperProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [bottomBarSingleAction, setBottomBarSingleAction] = useState(false);

  // A bottom bar with a single action always stretches that action to full width
  // (CSS keys off data-single-action). Count actions in the DOM so the rule holds
  // however the consumer nests the button (Toolbar, ButtonGroup, plain div).
  useLayoutEffect(() => {
    const bar = bottomBarRef.current;
    if (!bar) {
      setBottomBarSingleAction(false);
      return;
    }
    const update = () =>
      setBottomBarSingleAction(bar.querySelectorAll(BOTTOM_BAR_ACTION_SELECTOR).length === 1);
    update();
    const observer = new MutationObserver(update);
    observer.observe(bar, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [bottomBar]);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const resolvedOffset = offset ?? readCssPixelVar('--space-2xs', 4);
  const resolvedViewportMargin = viewportMargin ?? readCssPixelVar('--space-md', 16);
  const resolvedMinWidth = minWidth ?? 192;
  const resolvedMaxHeight = maxHeight ?? readCssPixelVar('--popover-height-max', 320);
  const resolvedZIndex = readCssPixelVar('--z-index-popover', 1060);
  const isAnchored = anchorRef !== undefined;
  const shouldLockScroll = lockScroll ?? isAnchored;

  const applyPosition = useCallback(() => {
    if (!anchorRef?.current || !rootRef.current) {
      return;
    }

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const popoverRect = rootRef.current.getBoundingClientRect();
    // Natural (uncapped) height: the panel's chrome plus the full scroll height of the
    // content area, so the decision does not depend on the max-height applied last time.
    const contentEl = contentRef.current;
    const contentOverflow = contentEl ? contentEl.scrollHeight - contentEl.clientHeight : 0;
    const naturalHeight = popoverRect.height + Math.max(0, contentOverflow);
    const measuredWidth = matchAnchorWidth
      ? Math.max(anchorRect.width, resolvedMinWidth)
      : Math.max(popoverRect.width, resolvedMinWidth);
    const popoverWidth = measuredWidth;

    if (preferredPlacement === 'right') {
      const rightLeft = anchorRect.right + resolvedOffset;
      if (rightLeft + popoverWidth + resolvedViewportMargin <= window.innerWidth) {
        const panelMaxHeight = Math.min(
          resolvedMaxHeight,
          window.innerHeight - 2 * resolvedViewportMargin,
        );
        const height = Math.min(naturalHeight, panelMaxHeight);
        const maxTop = Math.max(
          resolvedViewportMargin,
          window.innerHeight - height - resolvedViewportMargin,
        );
        setPosition({
          top: Math.min(Math.max(anchorRect.top, resolvedViewportMargin), maxTop),
          left: rightLeft,
          width: matchAnchorWidth ? measuredWidth : undefined,
          maxHeight: panelMaxHeight,
          placement: 'right',
        });
        return;
      }
    }

    // Space on each side, net of the trigger gap and the viewport-safe margin.
    const availableBelow = Math.max(
      0,
      window.innerHeight - anchorRect.bottom - resolvedOffset - resolvedViewportMargin,
    );
    const availableAbove = Math.max(0, anchorRect.top - resolvedOffset - resolvedViewportMargin);
    const wantedHeight = Math.min(naturalHeight, resolvedMaxHeight);

    // Below by default. Flip only when the (capped) content does not fit below and there
    // is more room above. The panel is never clamped over its own trigger — max-height
    // shrinks it to the chosen side instead.
    const placeTop = (() => {
      if (preferredPlacement === 'top') {
        return availableAbove >= wantedHeight || availableAbove >= availableBelow;
      }
      if (preferredPlacement === 'bottom') {
        return false;
      }
      return wantedHeight > availableBelow && availableAbove > availableBelow;
    })();

    const available = placeTop ? availableAbove : availableBelow;
    const panelMaxHeight = Math.min(resolvedMaxHeight, available);
    const height = Math.min(naturalHeight, panelMaxHeight);
    const top = placeTop
      ? anchorRect.top - resolvedOffset - height
      : anchorRect.bottom + resolvedOffset;

    const preferredLeft = anchorRect.left;
    const maxLeft = Math.max(
      resolvedViewportMargin,
      window.innerWidth - popoverWidth - resolvedViewportMargin,
    );
    const clampedLeft = Math.min(Math.max(preferredLeft, resolvedViewportMargin), maxLeft);

    setPosition({
      top,
      left: clampedLeft,
      width: matchAnchorWidth ? measuredWidth : undefined,
      maxHeight: panelMaxHeight,
      placement: placeTop ? 'top' : 'bottom',
    });
  }, [
    anchorRef,
    matchAnchorWidth,
    preferredPlacement,
    resolvedMaxHeight,
    resolvedMinWidth,
    resolvedOffset,
    resolvedViewportMargin,
  ]);

  useLayoutEffect(() => {
    if (!anchorRef?.current) {
      setPosition(null);
      return;
    }

    applyPosition();
    const handleWindowChange = () => applyPosition();

    window.addEventListener('resize', handleWindowChange);

    let handleScroll: (() => void) | undefined;
    if (repositionOnScroll) {
      handleScroll = () => applyPosition();
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      if (handleScroll) {
        window.removeEventListener('scroll', handleScroll, true);
      }
    };
  }, [anchorRef, applyPosition, repositionOnScroll]);

  useLayoutEffect(() => {
    if (!isAnchored || !onExternalScroll || !anchorRef?.current) {
      return;
    }

    const anchor = anchorRef.current;
    const handleExternalScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (isInsideAnchoredPopoverElement(target) || anchor.contains(target)) {
        return;
      }
      onExternalScroll();
    };

    window.addEventListener('scroll', handleExternalScroll, true);
    return () => window.removeEventListener('scroll', handleExternalScroll, true);
  }, [anchorRef, isAnchored, onExternalScroll]);

  useLayoutEffect(() => {
    if (!anchorRef?.current || !rootRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => applyPosition());
    observer.observe(anchorRef.current);
    observer.observe(rootRef.current);
    const anchorParent = anchorRef.current.parentElement;
    if (anchorParent) {
      observer.observe(anchorParent);
    }

    return () => observer.disconnect();
  }, [anchorRef, applyPosition]);

  useLayoutEffect(() => {
    if (!isAnchored || !shouldLockScroll || !anchorRef?.current) {
      return;
    }

    const anchor = anchorRef.current;
    lockScrollForAnchor(anchor);
    return () => unlockScrollForAnchor();
  }, [anchorRef, isAnchored, shouldLockScroll]);

  const rootClass = ['dsn-popover-wrapper', className].filter(Boolean).join(' ');
  const contentClass = ['dsn-popover-wrapper-content-slot', contentClassName]
    .filter(Boolean)
    .join(' ');
  const style = useMemo(() => {
    const base: React.CSSProperties = {};

    if (width !== undefined) {
      base.width = width;
    }
    base.minWidth = resolvedMinWidth;

    if (isAnchored) {
      base.position = 'fixed';
      base.zIndex = resolvedZIndex;

      if (position) {
        base.top = position.top;
        base.left = position.left;
        base.maxHeight = position.maxHeight;
        if (position.width !== undefined && width === undefined) {
          base.width = position.width;
        }
      } else {
        base.visibility = 'hidden';
        base.top = 0;
        base.left = 0;
      }
    }

    return Object.keys(base).length > 0 ? base : undefined;
  }, [isAnchored, position, resolvedMinWidth, resolvedZIndex, width]);

  const popover = (
    <div
      id={id}
      ref={rootRef}
      className={rootClass}
      role={role}
      aria-label={ariaLabel}
      aria-multiselectable={multiselectable || undefined}
      data-content-padding={contentPadding}
      data-placement={position?.placement}
      data-anchored={isAnchored || undefined}
      style={style}
    >
      {header && <div className="dsn-popover-wrapper-header">{header}</div>}
      {segment && <div className="dsn-popover-wrapper-segment">{segment}</div>}
      {search && <div className="dsn-popover-wrapper-search">{search}</div>}

      <div ref={contentRef} className="dsn-popover-wrapper-content">
        <div className={contentClass}>{content}</div>
      </div>

      {bottomBar && (
        <div
          ref={bottomBarRef}
          className="dsn-popover-wrapper-bottom-bar"
          data-single-action={bottomBarSingleAction || undefined}
        >
          {bottomBar}
        </div>
      )}
    </div>
  );

  if (isAnchored && typeof document !== 'undefined') {
    return createPortal(popover, document.body);
  }

  return popover;
}

export default PopoverWrapper;
