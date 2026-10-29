'use client';

import { buildTheme, decodeSettings, fontHref } from '@/lib/theme/theme';
import { themeStyleCss } from '@/lib/theme/site-theme';

/**
 * A prototype's own theme. The site's saved theme is skipped on /p/* (see
 * siteThemeScript), so every viewer of a share link sees the same brand.
 */
export function ThemeStyle({ query }: { query: string }) {
  if (!query) return null;
  const t = buildTheme(decodeSettings(query));
  const font = fontHref(t);
  return (
    <>
      {font && <link rel="stylesheet" href={font} precedence="default" />}
      <style id="dsn-prototype-theme">{themeStyleCss(t)}</style>
    </>
  );
}
