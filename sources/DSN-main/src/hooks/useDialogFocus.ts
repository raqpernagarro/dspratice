import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), iframe, video[controls], [tabindex]:not([tabindex="-1"])';

export interface UseDialogFocusOptions {
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** The dialog element — focus is trapped inside it. */
  dialogRef: RefObject<HTMLElement>;
  /** Called on Escape when `closeOnEscape` is true. */
  onEscape: () => void;
  /** @default true */
  closeOnEscape?: boolean;
  /** Element to focus on open. Falls back to the dialog itself. */
  getInitialFocus?: (dialog: HTMLElement) => HTMLElement | null;
}

/** Live regions stay outside `inert` so announcements (e.g. toasts) still reach assistive tech. */
const LIVE_REGION_SELECTOR = '[aria-live], [role="status"], [role="alert"], [role="log"]';

/** Returns the child of `document.body` that contains `element` — the dialog's portal root. */
function getPortalRoot(element: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = element;
  while (node && node.parentElement !== document.body) {
    node = node.parentElement;
  }
  return node;
}

/**
 * Modal-dialog focus contract shared by Modal, Drawer, AlertDialog and MediaViewer:
 * remembers the trigger and returns focus to it on close, locks page scroll, makes
 * the rest of the page `inert`, moves focus into the dialog on open, cycles Tab
 * inside it, and closes on Escape.
 */
export function useDialogFocus({
  isOpen,
  dialogRef,
  onEscape,
  closeOnEscape = true,
  getInitialFocus,
}: UseDialogFocusOptions) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const previousOpenRef = useRef(isOpen);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    const wasOpen = previousOpenRef.current;

    if (isOpen && !wasOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    }

    if (!isOpen && wasOpen) {
      previouslyFocusedRef.current?.focus();
    }

    previousOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Everything outside the dialog becomes inert, so screen-reader virtual cursors and
  // pointer clicks can't reach the page behind it. Only siblings that weren't already
  // inert are touched, so nested dialogs restore exactly what they changed.
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const portalRoot = getPortalRoot(dialogRef.current);
    if (!portalRoot) return;

    const madeInert = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        el !== portalRoot &&
        !el.hasAttribute('inert') &&
        !el.matches(LIVE_REGION_SELECTOR) &&
        !['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE'].includes(el.tagName),
    );
    madeInert.forEach((el) => el.setAttribute('inert', ''));

    return () => {
      madeInert.forEach((el) => el.removeAttribute('inert'));
    };
  }, [isOpen, dialogRef]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const target = getInitialFocus?.(dialogRef.current) ?? null;
    (target ?? dialogRef.current).focus();
    // Only on open — not when the initial-focus callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.closest('[inert]'));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEscape, isOpen, dialogRef]);
}
