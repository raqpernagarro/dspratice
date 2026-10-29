'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Expr, KitSnapshot } from '@/lib/prototype/ir';
import { resolveThemeRef } from '@/lib/theme/theme-ref';
import { Picker } from './PreviewFrame';
import { PrototypeRenderer } from './PrototypeRenderer';
import { ThemeStyle } from './ThemeStyle';

const POLL_MS = 1500;

/** The chat that embeds this page sets its colour mode, theme and point mode; the page asks for them once it's up. */
export const CANVAS_CONTROLS = 'dsn-prototype-canvas:controls';
export interface CanvasControls { mode: 'light' | 'dark'; pick: boolean; themeQuery?: string }

interface CanvasState {
  root: Expr;
  version: number;
  themeQuery: string;
  brandsParam?: string;
  kit?: KitSnapshot;
}

/** The saved theme, unless the URL asks for another theme or brand. */
function activeThemeQuery(state: CanvasState, override: { theme?: string; brand?: string }): string {
  if (override.theme !== undefined) return resolveThemeRef(override.theme, override.brand)?.query ?? state.themeQuery;
  if (override.brand && state.brandsParam) return resolveThemeRef(`brands=${state.brandsParam}`, override.brand)?.query ?? state.themeQuery;
  return state.themeQuery;
}

/**
 * Hosts a saved prototype. With `?live`, polls for new versions so the canvas
 * follows an agent's edits — source, theme and kit — without a reload.
 */
export function PrototypeCanvas({ id, initial, override }: { id: string; initial: CanvasState; override: { theme?: string; brand?: string } }) {
  const live = useSearchParams().has('live');
  const [state, setState] = useState(initial);
  const [picking, setPicking] = useState(false);
  // The embedding chat's theme picker previews another theme without saving it.
  const [chatTheme, setChatTheme] = useState<string>();

  useEffect(() => {
    if (window.parent === window) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type !== CANVAS_CONTROLS) return;
      if (event.data.mode === 'dark' || event.data.mode === 'light') document.documentElement.dataset.theme = event.data.mode;
      setPicking(event.data.pick === true);
      if (typeof event.data.themeQuery === 'string') setChatTheme(event.data.themeQuery);
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: `${CANVAS_CONTROLS}:ready` }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!live) return;
    let stopped = false;
    let version = initial.version;
    let kitVersion = initial.kit?.version ?? 0;
    const tick = async () => {
      try {
        const res = await fetch(`/api/prototypes/${id}?since=${version}&kitSince=${kitVersion}`, { cache: 'no-store' });
        const data = await res.json();
        if (!stopped && data.changed) {
          version = data.version;
          kitVersion = data.kitVersion ?? 0;
          setState({ root: data.root, version: data.version, themeQuery: data.themeQuery ?? '', brandsParam: data.brandsParam, kit: data.kit });
        }
      } catch {
        // Offline or server restarting — try again next tick.
      }
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    };
    let timer = setTimeout(tick, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id, live, initial.version, initial.kit?.version]);

  return (
    <>
      <ThemeStyle query={chatTheme ?? activeThemeQuery(state, override)} />
      {picking && <Picker />}
      <PrototypeRenderer key={`${state.version}.${state.kit?.version ?? 0}`} root={state.root} kit={state.kit} />
    </>
  );
}
