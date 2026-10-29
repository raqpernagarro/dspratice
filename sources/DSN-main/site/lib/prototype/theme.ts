import 'server-only';
import { getTokenDeclarations } from '@/lib/ds-knowledge';
import {
  buildTheme, contrastChecks, ctaExactVars, ctaLightVars, datavizVars, FONTS, fontHref, previewScales, themeVars, type ThemeSettings,
} from '@/lib/theme/theme';
import { themeStyleCss } from '@/lib/theme/site-theme';

/**
 * Configurator themes on the server. A theme is the configurator's settings
 * query; the same engine that writes theme.css resolves it here, so the MCP,
 * the API and the canvas all see exactly what the Brands tab produced.
 */

export { DEFAULT_THEME, resolveThemeRef, type ResolvedTheme, type ThemeBrand } from '@/lib/theme/theme-ref';
import type { ResolvedTheme } from '@/lib/theme/theme-ref';

/** The finished CSS + font link for a theme, as the site's "Apply to site" injects it. */
export function themeAssets(theme: ResolvedTheme): { css: string; font: string | null } {
  if (!theme.query) return { css: '', font: null };
  const t = buildTheme(theme.settings);
  return { css: themeStyleCss(t), font: fontHref(t) };
}

// ─── Token resolution ────────────────────────────────────────────────────────

type Mode = 'light' | 'dark';

function modeOverrides(settings: ThemeSettings, mode: Mode): Map<string, string> {
  const t = buildTheme(settings);
  return new Map(Object.entries({
    ...themeVars(t),
    ...(mode === 'light' ? ctaLightVars(t.cta) : {}),
    ...datavizVars(t, mode),
    ...ctaExactVars(t),
  }));
}

function resolver(decls: Map<string, string>) {
  const cache = new Map<string, string>();
  const resolve = (name: string, seen: Set<string> = new Set()): string | undefined => {
    if (cache.has(name)) return cache.get(name);
    const raw = decls.get(name);
    if (raw === undefined || seen.has(name)) return undefined;
    seen.add(name);
    const out = raw.replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^()]*))?\)/gi, (m, ref: string, fallback?: string) => resolve(ref, seen) ?? fallback?.trim() ?? m);
    seen.delete(name);
    cache.set(name, out);
    return out;
  };
  return resolve;
}

export interface ResolvedToken {
  name: string;
  light: string;
  dark: string;
  /** What the token points at in light mode, when it is an alias. */
  ref?: string;
}

/** Semantic + component tokens with their final values for this theme, in both modes. */
export function resolveTokens(theme: ResolvedTheme, filter?: string): ResolvedToken[] {
  const base = getTokenDeclarations();
  const light = new Map([...base.light, ...modeOverrides(theme.settings, 'light')]);
  const dark = new Map([...base.dark, ...modeOverrides(theme.settings, 'dark')]);
  const rl = resolver(light);
  const rd = resolver(dark);
  const needle = filter?.replace(/^--/, '').toLowerCase();
  const out: ResolvedToken[] = [];
  for (const name of base.light.keys()) {
    if (name.startsWith('--primitive-')) continue; // primitives: never used directly
    if (needle && !name.slice(2).toLowerCase().includes(needle)) continue;
    const alias = base.light.get(name)!.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i)?.[1];
    out.push({ name, light: rl(name) ?? '', dark: rd(name) ?? '', ...(alias && { ref: alias }) });
  }
  return out;
}

// ─── Description for agents ──────────────────────────────────────────────────

export function describeTheme(theme: ResolvedTheme) {
  const t = buildTheme(theme.settings);
  const scales = previewScales(t);
  const font = FONTS.find((f) => f.id === theme.settings.font) ?? FONTS[0];
  const pick = (names: string[]) => Object.fromEntries(resolveTokens(theme).filter((x) => names.includes(x.name)).map((x) => [x.name, { light: x.light, dark: x.dark }]));
  const failing = contrastChecks(t).filter((c) => c.ratio < 4.5).map((c) => ({ pair: c.label, ratio: Math.round(c.ratio * 100) / 100 }));
  return {
    name: theme.label,
    query: theme.query,
    isDefault: !theme.query,
    settings: theme.settings,
    font: { label: font.label, note: font.note },
    accentScale: scales.accent,
    neutralScale: scales.neutral,
    keyColors: pick([
      '--color-background-neutral-primary', '--color-background-neutral-primary', '--color-foreground-neutral-primary', '--color-foreground-neutral-secondary',
      '--color-foreground-accent-strong', '--button-background-primary-default', '--button-foreground-primary',
      '--color-border-neutral-primary',
    ]),
    contrastBelowAA: failing,
    ...(theme.brands && { brands: theme.brands.map(({ name, slug }) => ({ name, slug })), activeBrand: theme.activeBrand }),
    note: 'Themes only re-value existing tokens. Keep using semantic tokens (var(--color-…), var(--space-…)); never hardcode these values.',
  };
}
