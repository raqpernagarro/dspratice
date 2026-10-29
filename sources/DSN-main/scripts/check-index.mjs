#!/usr/bin/env node
/**
 * DS-Nagarro ds-index.json staleness check
 *
 * Regenerates the index in memory and compares it to the committed file.
 * Volatile meta fields (generated timestamp, git commit) are ignored.
 *
 * Exit 0 — committed ds-index.json matches the generator output
 * Exit 1 — stale or missing ds-index.json
 *
 * Usage:
 *   node scripts/check-index.mjs
 *   npm run check:index
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildDsIndex } from './generate-index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INDEX_PATH = join(ROOT, 'ds-index.json');

function normalizeForCompare(index) {
  const copy = structuredClone(index);
  delete copy.meta.generated;
  delete copy.meta.gitCommit;
  return copy;
}

function main() {
  if (!existsSync(INDEX_PATH)) {
    console.error('❌ ds-index.json is missing. Run: npm run index:generate');
    process.exit(1);
  }

  let committed;
  try {
    committed = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
  } catch (error) {
    console.error('❌ ds-index.json is not valid JSON:', error.message);
    process.exit(1);
  }

  const fresh = buildDsIndex();
  const committedNorm = JSON.stringify(normalizeForCompare(committed), null, 2);
  const freshNorm = JSON.stringify(normalizeForCompare(fresh), null, 2);

  if (committedNorm === freshNorm) {
    console.log('✅ ds-index.json is up to date');
    console.log(`   ${fresh.meta.publicComponentCount} public components (source: ${fresh.meta.publicApiSource})`);
    process.exit(0);
  }

  const committedKeys = new Set(Object.keys(committed.components ?? {}));
  const freshKeys = new Set(Object.keys(fresh.components));
  const removed = [...committedKeys].filter(k => !freshKeys.has(k)).sort();
  const added = [...freshKeys].filter(k => !committedKeys.has(k)).sort();

  console.error('❌ ds-index.json is stale. Run: npm run index:generate\n');
  if (removed.length > 0) {
    console.error(`  Removed (${removed.length}): ${removed.join(', ')}`);
  }
  if (added.length > 0) {
    console.error(`  Added (${added.length}): ${added.join(', ')}`);
  }
  process.exit(1);
}

main();
