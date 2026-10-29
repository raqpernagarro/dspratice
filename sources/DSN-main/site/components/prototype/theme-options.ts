import { readBrands } from '@/lib/theme/brands';
import { readSiteTheme } from '@/lib/theme/site-theme';
import { encodeBrands, encodeSettings, PRESETS } from '@/lib/theme/theme';

export type ThemeOption = { value: string; label: string; description?: string; query: string };

/**
 * Themes this browser knows: the applied site theme, the saved brand set and
 * each saved brand, then the presets. Reads localStorage — call after mount.
 */
export function themeOptions({ includeBrandSet = false } = {}): ThemeOption[] {
  const out: ThemeOption[] = [];
  const site = readSiteTheme();
  if (site?.query) out.push({ value: 'site', label: 'Site theme', description: 'Applied in this browser', query: site.query });
  const set = readBrands();
  if (includeBrandSet && set.brands.length > 1) {
    out.push({ value: 'brands', label: `All saved brands (${set.brands.length})`, description: 'Multi-brand set', query: `brands=${encodeBrands(set.brands, set.defaultSlug)}` });
  }
  for (const b of set.brands) out.push({ value: `brand:${b.slug}`, label: b.name, description: 'Saved brand', query: encodeSettings(b.settings) });
  for (const p of PRESETS) out.push({ value: `preset:${p.label}`, label: p.label, description: 'Preset', query: encodeSettings(p.settings) });
  return out;
}
