import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';

/** Horizontal travel (px) a touch swipe needs before it changes slide. */
export const SWIPE_THRESHOLD = 40;

export interface UseSlideNavigationOptions {
  /** Number of slides. */
  count: number;
  /** Current slide when controlled (0-based). */
  index?: number;
  /** Initial slide when uncontrolled (0-based). */
  defaultIndex?: number;
  /** Called with the new 0-based index whenever the slide changes. */
  onIndexChange?: (index: number) => void;
  /** Return false to ignore a swipe — e.g. while an image is zoomed and the gesture should pan. */
  canSwipe?: () => boolean;
}

export interface UseSlideNavigationReturn {
  current: number;
  lastIndex: number;
  /** True once the user has changed slide; gates live-region announcements and scrolling. */
  hasNavigated: boolean;
  goTo: (index: number) => void;
  /** ArrowLeft / ArrowRight / Home / End. */
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Touch / pen swipe handlers for the viewport. Mouse drags are ignored (WCAG 2.5.7). */
  swipeHandlers: {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLElement>) => void;
    onPointerCancel: () => void;
  };
  /** Wrappers around the previous / next arrow buttons, used to hand focus over when one is removed. */
  prevArrowRef: RefObject<HTMLDivElement>;
  nextArrowRef: RefObject<HTMLDivElement>;
}

/**
 * Shared slide navigation for Carousel and MediaViewer: controlled/uncontrolled
 * index, keyboard, swipe, and arrow focus hand-off.
 */
export function useSlideNavigation({
  count,
  index: controlledIndex,
  defaultIndex = 0,
  onIndexChange,
  canSwipe,
}: UseSlideNavigationOptions): UseSlideNavigationReturn {
  const lastIndex = Math.max(count - 1, 0);
  const clamp = (i: number) => Math.min(Math.max(i, 0), lastIndex);

  const [uncontrolledIndex, setUncontrolledIndex] = useState(() => clamp(defaultIndex));
  const isControlled = controlledIndex !== undefined;
  const current = clamp(isControlled ? controlledIndex : uncontrolledIndex);

  const [hasNavigated, setHasNavigated] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const prevArrowRef = useRef<HTMLDivElement>(null);
  const nextArrowRef = useRef<HTMLDivElement>(null);
  const focusedArrowSide = useRef<'previous' | 'next' | null>(null);

  const goTo = (next: number) => {
    const target = clamp(next);
    if (target === current) return;
    const active = document.activeElement;
    focusedArrowSide.current = prevArrowRef.current?.contains(active)
      ? 'previous'
      : nextArrowRef.current?.contains(active)
        ? 'next'
        : null;
    setHasNavigated(true);
    if (!isControlled) setUncontrolledIndex(target);
    onIndexChange?.(target);
  };

  // The previous arrow is removed on the first slide and the next arrow on the
  // last. If the focused arrow was removed, hand focus to the opposite arrow
  // instead of letting it drop to <body>.
  useEffect(() => {
    const side = focusedArrowSide.current;
    focusedArrowSide.current = null;
    if (!side) return;
    const ownWrapper = side === 'previous' ? prevArrowRef.current : nextArrowRef.current;
    if (ownWrapper?.querySelector('button')) return;
    const other = side === 'previous' ? nextArrowRef.current : prevArrowRef.current;
    other?.querySelector('button')?.focus();
  }, [current]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const keyMap: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: lastIndex,
    };
    if (!(event.key in keyMap)) return;
    event.preventDefault();
    goTo(keyMap[event.key]);
  };

  const swipeHandlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') return;
      pointerStart.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const start = pointerStart.current;
      pointerStart.current = null;
      if (!start || (canSwipe && !canSwipe())) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
      goTo(dx < 0 ? current + 1 : current - 1);
    },
    onPointerCancel: () => {
      pointerStart.current = null;
    },
  };

  return {
    current,
    lastIndex,
    hasNavigated,
    goTo,
    handleKeyDown,
    swipeHandlers,
    prevArrowRef,
    nextArrowRef,
  };
}
