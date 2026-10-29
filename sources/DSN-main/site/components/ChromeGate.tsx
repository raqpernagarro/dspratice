'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Hides site chrome on full-screen routes: the prototype canvas, and the AI workspaces (prototype, create and customize component), which have their own top bar. */
export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const workspace = pathname === '/prototype/chat' || pathname === '/components/new' || /^\/components\/[^/]+\/customize$/.test(pathname ?? '');
  return pathname?.startsWith('/p/') || workspace ? null : children;
}
