#!/usr/bin/env node
/**
 * DS-Nagarro token collision audit
 *
 * Resolves every semantic/component token down to its primitive, per theme,
 * and fails when two tokens that must look different resolve to the same value.
 *
 *   1. State ladders — `*-default` / `*-hover` / `*-active` must step:
 *      hover ≠ default, active ≠ hover. A no-op hover is a broken state.
 *   2. Theme coverage — if dark overrides any member of a state ladder, it must
 *      override all of them. Otherwise the missing states leak the light value
 *      into dark mode (e.g. a red-950 surface hovering to red-100).
 *   3. Fill on surface — a fill that sits on a page surface (tags, avatars,
 *      fields, toggle tracks) must differ from every surface it can sit on.
 *
 * Intentional exceptions: add `/* collision-ok: <reason> * /` on the token line.
 *
 * Exit 0 — no collisions
 * Exit 1 — collisions found (CI fails)
 *
 * Usage:
 *   node scripts/audit-token-collisions.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

// Surfaces a component can be placed on.
const SURFACES = [
  '--color-background-neutral-primary',
  '--color-background-neutral-secondary',
  '--color-background-neutral-tertiary',
  '--color-background-elevated',
];

// Fills that sit on those surfaces and must stay visible on every one of them.
const FILLS = [
  '--color-background-neutral-soft',
  '--color-background-neutral-strong',
  '--color-background-field-default',
];

// ─── Parse tokens.css into light / dark maps ─────────────────────────────────

const DEF_RE = /^\s*(--[\w-]+)\s*:\s*([^;]+);(.*)$/;
const lines = readFileSync(join(ROOT, 'tokens.css'), 'utf8').split('\n');

const light = {};
const dark = {};
const allowed = new Set();
const stack = [];

for (const line of lines) {
  const code = line.replace(/\/\*.*?\*\//g, '');
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  if (opens) stack.push(code.trim());

  const m = line.match(DEF_RE);
  if (m && stack.length) {
    const selectors = stack.join(' ');
    // Motion-reduction overrides are not a theme.
    if (!selectors.includes('@media')) {
      const target = selectors.includes('data-theme="dark"') ? dark : light;
      target[m[1]] = m[2].trim();
      if (/collision-ok/.test(m[3])) allowed.add(m[1]);
    }
  }
  for (let i = 0; i < closes; i++) stack.pop();
}

const themes = { light, dark: { ...light, ...dark } };

function resolve(token, map) {
  let value = map[token];
  for (let hops = 0; value && hops < 20; hops++) {
    const ref = value.match(/^var\(\s*(--[\w-]+)/);
    if (!ref) return value;
    if (ref[1].startsWith('--primitive-')) return ref[1];
    value = map[ref[1]];
  }
  return value;
}

// ─── Checks ──────────────────────────────────────────────────────────────────

const errors = [];
const tokens = Object.keys(light).filter((t) => !t.startsWith('--primitive-'));

const ladders = {};
for (const t of tokens) {
  const m = t.match(/^(.*)-(default|hover|active)$/);
  if (m) (ladders[m[1]] ??= {})[m[2]] = t;
}

for (const [base, states] of Object.entries(ladders)) {
  const members = Object.values(states);

  // A member dark leaves alone is fine if it aliases a token that dark re-points.
  const overridden = members.filter((t) => t in dark);
  if (overridden.length && overridden.length < members.length) {
    const missing = members.filter(
      (t) => !(t in dark) && !allowed.has(t) && resolve(t, themes.light) === resolve(t, themes.dark),
    );
    if (missing.length) {
      errors.push(`[theme] ${base}: dark overrides ${overridden.join(', ')} but not ${missing.join(', ')} — light values leak into dark`);
    }
  }

  for (const [theme, map] of Object.entries(themes)) {
    for (const [a, b] of [['default', 'hover'], ['hover', 'active']]) {
      if (!states[a] || !states[b] || allowed.has(states[b])) continue;
      const va = resolve(states[a], map);
      if (va && va === resolve(states[b], map)) {
        errors.push(`[state] ${theme}: ${states[b]} = ${states[a]} (${va}) — ${b} is invisible`);
      }
    }
  }
}

for (const [theme, map] of Object.entries(themes)) {
  for (const fill of FILLS) {
    if (allowed.has(fill)) continue;
    const vf = resolve(fill, map);
    for (const surface of SURFACES) {
      if (vf && vf === resolve(surface, map)) {
        errors.push(`[fill] ${theme}: ${fill} = ${surface} (${vf}) — fill disappears on that surface`);
      }
    }
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────

if (errors.length) {
  console.error(`✗ ${errors.length} token collision(s):\n`);
  for (const e of errors) console.error(`  ${e}`);
  console.error('\nFix the value in Design Tokens/*.json and tokens.css, or mark an intentional one with /* collision-ok: <reason> */.');
  process.exit(1);
}
console.log('✓ No token collisions (state ladders, theme coverage, fills on surfaces).');
