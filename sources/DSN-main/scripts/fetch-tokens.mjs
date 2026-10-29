#!/usr/bin/env node
/**
 * DS-Nagarro — fetch tokens from Figma REST API
 *
 * Calls the Figma Variables REST API, converts to DTCG JSON format,
 * and writes to Design Tokens/ — replacing existing files.
 *
 * Requires: FIGMA_TOKEN environment variable (Figma personal access token)
 *
 * Usage:
 *   FIGMA_TOKEN=your_token node scripts/fetch-tokens.mjs
 *   npm run fetch:tokens  (token set in .env or environment)
 *   node scripts/fetch-tokens.mjs --out <dir>  (write somewhere other than Design Tokens/)
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
import { TIER_FILES, fileForPath } from './lib/tier-tokens.mjs';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
// --out <dir> writes somewhere else (e.g. a scratch dir for a two-way diff)
const outIdx = process.argv.indexOf('--out');
const DIR = outIdx !== -1 ? resolve(process.argv[outIdx + 1]) : join(ROOT, 'Design Tokens');
const FILE_KEY = '9Lqv0lrj1pRM14NVs4TsSk';

const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.error('❌ FIGMA_TOKEN environment variable is required\n');
  console.error('   Get a token at: https://www.figma.com/settings → Personal access tokens');
  console.error('   Required scope: File content (read only)\n');
  console.error('   Usage: FIGMA_TOKEN=your_token npm run fetch:tokens\n');
  process.exit(1);
}

// ─── Fetch from Figma REST API ────────────────────────────────────────────────

console.log('🔄 Fetching tokens from Figma...\n');

let apiResponse;
try {
  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/variables/local`, {
    headers: { 'X-FIGMA-TOKEN': token }
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Figma API error ${res.status}: ${body}`);
    process.exit(1);
  }
  apiResponse = await res.json();
} catch (err) {
  console.error(`❌ Network error: ${err.message}`);
  process.exit(1);
}

const { meta } = apiResponse;
if (!meta?.variables || !meta?.variableCollections) {
  console.error('❌ Unexpected API response format');
  process.exit(1);
}

// ─── Convert to DTCG JSON ─────────────────────────────────────────────────────

/**
 * Figma variable names follow the 8-tier taxonomy: `<tier>/<aspect>/<name>`
 * (e.g. `color/background/button/primary/default`, grouped by `/` in Figma). The name — not the
 * collection — decides the output file, and slashes → hyphens gives the CSS name.
 */
function figmaNameToAliasPath(name) {
  return name.split('/').join('.');
}

/**
 * Convert Figma variable path (slash-separated) to nested object.
 * e.g. "colors/neutral/50" → { colors: { neutral: { "50": token } } }
 */
function setNestedPath(obj, parts, value) {
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Convert a Figma variable value to DTCG $value.
 * Handles: colors (with hex), numbers, strings, aliases.
 */
function convertValue(value, variables) {
  if (value === null || value === undefined) return null;

  // Alias reference
  if (value.type === 'VARIABLE_ALIAS') {
    const referenced = variables[value.id];
    // size/* aliases the shape/density mode collections; follow them to their
    // default mode so size.tokens.json keeps matching tokens.css.
    const refCollection = referenced && collections[referenced.variableCollectionId];
    if (refCollection && isModePicker(refCollection)) {
      return convertValue(referenced.valuesByMode[refCollection.modes[0].modeId], variables);
    }
    if (referenced) {
      const refPath = figmaNameToAliasPath(referenced.name);
      return `{${refPath}}`;
    }
    return null;
  }

  // Color value
  if (typeof value === 'object' && 'r' in value) {
    const r = Math.round(value.r * 255);
    const g = Math.round(value.g * 255);
    const b = Math.round(value.b * 255);
    const a = value.a ?? 1;
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    if (a < 1) {
      return { colorSpace: 'srgb', components: [value.r, value.g, value.b], alpha: a, hex };
    }
    return { colorSpace: 'srgb', components: [value.r, value.g, value.b], alpha: 1, hex };
  }

  return value;
}

/**
 * Get the DTCG $type for a Figma variable type.
 */
function getType(resolvedType) {
  const map = { COLOR: 'color', FLOAT: 'number', STRING: 'string', BOOLEAN: 'boolean' };
  return map[resolvedType] ?? 'string';
}

// ─── Build collection files ───────────────────────────────────────────────────

// Multi-mode collections the size collection aliases (Themes page pickers).
const MODE_COLLECTIONS = new Set(['shape', 'density']);
// Only a picker while it has several modes — a single-mode shape collection is a normal tier.
const isModePicker = col => MODE_COLLECTIONS.has(col.name.toLowerCase()) && col.modes.length > 1;

const collections = meta.variableCollections;
const variables = meta.variables;

// Map collection IDs to names
const collectionMap = {};
for (const [id, col] of Object.entries(collections)) {
  collectionMap[id] = col;
}

// Group variables by collection
const byCollection = {};
for (const [id, variable] of Object.entries(variables)) {
  if (variable.remote) continue; // skip library variables
  const colId = variable.variableCollectionId;
  if (!byCollection[colId]) byCollection[colId] = [];
  byCollection[colId].push({ id, ...variable });
}

// Build output files — routed by the variable name's first segment:
// a tier, `primitive`, or a component from Design Tokens/vocabulary.json.
const VOCAB = JSON.parse(readFileSync(join(ROOT, 'Design Tokens', 'vocabulary.json'), 'utf8'));
const FIRST_SEGMENTS = new Set([...TIER_FILES, 'primitive', ...VOCAB.layers.component.components]);
const outputFiles = {};
const offTier = [];

// One collection per tier, the single-mode component collection (its variables alias
// semantics, so they follow the color collection's light/dark mode), plus legacy shared ones.
const KNOWN_COLLECTIONS = new Set(['primitive', 'component', 'typography', 'table', ...TIER_FILES]);

for (const [colId, vars] of Object.entries(byCollection)) {
  const collection = collectionMap[colId];
  if (!collection) continue;

  const colName = collection.name.toLowerCase();
  // Shape/density mode pickers are followed through aliases (convertValue), not exported.
  if (!KNOWN_COLLECTIONS.has(colName) || isModePicker(collection)) continue;
  const modes = collection.modes;

  // Multi-mode color collection → embed dark mode in $extensions
  const isColor = colName === 'color' && modes.length > 1;
  const lightModeId = isColor ? modes.find(m => m.name === 'light')?.modeId : null;
  const darkModeId = isColor ? modes.find(m => m.name === 'dark')?.modeId : null;
  const defaultModeId = modes[0]?.modeId;

  for (const variable of vars) {
    const parts = variable.name.split('/');
    const type = getType(variable.resolvedType);

    // Skip variables whose top-level path segment starts with uppercase
    // These are component-layer or work-in-progress variables not part of the core DS
    if (/^[A-Z]/.test(parts[0])) continue;

    if (!FIRST_SEGMENTS.has(parts[0])) {
      offTier.push(`${collection.name} → ${variable.name}`);
      continue;
    }

    let value;
    let darkValue = null;

    if (isColor && lightModeId) {
      value = convertValue(variable.valuesByMode[lightModeId], variables);
      if (darkModeId) {
        darkValue = convertValue(variable.valuesByMode[darkModeId], variables);
      }
    } else {
      value = convertValue(variable.valuesByMode[defaultModeId], variables);
    }

    if (value === null) continue;

    const token = {
      $type: type,
      $value: value,
    };

    if (variable.description) token.$description = variable.description;

    if (darkValue !== null && JSON.stringify(darkValue) !== JSON.stringify(value)) {
      token.$extensions = {
        'figma-console-mcp': {
          variableId: variable.id,
          lastSyncedAt: new Date().toISOString(),
          lastSyncedValue: { light: value, dark: darkValue },
        },
        modes: { dark: darkValue }
      };
    } else {
      token.$extensions = { 'figma-console-mcp': { variableId: variable.id } };
    }

    const file = fileForPath(variable.name);
    setNestedPath((outputFiles[file] ??= {}), parts, token);
  }
}

if (offTier.length) {
  console.warn(`⚠️  ${offTier.length} Figma variable(s) outside the vocabulary were skipped:`);
  for (const v of offTier) console.warn(`   ${v}`);
  console.warn('   Rename them to a tier, primitive/ or <component>/ path — see Design Tokens/vocabulary.json\n');
}

// ─── Write files ──────────────────────────────────────────────────────────────

mkdirSync(DIR, { recursive: true });

let written = 0;
for (const [filename, data] of Object.entries(outputFiles)) {
  const outPath = join(DIR, filename);
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');
  written++;
  console.log(`   ✅ ${filename}`);
}

console.log(`\n✅ Wrote ${written} token files to ${DIR}\n`);
console.log('   Next: npm run sync:tokens\n');
