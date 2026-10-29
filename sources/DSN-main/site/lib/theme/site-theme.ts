import { THEME_CHANGE_EVENT } from './brands';
import { DARK_SELECTOR, LIGHT_SELECTOR, ctaExactVars, ctaLightVars, datavizVars, fontHref, themeVars, type ThemeOutput } from './theme';

/**
 * "Apply to site": the configurator's overrides, saved in this browser and
 * injected on every page. Stores the finished CSS (not the settings) so the
 * pre-paint script in layout.tsx needs no theme engine.
 */
export const SITE_THEME_KEY = 'dsn-site-theme';
const STYLE_ID = 'dsn-site-theme';
const FONT_ID = 'dsn-site-theme-font';

export type SiteTheme = { query: string; css: string; font: string | null };

/**
 * Doubled :root beats tokens.css; the light block re-points the CTA and the chart
 * series; the tripled one beats its dark block; the last sets dark chart series.
 */
export function themeStyleCss(t: ThemeOutput): string {
  const decl = (vars: Record<string, string>) => Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');
  const light = { ...ctaLightVars(t.cta), ...datavizVars(t, 'light') };
  return `:root:root{${decl(themeVars(t))}}${LIGHT_SELECTOR}:root{${decl(light)}}:root:root:root{${decl(ctaExactVars(t))}}${DARK_SELECTOR}:root{${decl(datavizVars(t, 'dark'))}}`;
}

export function readSiteTheme(): SiteTheme | null {
  try {
    const raw = localStorage.getItem(SITE_THEME_KEY);
    return raw ? (JSON.parse(raw) as SiteTheme) : null;
  } catch {
    return null;
  }
}

// While the configurator is open its live preview owns the page, so the saved
// theme is switched off (media="not all") rather than layered underneath.
let suspended = false;
const setMedia = () =>
  [STYLE_ID, FONT_ID].forEach((id) => document.getElementById(id)?.setAttribute('media', suspended ? 'not all' : 'all'));

export function suspendSiteTheme(on: boolean) {
  suspended = on;
  setMedia();
}

/** Saves (or clears, with null) the site theme and updates the live page. */
export function writeSiteTheme(theme: SiteTheme | null) {
  try {
    if (theme) localStorage.setItem(SITE_THEME_KEY, JSON.stringify(theme));
    else localStorage.removeItem(SITE_THEME_KEY);
  } catch { /* storage unavailable: applies to this page view only */ }

  document.getElementById(STYLE_ID)?.remove();
  document.getElementById(FONT_ID)?.remove();
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  if (!theme) return;
  // Prepended so a page-level preview (appended later) still wins at equal specificity.
  document.head.prepend(Object.assign(document.createElement('style'), { id: STYLE_ID, textContent: theme.css }));
  if (theme.font) document.head.prepend(Object.assign(document.createElement('link'), { id: FONT_ID, rel: 'stylesheet', href: theme.font }));
  setMedia();
}

/**
 * Copies the saved theme into another document (the same-origin Storybook iframe on
 * component pages), which the page's own <style> can't reach. Cross-origin frames are skipped.
 */
export function applySiteThemeTo(frame: HTMLIFrameElement) {
  const theme = readSiteTheme();
  let doc: Document | null = null;
  try { doc = frame.contentDocument; } catch { /* cross-origin */ }
  if (!doc?.head) return;
  doc.getElementById(STYLE_ID)?.remove();
  doc.getElementById(FONT_ID)?.remove();
  if (!theme) return;
  doc.head.append(Object.assign(doc.createElement('style'), { id: STYLE_ID, textContent: theme.css }));
  if (theme.font) doc.head.append(Object.assign(doc.createElement('link'), { id: FONT_ID, rel: 'stylesheet', href: theme.font }));
}

export const toSiteTheme = (t: ThemeOutput, query: string): SiteTheme => ({ query, css: themeStyleCss(t), font: fontHref(t) });

/** Inline in <head> so a saved theme is in place before first paint. */
// Skipped on /p/* — a shared prototype carries its own theme — except /p/templates/*,
// the stock templates framed by the gallery, which should follow the viewer's theme.
export const siteThemeScript = `try{if(/^\\/p\\/(?!templates\\/)/.test(location.pathname))throw 0;var s=JSON.parse(localStorage.getItem('${SITE_THEME_KEY}')||'null');if(s){var d=document,e=d.createElement('style');e.id='${STYLE_ID}';e.textContent=s.css;d.head.appendChild(e);if(s.font){var l=d.createElement('link');l.id='${FONT_ID}';l.rel='stylesheet';l.href=s.font;d.head.appendChild(l)}}}catch(e){}`;
