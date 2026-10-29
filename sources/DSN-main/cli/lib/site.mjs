import { readFileSync } from 'node:fs';

/**
 * The DS-Ngr docs site this CLI talks to. `--site` wins, then DS_NGR_SITE,
 * then the origin baked in when the site packed this CLI
 * (scripts/build-cli-assets.mjs writes lib/config.json).
 */
export function siteOrigin(flag) {
  const baked = (() => {
    try {
      return JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8')).site;
    } catch {
      return '';
    }
  })();
  const origin = (flag || process.env.DS_NGR_SITE || baked || '').replace(/\/+$/, '');
  if (!origin) {
    throw new UsageError('No DS-Ngr site configured. Pass --site https://<docs site> or set DS_NGR_SITE.');
  }
  return origin;
}

/**
 * Accepts a configurator share link (`https://…/customize?accent=…`) or a bare
 * query (`accent=…`) and returns the query string without a leading `?`.
 */
export function themeQuery(input) {
  if (!input) return '';
  const q = input.includes('?') ? input.slice(input.indexOf('?') + 1) : input;
  return q.replace(/^\?/, '');
}

/** An error the user can fix; printed without a stack trace. */
export class UsageError extends Error {}
