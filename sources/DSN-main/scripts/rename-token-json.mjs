#!/usr/bin/env node
/**
 * DS-Ngr — apply scripts/token-grammar-map.mjs to Design Tokens/*.tokens.json
 *
 * The JSON path is the Figma variable name, so this is the code-side mirror of
 * the Figma rename. For every map entry:
 *   rename — the node moves to its new path (and file: see fileFor)
 *   merge / remove — the node is deleted
 * Then every alias (`{a.b.c}` in $value and $extensions.modes) is re-pointed.
 * Tokens that exist only in tokens.css have no JSON node and are skipped.
 *
 * Dry run:  node scripts/rename-token-json.mjs --dry
 * Apply:    node scripts/rename-token-json.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { GRAMMAR_MAP, CHAINED, isApplied } from './token-grammar-map.mjs';
import { fileForPath } from './lib/tier-tokens.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIR = join(ROOT, 'Design Tokens');
const DRY = process.argv.includes('--dry');

const files = new Map();
for (const f of readdirSync(DIR).filter(f => f.endsWith('.tokens.json'))) {
  files.set(f, JSON.parse(readFileSync(join(DIR, f), 'utf8')));
}

// cssName (no --) → { file, parent, key, node }
const nodes = new Map();
for (const [file, tree] of files) {
  (function walk(obj, path) {
    for (const [key, node] of Object.entries(obj)) {
      if (key.startsWith('$') || !node || typeof node !== 'object') continue;
      if ('$value' in node) nodes.set([...path, key].join('-'), { file, parent: obj, key, node });
      else walk(node, [...path, key]);
    }
  })(tree, []);
}

// Re-running must not rename a chained name twice (see CHAINED in the map).
const rerun = isApplied(readFileSync(join(ROOT, 'tokens.css'), 'utf8'));
const byOld = new Map(GRAMMAR_MAP
  .filter(([from]) => !(rerun && CHAINED.has(from)))
  .map(([from, toCss, op, toPath]) => [from, { toCss, op, toPath }]));
const stats = { renamed: 0, deleted: 0, aliases: 0, skipped: 0 };

// 1. Detach every mapped node first, so renames into a vacated path never collide.
const moves = [];
for (const [from, { op, toPath }] of byOld) {
  const hit = nodes.get(from);
  if (!hit) { stats.skipped++; continue; }
  delete hit.parent[hit.key];
  if (op === 'merge' || op === 'remove') { stats.deleted++; continue; }
  moves.push({ toPath, node: hit.node });
}

// 2. Re-attach at the new path.
for (const { toPath, node } of moves) {
  const file = fileForPath(toPath);
  if (!files.has(file)) files.set(file, {});
  let obj = files.get(file);
  const parts = toPath.split('/');
  for (const p of parts.slice(0, -1)) {
    if (obj[p] && '$value' in obj[p]) throw new Error(`${toPath}: ${p} is a token, not a group`);
    obj = obj[p] ??= {};
  }
  if (obj[parts.at(-1)]) throw new Error(`${toPath} already exists`);
  obj[parts.at(-1)] = node;
  stats.renamed++;
}

// 3. Re-point aliases: {a.b.c} → the new dotted path.
const repoint = str => str.replace(/\{([^}]+)\}/g, (whole, dotted) => {
  const entry = byOld.get(dotted.split('.').join('-'));
  if (!entry) return whole;
  if (entry.op === 'remove') throw new Error(`Alias to removed token ${dotted}`);
  stats.aliases++;
  return `{${entry.toPath.split('/').join('.')}}`;
});
// Only $value and $extensions.modes.* hold aliases — never touch $description.
for (const tree of files.values()) {
  (function walk(obj, inModes) {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string' && (key === '$value' || inModes)) obj[key] = repoint(val);
      else if (val && typeof val === 'object') walk(val, inModes || key === 'modes');
    }
  })(tree, false);
}

// 4. Drop groups that the moves left empty.
const prune = obj => {
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$') || !val || typeof val !== 'object' || '$value' in val) continue;
    prune(val);
    if (Object.keys(val).filter(k => !k.startsWith('$')).length === 0) delete obj[key];
  }
};
for (const tree of files.values()) prune(tree);

console.log(`${DRY ? '[DRY RUN] ' : ''}${stats.renamed} moved, ${stats.deleted} deleted, ${stats.aliases} aliases re-pointed, ${stats.skipped} CSS-only (no JSON node)`);
if (!DRY) {
  for (const [file, tree] of files) {
    const path = join(DIR, file);
    if (!existsSync(path) && Object.keys(tree).length === 0) continue;
    writeFileSync(path, JSON.stringify(tree, null, 2) + '\n');
    console.log(`  ✅ Design Tokens/${file}`);
  }
}
