'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * Scrollable left docs menu. Each page renders its own menu, so the scroll
 * position is kept in sessionStorage (per menu label) and restored on mount —
 * picking an item no longer jumps the menu back to the top.
 */
export function SideNav({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const key = `side-nav-scroll:${label}`;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) el.scrollTop = Number(saved);
    } catch {}
    // Keep the active item visible if it ended up outside the restored view.
    // Done by hand: scrollIntoView would also scroll the page.
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) {
      const box = el.getBoundingClientRect();
      const item = active.getBoundingClientRect();
      if (item.top < box.top) el.scrollTop += item.top - box.top;
      else if (item.bottom > box.bottom) el.scrollTop += item.bottom - box.bottom;
    }
  }, [key]);

  const save = () => {
    try {
      sessionStorage.setItem(key, String(ref.current?.scrollTop ?? 0));
    } catch {}
  };

  return (
    <nav ref={ref} aria-label={label} className="side-nav" onScroll={save} onClickCapture={save}>
      {children}
    </nav>
  );
}
