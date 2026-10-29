#!/usr/bin/env node
/**
 * DS-Nagarro token sync
 *
 * Compares Design Tokens/*.json (Figma exports) against tokens.css.
 * Detects four types of drift:
 *   1. New tokens in Figma not yet in tokens.css
 *   2. Tokens removed from Figma still in tokens.css
 *   3. Primitive hex value changes
 *   4. Semantic alias target changes (light and dark mode separately)
 *
 * Reads the 8-tier JSON (one file per tier) via scripts/lib/tier-tokens.mjs.
 *
 * No hardcoded allowlists. Exceptions are declared in tokens.css itself
 * using inline /* css-only * / comments, or inferred automatically from
 * known structural patterns.
 *
 * Exit 0 — no drift
 * Exit 1 — drift found
 *
 * Usage:
 *   node scripts/sync-tokens.mjs
 *   node scripts/sync-tokens.mjs --verbose
 *   node scripts/sync-tokens.mjs --dir <dir>  (compare JSON from another folder)
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadTierJSON, aliasToVar as tierAliasToVar } from './lib/tier-tokens.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const VERBOSE = process.argv.includes('--verbose');
// --dir <dir> reads Figma JSON from somewhere else (e.g. a scratch fetch)
const dirIdx = process.argv.indexOf('--dir');
const DIR = dirIdx !== -1 ? resolve(process.argv[dirIdx + 1]) : join(ROOT, 'Design Tokens');

// ─── CSS loader ───────────────────────────────────────────────────────────────

/**
 * Load tokens.css and return:
 *   root     — :root block (light mode + shared)
 *   dark     — [data-theme="dark"] block
 *   all      — all tokens (for presence checks)
 *   cssOnly  — tokens tagged with  css-only  inline comment
 *   lightOnly — tokens declared under [data-theme="light"] but never for :root.
 *               These are unresolved when a consumer omits data-theme on <html>
 *               (e.g. charts paint black), so light blocks must be written as
 *               `:root, [data-theme="light"] { … }`.
 */
function loadCSSTokens() {
  const src = readFileSync(join(ROOT, 'tokens.css'), 'utf8');
  const lines = src.split('\n');

  const root    = new Map();
  const dark    = new Map();
  const all     = new Map();
  const cssOnly = new Set();
  const light   = new Set();

  let block = 'root';

  for (const line of lines) {
    if (/^\s*\[data-theme="dark"\]/.test(line))  { block = 'dark';  continue; }
    // `:root, [data-theme="light"]` — light is the default, so it counts as root.
    if (/^\s*:root\s*,\s*\[data-theme="light"\]/.test(line)) { block = 'root'; continue; }
    if (/^\s*\[data-theme="light"\]/.test(line)) { block = 'light'; continue; }
    if (/^\s*\}/.test(line)) {
      if (block !== 'root') block = 'root';
      continue;
    }

    const m = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?);/);
    if (!m) continue;
    const [, name, value] = m;
    const v = value.trim();

    all.set(name, v);
    if (block === 'root') root.set(name, v);
    else if (block === 'dark') dark.set(name, v);
    else if (block === 'light') light.add(name);

    // Mark as css-only if inline comment present
    if (/\/\*\s*css-only\b/.test(line)) cssOnly.add(name);
  }

  const lightOnly = [...light].filter(name => !root.has(name));

  return { root, dark, all, cssOnly, lightOnly };
}

// ─── JSON loader ──────────────────────────────────────────────────────────────
// One file per tier; the JSON path is the CSS name (see scripts/lib/tier-tokens.mjs).

const loadJSONTokens = () => loadTierJSON(DIR);
const isPrimitive = name => name.startsWith('--primitive-');

// ─── Auto-skip rules (structural, no human maintenance) ───────────────────────

/**
 * Returns true for JSON tokens that are structurally expected to be absent
 * from tokens.css.
 *
 * Type-scale primitives (--primitive-font-size-*) — Figma stores raw px values;
 * CSS uses rem directly on the semantic --font-size-* tokens.
 */
function isAutoSkipped(cssName) {
  return /^--primitive-font-size-/.test(cssName);
}

// ─── Alias conversion ─────────────────────────────────────────────────────────

function aliasToVar(alias) {
  // Font-size scale and motion: CSS stores resolved values (rem, ms), not aliases.
  if (typeof alias === 'string' && /^\{(primitive\.font-size\.|motion\.)/.test(alias)) return null;
  return tierAliasToVar(alias);
}

function normaliseVar(v) {
  return v?.replace(/\s+/g, '').toLowerCase() ?? '';
}

function resolveToHex(value, cssAll, depth = 0) {
  if (depth > 10 || !value) return null;
  const v = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v.toLowerCase();
  if (v.startsWith('rgba(') || v.startsWith('rgb(')) return v.toLowerCase();
  const m = v.match(/^var\((--[\w-]+)\)$/);
  if (m) {
    const next = cssAll.get(m[1]);
    if (next) return resolveToHex(next, cssAll, depth + 1);
  }
  return null;
}

// ─── Intentional alias divergence ────────────────────────────────────────────
//
// Tokens whose alias targets intentionally differ between Figma JSON and tokens.css.
// Keep this list SHORT. Each entry must have a comment explaining why and
// when it can be removed.
//
// Do NOT add tokens here just to silence noise — fix the drift instead.

const ALIAS_EXCEPTIONS = new Set([
  // CSS uses raw px, Figma uses scale refs — same resolved value, different path
  '--effect-blur-sm',
  '--primitive-size-1',
  '--primitive-size-1',

  // CSS uses --shape-radius-control-md, Figma uses --shape-radius-md — same value
  '--tag-radius',

  // Merged in the 8-tier migration — CSS keeps the semantic alias, Figma the scale step (same value)
  '--tag-height',     // var(--size-control-height-sm) = {size.24}
  '--size-border-sm', // 1px = {size.1}

  // Figma renamed CTA aliases to primary/secondary.
  // Components still use old names. Remove when component migration is done.
  '--button-background-secondary-default',
  '--button-background-secondary-hover',
  '--button-background-secondary-active',
  '--button-background-primary-default',
  '--button-background-primary-hover',
  '--button-background-primary-active',
  '--color-foreground-interactive-secondary-hover',
  '--color-foreground-interactive-secondary-active',
  '--color-foreground-interactive-secondary-default',
  '--color-border-interactive-primary-selected',
  '--color-foreground-accent-strong',
  '--color-background-neutral-secondary',
]);

// ─── Checks ───────────────────────────────────────────────────────────────────

function checkPrimitiveValues(cssAll, jsonTokens) {
  const changed = [];
  for (const [cssName, meta] of jsonTokens) {
    if (!isPrimitive(cssName)) continue;
    if (!meta.value || typeof meta.value !== 'string') continue;
    if (/--primitive-alpha-/.test(cssName)) continue;
    const cssValue = cssAll.get(cssName);
    if (!cssValue) continue;
    if (cssValue.startsWith('var(')) continue;
    if (cssValue.toLowerCase().trim() !== meta.value.toLowerCase().trim()) {
      changed.push({ cssName, jsonValue: meta.value, cssValue, file: meta.file });
    }
  }
  return changed;
}

function checkSemanticAliases(cssRoot, cssDark, cssAll, jsonTokens) {
  const changed = [];

  for (const [cssName, meta] of jsonTokens) {
    if (isPrimitive(cssName)) continue;
    if (ALIAS_EXCEPTIONS.has(cssName)) continue;

    const lightAlias = meta.value;
    if (typeof lightAlias === 'string') {
      const actual = cssRoot.get(cssName);
      if (actual) {
        if (lightAlias.startsWith('{')) {
          const expected = aliasToVar(lightAlias);
          if (expected !== null && normaliseVar(actual) !== normaliseVar(expected)) {
            changed.push({ cssName, mode: 'light', jsonAlias: lightAlias, expected, actual, file: meta.file });
          }
        } else if (/^#[0-9a-fA-F]{3,8}$/i.test(lightAlias)) {
          const resolvedActual = resolveToHex(actual, cssAll);
          if (resolvedActual && !resolvedActual.startsWith('rgba(') && resolvedActual !== lightAlias.toLowerCase()) {
            changed.push({ cssName, mode: 'light', jsonAlias: lightAlias, expected: lightAlias, actual, file: meta.file });
          }
        }
      }
    }

    const darkAlias = meta.darkAlias;
    if (typeof darkAlias === 'string' && darkAlias.startsWith('{')) {
      const expected = aliasToVar(darkAlias);
      if (expected !== null) {
        const actual = cssDark.get(cssName);
        if (actual && normaliseVar(actual) !== normaliseVar(expected)) {
          changed.push({ cssName, mode: 'dark', jsonAlias: darkAlias, expected, actual, file: meta.file });
        }
      }
    }
  }

  return changed;
}

// ─── Detect export format ─────────────────────────────────────────────────────

function detectFormat() {
  return existsSync(join(DIR, 'color.tokens.json')) ? 'tier' : 'unknown';
}

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log('🔍 DS-Nagarro token sync check\n');
console.log(`   Run on: ${new Date().toISOString()}`);

const format = detectFormat();
console.log(`   Format: ${format === 'tier' ? '8-tier JSON (color, font, space, size, shape, effect, motion, z-index)' : '⚠️  unknown'}\n`);

if (format === 'unknown') {
  console.error(`❌ No color token files found in ${DIR}\n`);
  process.exit(1);
}

const { root: cssRoot, dark: cssDark, all: cssAll, cssOnly, lightOnly } = loadCSSTokens();
const jsonTokens = loadJSONTokens();

// 1. New tokens — in Figma JSON, not in tokens.css
const missingFromCSS = [];
for (const [cssName, meta] of jsonTokens) {
  if (cssAll.has(cssName))          continue; // present — ok
  if (isAutoSkipped(cssName))       continue; // structural skip
  missingFromCSS.push({ cssName, ...meta });
}

// 2. Removed tokens — in tokens.css, not in Figma JSON
//    css-only tokens are legitimately absent from JSON — skip them
const missingFromJSON = [];
for (const cssName of cssAll.keys()) {
  if (jsonTokens.has(cssName)) continue; // present — ok
  if (cssOnly.has(cssName))    continue; // intentionally css-only
  missingFromJSON.push(cssName);
}

// 3. Primitive value changes
const valueChanges = checkPrimitiveValues(cssAll, jsonTokens);

// 4. Semantic alias changes
const aliasChanges = checkSemanticAliases(cssRoot, cssDark, cssAll, jsonTokens);

const totalIssues = missingFromCSS.length + missingFromJSON.length + valueChanges.length + aliasChanges.length + lightOnly.length;

if (totalIssues === 0) {
  console.log('✅ tokens.css is in sync with Figma\n');
  console.log(`   ${cssAll.size} tokens checked, ${cssOnly.size} css-only tokens skipped\n`);
  process.exit(0);
}

console.log(`❌ ${totalIssues} drift issue${totalIssues === 1 ? '' : 's'} found\n`);
console.log('─'.repeat(60));

if (missingFromCSS.length > 0) {
  console.log(`\n🆕 NEW — ${missingFromCSS.length} token${missingFromCSS.length === 1 ? '' : 's'} in Figma, not yet in tokens.css:\n`);
  const byFile = {};
  for (const t of missingFromCSS) {
    if (!byFile[t.file]) byFile[t.file] = [];
    byFile[t.file].push(t);
  }
  for (const [file, tokens] of Object.entries(byFile)) {
    console.log(`  ${file}`);
    for (const t of tokens) {
      console.log(`    ${t.cssName}`);
      if (VERBOSE) console.log(`      ↳ Figma path: ${t.path}`);
    }
  }
  console.log('\n  → Add to tokens.css, or add /* css-only */ to suppress if already exists under a different name.');
}

if (valueChanges.length > 0) {
  console.log(`\n✏️  CHANGED — ${valueChanges.length} primitive value${valueChanges.length === 1 ? '' : 's'} updated in Figma:\n`);
  for (const t of valueChanges) {
    console.log(`  ${t.cssName}`);
    console.log(`    was: ${t.cssValue}`);
    console.log(`    now: ${t.jsonValue}`);
  }
  console.log('\n  → Run: npm run apply:tokens');
}

if (aliasChanges.length > 0) {
  const light = aliasChanges.filter(t => t.mode === 'light');
  const dark  = aliasChanges.filter(t => t.mode === 'dark');

  if (light.length > 0) {
    console.log(`\n🔀 ALIAS CHANGED (light) — ${light.length} token${light.length === 1 ? '' : 's'}:\n`);
    for (const t of light) {
      console.log(`  ${t.cssName}`);
      console.log(`    was: ${t.actual}`);
      console.log(`    now: ${t.expected}  ← Figma: ${t.jsonAlias}`);
    }
  }
  if (dark.length > 0) {
    console.log(`\n🔀 ALIAS CHANGED (dark) — ${dark.length} token${dark.length === 1 ? '' : 's'}:\n`);
    for (const t of dark) {
      console.log(`  ${t.cssName}`);
      console.log(`    was: ${t.actual}`);
      console.log(`    now: ${t.expected}  ← Figma: ${t.jsonAlias}`);
    }
  }
}

if (lightOnly.length > 0) {
  console.log(`\n🌓 LIGHT-ONLY — ${lightOnly.length} token${lightOnly.length === 1 ? '' : 's'} declared under [data-theme="light"] with no :root default:\n`);
  for (const t of lightOnly) console.log(`  ${t}`);
  console.log('\n  → Use `:root, [data-theme="light"] { … }` so the token resolves when <html> has no data-theme.');
}

if (missingFromJSON.length > 0) {
  console.log(`\n🗑️  REMOVED — ${missingFromJSON.length} token${missingFromJSON.length === 1 ? '' : 's'} no longer in Figma JSON:\n`);
  for (const t of missingFromJSON) console.log(`  ${t}`);
  console.log('\n  → Check usage before deleting. Add /* css-only */ if intentionally CSS-only.');
}

console.log('\n' + '─'.repeat(60) + '\n');

process.exit(1);
