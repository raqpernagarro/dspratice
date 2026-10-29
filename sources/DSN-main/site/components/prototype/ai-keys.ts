import type { Provider } from '@/lib/chat/models';

/**
 * Browser-only storage for chat keys and picker choices. Keys never leave this
 * browser except in the x-ai-key header of a /api/chat request. Storage can be
 * blocked (private mode, site data off), so every access is guarded.
 */

const keyName = (provider: Provider) => `ds-ngr:ai-key:${provider}`;
const PREFS = 'ds-ngr:ai-chat';

export function readKey(provider: Provider): string | null {
  try {
    return localStorage.getItem(keyName(provider));
  } catch {
    return null;
  }
}

export function saveKey(provider: Provider, key: string): boolean {
  try {
    localStorage.setItem(keyName(provider), key);
    return true;
  } catch {
    return false;
  }
}

export function forgetKey(provider: Provider) {
  try {
    localStorage.removeItem(keyName(provider));
  } catch {
    // Nothing stored.
  }
}

export interface ChatPrefs {
  provider?: Provider;
  models?: Partial<Record<Provider, string>>;
  themeKey?: string;
}

export function readPrefs(): ChatPrefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS) ?? '{}') as ChatPrefs;
  } catch {
    return {};
  }
}

export function savePrefs(patch: ChatPrefs) {
  try {
    const prev = readPrefs();
    localStorage.setItem(PREFS, JSON.stringify({ ...prev, ...patch, models: { ...prev.models, ...patch.models } }));
  } catch {
    // Preferences are a convenience.
  }
}
