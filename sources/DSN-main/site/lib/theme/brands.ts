import { decodeSettings, encodeSettings, slugify, type Brand } from './theme';

/**
 * Saved brands for the multi-brand export, kept in this browser. Stored as
 * settings query strings so old saves survive new settings. The share link
 * (?brands=…) is how a set travels between people.
 */
/** Bumped after the experimental sidebar brand picker; ignores stale `dsn-theme-brands` saves. */
export const BRANDS_KEY = 'dsn-theme-brand-set';

/** Fired on window after the saved brands or the applied site theme change in this tab. */
export const THEME_CHANGE_EVENT = 'dsn-theme-change';

export type BrandSet = { brands: Brand[]; defaultSlug: string };

export const EMPTY_BRAND_SET: BrandSet = { brands: [], defaultSlug: '' };

export function readBrands(): BrandSet {
  try {
    const raw = JSON.parse(localStorage.getItem(BRANDS_KEY) || 'null') as { brands: { name: string; slug: string; q: string }[]; defaultSlug: string } | null;
    if (!raw || !Array.isArray(raw.brands)) return EMPTY_BRAND_SET;
    const brands: Brand[] = [];
    for (const b of raw.brands) {
      if (typeof b?.name !== 'string' || typeof b.q !== 'string') continue;
      brands.push({ name: b.name, slug: slugify(b.slug || b.name, brands.map((x) => x.slug)), settings: decodeSettings(b.q) });
    }
    const defaultSlug = brands.some((b) => b.slug === raw.defaultSlug) ? raw.defaultSlug : (brands[0]?.slug ?? '');
    return { brands, defaultSlug };
  } catch {
    return EMPTY_BRAND_SET;
  }
}

export function writeBrands(set: BrandSet) {
  try {
    if (!set.brands.length) localStorage.removeItem(BRANDS_KEY);
    else
      localStorage.setItem(
        BRANDS_KEY,
        JSON.stringify({ brands: set.brands.map((b) => ({ name: b.name, slug: b.slug, q: encodeSettings(b.settings) })), defaultSlug: set.defaultSlug }),
      );
  } catch { /* storage unavailable: the set lasts for this page view only */ }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
