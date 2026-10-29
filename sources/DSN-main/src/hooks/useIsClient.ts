import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False during SSR and hydration, true after. Gate `createPortal(…, document.body)`
 * on it so open overlays neither crash the server nor mismatch on hydration.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
