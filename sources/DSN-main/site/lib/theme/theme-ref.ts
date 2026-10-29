import { decodeBrands, decodeSettings, encodeSettings, presetFor, type ThemeSettings } from './theme';

/**
 * Theme references → one concrete theme. Pure, so the server (MCP, API) and
 * the canvas in the browser agree on what a link means.
 */

export interface ThemeBrand {
  name: string;
  slug: string;
  query: string;
}

export interface ResolvedTheme {
  /** Settings query of the active theme ('' = Nagarro defaults). */
  query: string;
  settings: ThemeSettings;
  /** Preset or brand name, else 'Custom'. */
  label: string;
  /** Present when the reference was a multi-brand set. */
  brands?: ThemeBrand[];
  brandsParam?: string;
  activeBrand?: string;
}

export const DEFAULT_THEME: ResolvedTheme = { query: '', settings: decodeSettings(''), label: 'Nagarro' };

const MAX_REF = 4000;

/**
 * Accepts every form a theme travels in: a settings query (`brand=b4236a&font=inter`),
 * a configurator share URL, the `Edit:` URL at the top of an exported theme.css,
 * or a `brands=` set (pick one with `brandSlug`). Returns null when nothing is recognisable.
 */
export function resolveThemeRef(ref: string | null | undefined, brandSlug?: string | null): ResolvedTheme | null {
  if (!ref || !ref.trim()) return DEFAULT_THEME;
  if (ref.length > MAX_REF) return null;
  let raw = ref.trim();
  // A pasted theme.css: take its "Edit: <url>" line.
  const edit = raw.match(/Edit:\s*(\S+)/);
  if (edit) raw = edit[1];
  let query: string;
  if (/^https?:\/\//i.test(raw)) {
    try {
      query = new URL(raw).search.slice(1);
    } catch {
      return null;
    }
  } else query = raw.replace(/^\?/, '');

  const params = new URLSearchParams(query);
  const brandsParam = params.get('brands');
  if (brandsParam) {
    const set = decodeBrands(brandsParam);
    if (!set) return null;
    const active = set.brands.find((b) => b.slug === brandSlug) ?? set.brands.find((b) => b.slug === set.defaultSlug) ?? set.brands[0];
    return {
      query: encodeSettings(active.settings),
      settings: active.settings,
      label: active.name,
      brands: set.brands.map((b) => ({ name: b.name, slug: b.slug, query: encodeSettings(b.settings) })),
      brandsParam,
      activeBrand: active.slug,
    };
  }

  const known = ['brand', 'neutral', 'feedback', 'dataviz', 'cta', 'font', 'style', 'shape', 'density'];
  if ([...params.keys()].length && ![...params.keys()].some((k) => known.includes(k))) return null;
  const settings = decodeSettings(query);
  const preset = presetFor(settings);
  return { query: encodeSettings(settings), settings, label: preset === 'custom' ? 'Custom' : preset };
}

