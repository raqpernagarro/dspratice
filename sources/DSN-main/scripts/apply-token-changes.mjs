#!/usr/bin/env node
/**
 * DS-Nagarro — apply primitive token value changes
 *
 * Reads primitive values from Design Tokens/*.json and patches
 * any changed hex values directly in tokens.css.
 *
 * ONLY patches primitive tokens (--primitive-*) with raw values.
 * Never touches semantic tokens, aliases, or composite tokens.
 *
 * Usage:
 *   node scripts/apply-token-changes.mjs          — dry run
 *   node scripts/apply-token-changes.mjs --apply  — applies changes
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { loadTierJSON } from './lib/tier-tokens.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DIR = join(ROOT, 'Design Tokens');

// Primitive layer: --primitive-* (hex colors and the raw size scale).
const isPrimitive = name => name.startsWith('--primitive-');

function loadJSONPrimitives() {
  const tokens = new Map();
  for (const [cssName, { value }] of loadTierJSON(DIR)) if (isPrimitive(cssName)) tokens.set(cssName, value);
  return tokens;
}

const tokenPath = join(ROOT, 'tokens.css');
const cssContent = readFileSync(tokenPath, 'utf8');
const jsonPrimitives = loadJSONPrimitives();

const changes = [];
let patchedContent = cssContent;

for (const [cssName, jsonValue] of jsonPrimitives) {
  if (!jsonValue || typeof jsonValue !== 'string') continue;
  if (/--primitive-alpha-/.test(cssName)) continue;

  const regex = new RegExp(`(${cssName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\s*:\\s*)([^;]+)(;)`, 'g');
  const match = regex.exec(cssContent);
  if (!match) continue;

  const cssValue = match[2].trim();
  if (cssValue.toLowerCase() === jsonValue.toLowerCase()) continue;
  if (cssValue.startsWith('var(')) continue;

  changes.push({ cssName, was: cssValue, now: jsonValue });

  if (APPLY) {
    patchedContent = patchedContent.replace(
      new RegExp(`(${cssName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\s*:\\s*)([^;]+)(;)`),
      `$1${jsonValue}$3`
    );
  }
}

if (changes.length === 0) {
  console.log('✅ No primitive value changes to apply\n');
  process.exit(0);
}

if (!APPLY) {
  console.log(`🔍 Dry run — ${changes.length} primitive value${changes.length === 1 ? '' : 's'} would be updated:\n`);
  for (const c of changes) {
    console.log(`  ${c.cssName}`);
    console.log(`    ${c.was} → ${c.now}`);
  }
  console.log(`\nRun with --apply to patch tokens.css\n`);
  process.exit(0);
}

writeFileSync(tokenPath, patchedContent, 'utf8');
console.log(`✅ Applied ${changes.length} primitive value update${changes.length === 1 ? '' : 's'} to tokens.css:\n`);
for (const c of changes) console.log(`  ${c.cssName}: ${c.was} → ${c.now}`);
console.log('\nRun npm run audit:tokens to verify\n');
