import React, { useEffect, useId, useRef, useState } from 'react';
import './Tooltip.css';

export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipProps {
  /** Tooltip text content. Keep it to one short sentence. */
  content: string;
  /** The trigger element. Should be keyboard focusable when interactive. */
  children: React.ReactElement;
  /** Tooltip placement relative to trigger. */
  placement?: TooltipPlacement;
  /** Delay before showing tooltip on hover/focus. */
  delay?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled open state default. */
  defaultOpen?: boolean;
  /** Disable tooltip behavior. */
  disabled?: boolean;
  className?: string;
  id?: string;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: TooltipPlacement;
}

function readCssPixelVar(name: string, fallback: number): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }

  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mergeDescribedBy(
  existing: string | undefined,
  tooltipId: string,
  isDisabled: boolean,
): string | undefined {
  if (isDisabled) {
    return existing;
  }
  if (!existing) {
    return tooltipId;
  }
  return `${existing} ${tooltipId}`;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 150,
  open,
  defaultOpen = false,
  disabled = false,
  className,
  id,
}: TooltipProps) {
  const autoId = useId();
  const tooltipId = id ?? `dsn-tooltip-${autoId}`;
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOpenControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const isOpen = disabled ? false : isOpenControlled ? open : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isOpenControlled) {
      setInternalOpen(nextOpen);
    }
  };

  const clearOpenTimer = () => {
    if (!openTimerRef.current) {
      return;
    }
    clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  };

  const openWithDelay = () => {
    if (disabled) {
      return;
    }
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => setOpen(true), delay);
  };

  const closeNow = () => {
    clearOpenTimer();
    setOpen(false);
  };

  useEffect(() => {
    return () => clearOpenTimer();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !bubbleRef.current) {
      return;
    }

    const viewportMargin = readCssPixelVar('--space-xs', 8);
    const triggerGap = readCssPixelVar('--space-2xs', 4);

    const applyPosition = () => {
      if (!triggerRef.current || !bubbleRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const bubbleRect = bubbleRef.current.getBoundingClientRect();
      const bubbleWidth = bubbleRect.width;
      const bubbleHeight = bubbleRect.height;
      const triggerCenterX = triggerRect.left + triggerRect.width / 2;

      const topPreferred = triggerRect.top - bubbleHeight - triggerGap;
      const canPlaceTop = topPreferred >= viewportMargin;
      const nextPlacement: TooltipPlacement = canPlaceTop ? 'top' : 'bottom';
      const topRaw = canPlaceTop ? topPreferred : triggerRect.bottom + triggerGap;
      const maxTop = Math.max(viewportMargin, window.innerHeight - bubbleHeight - viewportMargin);
      const topClamped = Math.min(Math.max(topRaw, viewportMargin), maxTop);

      const leftRaw = triggerCenterX - bubbleWidth / 2;
      const maxLeft = Math.max(viewportMargin, window.innerWidth - bubbleWidth - viewportMargin);
      const leftClamped = Math.min(Math.max(leftRaw, viewportMargin), maxLeft);

      setPosition({
        top: topClamped,
        left: leftClamped,
        placement: nextPlacement,
      });
    };

    applyPosition();
    const animationFrame = window.requestAnimationFrame(applyPosition);

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => applyPosition())
        : null;
    if (observer) {
      observer.observe(triggerRef.current);
      observer.observe(bubbleRef.current);
    }
    window.addEventListener('resize', applyPosition);
    window.addEventListener('scroll', applyPosition, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      window.removeEventListener('resize', applyPosition);
      window.removeEventListener('scroll', applyPosition, true);
    };
  }, [isOpen]);

  const child = React.cloneElement(children, {
    'aria-describedby': mergeDescribedBy(children.props['aria-describedby'], tooltipId, disabled),
  });

  return (
    <span
      ref={rootRef}
      className={['dsn-tooltip', className].filter(Boolean).join(' ')}
      onMouseEnter={openWithDelay}
      onMouseLeave={closeNow}
      onFocus={openWithDelay}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && rootRef.current?.contains(nextTarget)) {
          return;
        }
        closeNow();
      }}
    >
      <span ref={triggerRef} className="dsn-tooltip-trigger">
        {child}
      </span>
      <span
        ref={bubbleRef}
        id={tooltipId}
        role="tooltip"
        className="dsn-tooltip-bubble"
        data-placement={position?.placement ?? placement}
        hidden={!isOpen}
        style={
          position
            ? ({
                top: position.top,
                left: position.left,
              } as React.CSSProperties)
            : undefined
        }
      >
        {content}
      </span>
    </span>
  );
}

export default Tooltip;
