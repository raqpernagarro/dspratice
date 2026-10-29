/**
 * Shared loader for the token JSON in Design Tokens/.
 *
 * One file per tier (color, font, space, size, shape, effect, motion, z-index),
 * plus primitive.tokens.json (Layer 1) and component.tokens.json (Layer 3).
 * The JSON path IS the CSS name: button.background.primary.default
 *   → --button-background-primary-default (any depth; segments join with `-`)
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export const TIER_FILES = ['color', 'font', 'space', 'size', 'shape', 'effect', 'motion', 'z-index'];

/**
 * Which file a Figma path / JSON path lives in, by its first segment:
 * a tier → <tier>.tokens.json, `primitive` → primitive.tokens.json,
 * anything else is a component token → component.tokens.json.
 */
export function fileForPath(path) {
  const first = path.split('/')[0];
  if (TIER_FILES.includes(first)) return `${first}.tokens.json`;
  if (first === 'primitive') return 'primitive.tokens.json';
  return 'component.tokens.json';
}

export function pathToCSS(parts) {
  return '--' + parts.join('-');
}

/** Map of `--css-name` → { file, path, value, darkAlias, rawValue } */
export function loadTierJSON(dir) {
  const all = new Map();
  const files = readdirSync(dir).filter(f => f.endsWith('.tokens.json'));
  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    (function walk(obj, path) {
      for (const [key, node] of Object.entries(obj)) {
        if (key.startsWith('$') || !node || typeof node !== 'object') continue;
        const parts = [...path, key];
        if (!('$value' in node)) { walk(node, parts); continue; }
        const rawValue = node.$value;
        const value = typeof rawValue === 'object' && rawValue !== null
          ? rawValue.hex ?? null
          : typeof rawValue === 'string' || typeof rawValue === 'number' ? rawValue : null;
        const darkAlias = node.$extensions?.modes?.dark ?? null;
        const cssName = pathToCSS(parts);
        if (!all.has(cssName)) all.set(cssName, { file, path: parts.join('/'), value, darkAlias, rawValue });
      }
    })(raw, []);
  }
  return all;
}

/** `{primitive.neutral.900}` → `var(--primitive-neutral-900)`; null if not an alias. */
export function aliasToVar(alias) {
  const m = typeof alias === 'string' && alias.match(/^\{(.+)\}$/);
  return m ? `var(--${m[1].replace(/\./g, '-')})` : null;
}
