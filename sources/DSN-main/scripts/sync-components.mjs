#!/usr/bin/env node
/**
 * DS-Nagarro component sync
 *
 * Compares Figma component properties (Design Tokens/figma-components.json,
 * written by fetch-figma-components.mjs) against the React props in
 * ds-index.json (written by generate-index.mjs). Detects:
 *   1. Figma component sets with no code component
 *   2. Figma props with no code prop       (🆕 FIGMA-ONLY)
 *   3. Visual code props with no Figma prop (🗑️ CODE-ONLY — booleans and unions only)
 *   4. Variant options vs union values      (✏️ VALUES DIFFER)
 *   5. Incompatible kinds                   (🔀 TYPE MISMATCH)
 *   6. Same prop under two names             (🏷️ NAME MISMATCH)
 *
 * Name matching is convention-first ("Show leading icon" → showLeadingIcon,
 * "Input / Text input" → TextInput, "Small" → sm). Exceptions live only in
 * Design Tokens/component-map.json.
 *
 * Figma `State` is ignored unless the code component has a `state` prop —
 * hover/pressed/focused are CSS pseudo-classes, never props. A State value
 * naming a code boolean (State=Error ↔ error) counts as a match.
 *
 * Exit 0 — no drift
 * Exit 1 — drift found
 *
 * Usage:
 *   node scripts/sync-components.mjs
 *   node scripts/sync-components.mjs --verbose
 *   node scripts/sync-components.mjs --json
 *   node scripts/sync-components.mjs --file <figma-components.json>  (compare a scratch fetch)
 *   node scripts/sync-components.mjs --only Button,Tag               (filter by Figma set or code name)
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const VERBOSE = process.argv.includes('--verbose');
const JSON_OUT = process.argv.includes('--json');
const arg = name => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
};
const FILE = arg('--file') ? resolve(arg('--file')) : join(ROOT, 'Design Tokens', 'figma-components.json');
const ONLY = arg('--only')?.split(',').map(s => s.trim());

const readJSON = path => JSON.parse(readFileSync(path, 'utf8'));
const figma = readJSON(FILE);
const index = readJSON(join(ROOT, 'ds-index.json'));
const map = readJSON(join(ROOT, 'Design Tokens', 'component-map.json'));
const code = index.components;

// ─── Naming helpers ───────────────────────────────────────────────────────────

const words = s => s.replace(/[()]/g, ' ').split(/[\s_\-/]+/).filter(Boolean);
const pascal = s => words(s).map(w => w[0].toUpperCase() + w.slice(1)).join('');
const camel = s => {
  const p = pascal(s);
  return p && p[0].toLowerCase() + p.slice(1);
};
const compact = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const kebab = s => words(s).map(w => w.toLowerCase()).join('-');

const asList = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
const lastSegment = name => name.split('/').pop().trim();

// Look up a map entry by full Figma set name, then by its last segment.
const forSet = (table, setName) => table?.[setName] ?? table?.[lastSegment(setName)];

// ─── Code prop classification ────────────────────────────────────────────────

const isBoolean = p => p.type === 'boolean';
const isUnion = p => Array.isArray(p.values) && p.values.length > 0;
const isNodeLike = p => !isBoolean(p) && !isUnion(p);

const ALWAYS_IGNORED_CODE = /^(on[A-Z]|aria-|default[A-Z])/;
const ALWAYS_IGNORED_NAMES = new Set(['className', 'style', 'id', 'name', 'ref', 'role', 'tabIndex', 'key']);

// ─── Component matching ──────────────────────────────────────────────────────

function matchComponent(setName) {
  if (map.components && setName in map.components) return map.components[setName];
  const last = pascal(lastSegment(setName));
  const candidates = [last, `${last}Input`, pascal(setName)];
  return candidates.find(c => code[c]) ?? undefined;
}

// ─── Prop matching ───────────────────────────────────────────────────────────

const PRESENCE = /^(show|has)\s+/i;

// Case-insensitive key lookup ("leading icon" finds "Leading icon").
function lookup(table, key) {
  if (!table) return undefined;
  const k = Object.keys(table).find(k => k.toLowerCase() === key.toLowerCase());
  return k === undefined ? undefined : { value: table[k] };
}

function propCandidates(setName, figmaName, figmaType) {
  const own = lookup(forSet(map.props, setName), figmaName);
  if (own) return { explicit: true, list: asList(own.value) };
  const global = map.props?.['*'];
  const list = [...asList(lookup(global, figmaName)?.value), camel(figmaName)];
  if (PRESENCE.test(figmaName)) {
    const stem = figmaName.replace(PRESENCE, '');
    // A "Show X" toggle may be modelled as an optional `x` prop in code.
    list.push(`show${pascal(stem)}`, `has${pascal(stem)}`, ...asList(lookup(global, stem)?.value), camel(stem));
  } else if (figmaType === 'BOOLEAN') {
    list.push(`show${pascal(figmaName)}`, `has${pascal(figmaName)}`);
  }
  return { explicit: false, list: [...new Set(list)] };
}

function valueCandidates(v) {
  const alias = map.values?.[v];
  return [...new Set([alias, kebab(v), compact(v), v].filter(Boolean))];
}

// "Show X" matched to a non-toggle prop `x` — the prop's presence is the toggle.
const isPresence = (figmaName, codeName) => PRESENCE.test(figmaName) && !/^(show|has)[A-Z]/.test(codeName);

const isBoolVariant = fp => fp.type === 'VARIANT' && fp.values.every(v => /^(true|false)$/i.test(v));

function compareValues(fp, cp) {
  const codeValues = new Set(cp.values);
  const hit = new Set();
  const figmaOnly = [];
  for (const v of fp.values) {
    // Fall back to a single shared word ("Date range" ↔ range) when it is unambiguous.
    const byWord = words(v).map(w => w.toLowerCase()).filter(w => codeValues.has(w));
    const m = valueCandidates(v).find(c => codeValues.has(c)) ?? (byWord.length === 1 ? byWord[0] : undefined);
    if (m) hit.add(m);
    else figmaOnly.push(v);
  }
  const codeOnly = cp.values.filter(v => !hit.has(v));
  return { figmaOnly, codeOnly };
}

// Returns null when compatible, or a short reason when not.
function typeMismatch(fp, cp, viaPresence) {
  switch (fp.type) {
    case 'BOOLEAN':
      if (isBoolean(cp) || viaPresence) return null;
      return `Figma BOOLEAN vs code ${cp.type}`;
    case 'VARIANT':
      if (isBoolVariant(fp)) return isBoolean(cp) ? null : `Figma True/False variant vs code ${cp.type}`;
      return isUnion(cp) ? null : `Figma VARIANT vs code ${cp.type}`;
    case 'TEXT':
      return isBoolean(cp) || isUnion(cp) ? `Figma TEXT vs code ${cp.type}` : null;
    case 'INSTANCE_SWAP':
    case 'SLOT':
      return isNodeLike(cp) ? null : `Figma ${fp.type} vs code ${cp.type}`;
    default:
      return null;
  }
}

// A Figma-only prop and a code-only prop that differ only by a show/has/is
// prefix or casing are one rename, not two gaps (e.g. "Sorted" ↔ "isSorted").
function pairRenames(entry) {
  const stem = n => compact(n).replace(/^(show|has|is)/, '');
  const figmaOnly = entry.drift.filter(d => d.kind === 'figma-only');
  for (const f of figmaOnly) {
    const c = entry.drift.find(d => d.kind === 'code-only' && stem(d.code) === stem(f.figma));
    if (!c) continue;
    entry.drift = entry.drift.filter(d => d !== f && d !== c);
    entry.drift.push({ kind: 'rename', figma: f.figma, code: c.code, detail: `${f.figmaType} vs ${c.codeType}` });
  }
}

// ─── Diff ────────────────────────────────────────────────────────────────────

const report = {
  unmatchedSets: [],
  components: [],
  codeWithoutSet: [],
};

const usedCode = new Set();

for (const [setName, set] of Object.entries(figma.sets)) {
  const compName = matchComponent(setName);
  if (compName === null) continue; // intentionally Figma-only
  if (ONLY && !ONLY.includes(setName) && !ONLY.includes(compName)) continue;
  if (!compName || !code[compName]) {
    report.unmatchedSets.push({ set: setName, tried: compName ?? pascal(lastSegment(setName)) });
    continue;
  }
  usedCode.add(compName);

  const codeProps = code[compName].props ?? {};
  const codeByLower = new Map(Object.keys(codeProps).map(n => [n.toLowerCase(), n]));
  const ignore = forSet(map.ignore, setName) ?? {};
  const globalIgnore = map.ignore?.['*'] ?? {};
  const ignoreFigma = new Set([...asList(globalIgnore.figma), ...asList(ignore.figma)]);
  const ignoreCode = new Set([...asList(globalIgnore.code), ...asList(ignore.code)]);

  const entry = { set: setName, component: compName, nodeId: set.nodeId, path: code[compName].path, drift: [] };
  const matchedCode = new Set();

  for (const [figmaName, fp] of Object.entries(set.props)) {
    if (ignoreFigma.has(figmaName)) continue;
    const { explicit, list } = propCandidates(setName, figmaName, fp.type);
    if (explicit && list.length === 0) continue; // mapped to null — intentionally Figma-only

    // Figma `State` is a CSS pseudo-class matrix unless code models a state prop.
    // A state value that names a code boolean (State=Error ↔ error) still counts as matched.
    if (figmaName === 'State' && !explicit && !codeProps.state) {
      for (const v of fp.values ?? []) {
        const n = camel(v);
        if (codeProps[n] && isBoolean(codeProps[n])) matchedCode.add(n);
      }
      continue;
    }

    // Prefer the first type-compatible candidate ("Avatar" BOOLEAN → showAvatar, not avatar).
    // Acronyms differ in case across tools ("Show main CTA" → showMainCTA ↔ showMainCta).
    const present = [...new Set(list.map(n => (codeProps[n] ? n : codeByLower.get(n.toLowerCase()))).filter(Boolean))];
    const codeName =
      present.find(n => !typeMismatch(fp, codeProps[n], isPresence(figmaName, n))) ?? present[0];
    if (!codeName) {
      entry.drift.push({ kind: 'figma-only', figma: figmaName, figmaType: fp.type, values: fp.values, tried: list });
      continue;
    }
    matchedCode.add(codeName);
    const cp = codeProps[codeName];
    const mismatch = typeMismatch(fp, cp, isPresence(figmaName, codeName));
    if (mismatch) {
      entry.drift.push({ kind: 'type', figma: figmaName, code: codeName, detail: mismatch });
      continue;
    }
    if (fp.type === 'VARIANT' && !isBoolVariant(fp)) {
      const { figmaOnly, codeOnly } = compareValues(fp, cp);
      if (figmaOnly.length || codeOnly.length) {
        entry.drift.push({ kind: 'values', figma: figmaName, code: codeName, figmaOnly, codeOnly });
      }
    }
  }

  for (const [codeName, cp] of Object.entries(codeProps)) {
    if (matchedCode.has(codeName) || ignoreCode.has(codeName)) continue;
    // badgeVariant / tagVariant / switcherChecked configure a nested instance that
    // Figma exposes on that instance, not on this set — skip when showBadge etc. exist.
    const nested = codeName.match(/^([a-z]+)[A-Z]/)?.[1];
    const showsNested = n => n.startsWith(`show${pascal(nested)}`);
    if (nested && nested !== 'show' && nested !== 'has' && Object.keys(codeProps).some(showsNested)) continue;
    if (ALWAYS_IGNORED_NAMES.has(codeName) || ALWAYS_IGNORED_CODE.test(codeName)) continue;
    // Only visual switches belong in Figma; content/data props (strings, nodes, arrays) don't.
    if (!isBoolean(cp) && !isUnion(cp)) continue;
    entry.drift.push({ kind: 'code-only', code: codeName, codeType: isUnion(cp) ? cp.values.join(' | ') : cp.type });
  }

  pairRenames(entry);
  report.components.push(entry);
}

if (!ONLY) {
  report.codeWithoutSet = Object.keys(code).filter(n => !usedCode.has(n)).sort();
}

const drifted = report.components.filter(c => c.drift.length);
const driftCount = drifted.reduce((n, c) => n + c.drift.length, 0) + report.unmatchedSets.length;

// ─── Output ──────────────────────────────────────────────────────────────────

if (JSON_OUT) {
  console.log(JSON.stringify({ figmaLastModified: figma.lastModified, ...report, components: drifted }, null, 2));
  process.exit(driftCount ? 1 : 0);
}

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const LABEL = {
  'figma-only': '🆕 FIGMA-ONLY',
  'code-only': '🗑️  CODE-ONLY',
  values: '✏️  VALUES DIFFER',
  type: '🔀 TYPE MISMATCH',
  rename: '🏷️  NAME MISMATCH',
};

console.log(`\n🧩 Component sync — Figma (${figma.lastModified ?? 'unknown'}) vs ds-index.json\n`);
console.log(`   ${plural(report.components.length, 'component set')} matched, ${plural(drifted.length, 'with drift')}`);

if (report.unmatchedSets.length) {
  console.log(`\n🧩 UNMATCHED — ${plural(report.unmatchedSets.length, 'Figma set')} with no code component:\n`);
  for (const u of report.unmatchedSets) console.log(`  ${u.set}  (tried ${u.tried})`);
  console.log('\n  → Map it in Design Tokens/component-map.json → components (null = intentionally Figma-only).');
}

for (const c of drifted) {
  console.log(`\n${c.set}  →  ${c.component}   (${c.path}, node ${c.nodeId})`);
  for (const d of c.drift) {
    const label = LABEL[d.kind].padEnd(18);
    if (d.kind === 'figma-only') {
      const vals = d.values ? ` [${d.values.join(', ')}]` : '';
      console.log(`  ${label} ${d.figma} (${d.figmaType})${vals}`);
      if (VERBOSE) console.log(`  ${''.padEnd(18)}   ↳ tried: ${d.tried.join(', ')}`);
    } else if (d.kind === 'code-only') {
      console.log(`  ${label} ${d.code}: ${d.codeType}`);
    } else if (d.kind === 'values') {
      const parts = [];
      if (d.figmaOnly.length) parts.push(`Figma-only: ${d.figmaOnly.join(', ')}`);
      if (d.codeOnly.length) parts.push(`code-only: ${d.codeOnly.join(', ')}`);
      console.log(`  ${label} ${d.figma} ↔ ${d.code} — ${parts.join('; ')}`);
    } else if (d.kind === 'rename') {
      console.log(`  ${label} ${d.figma} ↔ ${d.code} (${d.detail}) — same prop, different name`);
    } else {
      console.log(`  ${label} ${d.figma} ↔ ${d.code} — ${d.detail}`);
    }
  }
}

if (VERBOSE && report.codeWithoutSet.length) {
  console.log(`\nℹ️  ${plural(report.codeWithoutSet.length, 'code component')} with no Figma set (not drift):\n`);
  console.log(`  ${report.codeWithoutSet.join(', ')}`);
}

console.log('\n' + '─'.repeat(60) + '\n');
if (driftCount) {
  console.log(`❌ ${plural(driftCount, 'drift item')} — run /ds-component-sync to resolve.\n`);
  process.exit(1);
}
console.log('✅ Figma components are in sync with code props\n');
