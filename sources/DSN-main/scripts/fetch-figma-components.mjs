#!/usr/bin/env node
/**
 * DS-Nagarro — fetch component properties from Figma REST API
 *
 * Reads every component set in the DS-Nagarro library and writes its
 * component property definitions (variants, booleans, text, instance swaps)
 * to Design Tokens/figma-components.json — the Figma side of sync:components.
 *
 * Requires: FIGMA_TOKEN environment variable (Figma personal access token)
 *
 * Usage:
 *   npm run fetch:components  (token set in .env or environment)
 *   node scripts/fetch-figma-components.mjs --out <dir>  (write somewhere other than Design Tokens/)
 *
 * Get a token at: https://www.figma.com/settings → Personal access tokens
 * Required scope: File content (read only)
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';

// Load .env if present
try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of env.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) process.env[k.trim()] = rest.join('=').trim();
  }
} catch {}
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const outIdx = process.argv.indexOf('--out');
const DIR = outIdx !== -1 ? resolve(process.argv[outIdx + 1]) : join(ROOT, 'Design Tokens');
const FILE_KEY = '9Lqv0lrj1pRM14NVs4TsSk';
// Only sets on this page are components; Icons, Logos and Templates are skipped.
const COMPONENT_PAGE = /components/i;
const BATCH = 40;

const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.error('❌ FIGMA_TOKEN environment variable is required\n');
  console.error('   Get a token at: https://www.figma.com/settings → Personal access tokens');
  console.error('   Required scope: File content (read only)\n');
  console.error('   Usage: FIGMA_TOKEN=your_token npm run fetch:components\n');
  process.exit(1);
}

async function api(path) {
  let res;
  try {
    res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}${path}`, {
      headers: { 'X-FIGMA-TOKEN': token },
    });
  } catch (err) {
    console.error(`❌ Network error: ${err.message}`);
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`❌ Figma API error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  return res.json();
}

console.log('🔄 Fetching component sets from Figma...\n');

const [{ meta }, fileMeta] = await Promise.all([api('/component_sets'), api('?depth=1')]);
if (!Array.isArray(meta?.component_sets)) {
  console.error('❌ Unexpected API response format');
  process.exit(1);
}

const sets = meta.component_sets.filter(s => COMPONENT_PAGE.test(s.containing_frame?.pageName ?? ''));
const skipped = meta.component_sets.length - sets.length;

// Figma suffixes non-variant property names with `#<id>` — strip it.
const cleanName = name => name.replace(/#[^#]*$/, '');

function normalizeProps(defs = {}) {
  const props = {};
  for (const [rawName, def] of Object.entries(defs)) {
    const entry = { type: def.type };
    if (def.type === 'VARIANT') entry.values = def.variantOptions ?? [];
    else if (def.type === 'BOOLEAN' || def.type === 'TEXT') entry.default = def.defaultValue;
    props[cleanName(rawName)] = entry;
  }
  return Object.fromEntries(Object.entries(props).sort(([a], [b]) => a.localeCompare(b)));
}

const out = {};
for (let i = 0; i < sets.length; i += BATCH) {
  const ids = sets.slice(i, i + BATCH).map(s => s.node_id).join(',');
  const { nodes } = await api(`/nodes?ids=${encodeURIComponent(ids)}&depth=1`);
  for (const [nodeId, node] of Object.entries(nodes)) {
    const doc = node?.document;
    if (!doc) continue;
    out[doc.name] = { nodeId, props: normalizeProps(doc.componentPropertyDefinitions) };
  }
}

const snapshot = {
  fileKey: FILE_KEY,
  lastModified: fileMeta.lastModified,
  sets: Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b))),
};

mkdirSync(DIR, { recursive: true });
const file = join(DIR, 'figma-components.json');
writeFileSync(file, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`✅ ${Object.keys(out).length} component sets → ${file}`);
if (skipped) console.log(`   (${skipped} sets outside the Components page skipped)`);
