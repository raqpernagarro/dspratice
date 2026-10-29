#!/usr/bin/env node
/**
 * DS-Ngr token rename codemod — 8-tier taxonomy
 *
 * Rewrites every `--old-token` reference to its new tier name using
 * scripts/token-tier-map.mjs. Single pass, exact-name matches only
 * (`--size-space-small` never matches inside `--size-space-small-x`).
 *
 * tokens.css is handled specially: definitions of merged tokens are removed,
 * and aliases that become self-references (`--size-4: var(--size-4)`) are dropped.
 *
 * --map=grammar uses scripts/token-grammar-map.mjs (handbook vocabulary) instead of
 * the 8-tier map. Its 'remove' entries are deleted from tokens.css like merges.
 *
 * Dry run (no changes):  node scripts/codemod-token-rename.mjs --dry
 * Apply changes:         node scripts/codemod-token-rename.mjs
 * Consuming app:         node scripts/codemod-token-rename.mjs --root=/path/to/app
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { TIER_MAP } from './token-tier-map.mjs';
import { GRAMMAR_MAP, CHAINED, isApplied } from './token-grammar-map.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootArg = process.argv.find(a => a.startsWith('--root='));
const ROOT = rootArg ? rootArg.split('=')[1] : join(__dirname, '..');
const DRY = process.argv.includes('--dry');

const GRAMMAR = process.argv.includes('--map=grammar');
// Re-running the grammar map must not rename a chained name twice (see CHAINED).
const rerun = GRAMMAR && isApplied(readFileSync(join(ROOT, 'tokens.css'), 'utf8'));
const MAP = GRAMMAR ? GRAMMAR_MAP.filter(([o]) => !(rerun && CHAINED.has(o))) : TIER_MAP;
const oldToNew = new Map(MAP.filter(([, , op]) => op !== 'remove').map(([o, n]) => [o, n]));
// Definitions dropped from tokens.css: merged tokens and removed ones.
const merged = new Set(MAP.filter(([, , op]) => op === 'merge' || op === 'remove').map(([o]) => o));

// Longest first so the alternation never stops at a shorter prefix.
const alternation = [...oldToNew.keys()]
  .sort((a, b) => b.length - a.length)
  .map(n => n.replace(/[-]/g, '\\-'))
  .join('|');
const TOKEN_RE = new RegExp(`--(${alternation})(?![\\w-])`, 'g');

function applyRenames(src) {
  let count = 0;
  const out = src.replace(TOKEN_RE, (_, name) => {
    count++;
    return `--${oldToNew.get(name)}`;
  });
  return { out, count };
}

// ─── tokens.css ──────────────────────────────────────────────────────────────

function patchTokensCss(src) {
  // 1. Drop definitions of merged tokens (single- or multi-line values).
  const lines = src.split('\n');
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*--([a-zA-Z0-9-]+)\s*:/);
    if (m && merged.has(m[1])) {
      // Skip continuation lines until the declaration's semicolon.
      while (i < lines.length && !lines[i].includes(';')) i++;
      continue;
    }
    kept.push(lines[i]);
  }
  // 2. Rename.
  const { out, count } = applyRenames(kept.join('\n'));
  // 3. Drop aliases that collapsed into self-references.
  const final = out
    .split('\n')
    .filter(l => {
      const m = l.match(/^\s*--([a-zA-Z0-9-]+)\s*:\s*var\(--([a-zA-Z0-9-]+)\)\s*;/);
      return !(m && m[1] === m[2]);
    })
    .join('\n');
  return { out: final, count };
}

// ─── File walker ─────────────────────────────────────────────────────────────

const EXTENSIONS = new Set(['.css', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.mdx', '.md', '.json']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.next', 'storybook-static', '.claude', 'Design Tokens']);
const SKIP_PATHS = ['site/public/storybook']; // built Storybook copy
// Files that legitimately contain old names.
const SKIP_FILES = new Set(['token-tier-map.mjs', 'token-grammar-map.mjs', 'figma-tier-rename.json', 'codemod-token-rename.mjs', 'package-lock.json', 'CHANGELOG.md']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    if (SKIP_PATHS.some(p => join(dir, entry) === join(ROOT, p))) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (EXTENSIONS.has(extname(entry)) && !SKIP_FILES.has(entry)) files.push(full);
  }
  return files;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const files = walk(ROOT);
let totalFiles = 0;
let totalReplacements = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const isTokensCss = file === join(ROOT, 'tokens.css');
  const { out, count } = isTokensCss ? patchTokensCss(src) : applyRenames(src);
  if (out === src) continue;
  totalFiles++;
  totalReplacements += count;
  const rel = file.replace(ROOT + '/', '');
  if (DRY) console.log(`  ${rel} — ${count} replacement(s)`);
  else {
    writeFileSync(file, out, 'utf8');
    console.log(`  ✅ ${rel} — ${count} replacement(s)`);
  }
}

console.log(`\n${DRY ? '[DRY RUN] ' : ''}${totalFiles} files, ${totalReplacements} replacements`);
if (DRY) console.log('\nRun without --dry to apply.');
