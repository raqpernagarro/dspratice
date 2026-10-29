'use client';

import { useEffect, useState } from 'react';
import { describePick, PICK_MESSAGE } from './pick';
import type { Expr, KitSnapshot } from '@/lib/prototype/ir';
import { PrototypeRenderer } from './PrototypeRenderer';
import { ThemeStyle } from './ThemeStyle';

export const PREVIEW_MESSAGE = 'dsn-prototype-preview';

export interface PreviewPayload {
  root: Expr | null;
  themeQuery: string;
  kit?: KitSnapshot;
  /** Colour mode for the frame; omitted keeps the page's own. */
  mode?: 'light' | 'dark';
  /** Point mode: hovering outlines a DS-Ngr part, clicking reports it to the parent instead of acting. */
  pick?: boolean;
}

/** Renders whatever the same-origin parent posts. Lives in an iframe so 100vh means the frame. */
export function PreviewFrame() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type !== PREVIEW_MESSAGE) return;
      const mode = event.data.mode === 'dark' || event.data.mode === 'light' ? event.data.mode : undefined;
      if (mode) document.documentElement.dataset.theme = mode;
      setPayload({ root: event.data.root ?? null, themeQuery: typeof event.data.themeQuery === 'string' ? event.data.themeQuery : '', kit: event.data.kit, mode, pick: event.data.pick === true });
      setRev((r) => r + 1);
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: `${PREVIEW_MESSAGE}:ready` }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!payload) return null;
  return (
    <>
      <ThemeStyle query={payload.themeQuery} />
      {payload.pick && <Picker />}
      {payload.root && <PrototypeRenderer key={rev} root={payload.root} kit={payload.kit} />}
    </>
  );
}

/** Outlines the DS-Ngr part under the pointer; a click posts it to the parent and is swallowed. */
export function Picker() {
  const [box, setBox] = useState<{ rect: DOMRect; name: string } | null>(null);

  useEffect(() => {
    const target = (e: Event) => (e.target instanceof Element ? describePick(e.target) : null);
    const onOver = (e: PointerEvent) => {
      const hit = target(e);
      setBox(hit ? { rect: hit.el.getBoundingClientRect(), name: hit.pick.label } : null);
    };
    const onClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const hit = target(e);
      if (hit) window.parent.postMessage({ type: PICK_MESSAGE, pick: hit.pick }, window.location.origin);
    };
    // Capture phase, so the component under the pointer never sees the click.
    document.addEventListener('pointerover', onOver, true);
    document.addEventListener('click', onClick, true);
    document.documentElement.style.cursor = 'crosshair';
    return () => {
      document.removeEventListener('pointerover', onOver, true);
      document.removeEventListener('click', onClick, true);
      document.documentElement.style.cursor = '';
    };
  }, []);

  if (!box) return null;
  const { top, left, width, height } = box.rect;
  return (
    <div className="pick-outline" style={{ top, left, width, height }} aria-hidden="true">
      <span className="pick-outline-label">{box.name}</span>
    </div>
  );
}
