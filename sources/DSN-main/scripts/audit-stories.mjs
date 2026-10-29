#!/usr/bin/env node
/**
 * DS-Nagarro story contract audit (AGENTS.md Rule 7)
 *
 * Every src/components/**\/*.stories.tsx must:
 *   - title       `<Category>/…/<Component Name>` with a known category and spaced Title Case names
 *   - spec        wire the co-located spec with `specDocsParameters(spec)`
 *   - playground  export `Playground` first — the docs site embeds it as the component hero
 *   - args        drive `Playground` from args (no zero-argument `render: () =>`)
 *   - names       use the shared showcase names (`Variants`, `Sizes`, `States`) — no `AllX`, `*Hover`, …
 *
 * Warnings (fail only with --strict):
 *   - argTypes    enum/boolean props of the component without an explicit argType
 *
 * Exit 0 — no violations · Exit 1 — violations found
 *
 * Usage:
 *   node scripts/audit-stories.mjs [--verbose] [--strict]
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');
const STRICT = process.argv.includes('--strict');

export const CATEGORIES = ['Actions', 'Inputs & Controls', 'Data Display', 'Feedback', 'Navigation', 'Overlays', 'Layout'];

// Showcase names replaced by the shared `Variants` / `Sizes` / `States` stories, and hover-as-a-prop demos.
const BANNED_NAME = /^(All[A-Z]\w*|SizeScale|SizeComparison|BothVariants|Matrix|ErrorState|\w*Hover(State)?|Determinate\d+)$/;
// Segment words: capitalised words, acronyms (OTP), or `&`. Rejects joined CamelCase (`SearchBar`) and lower-case words (`Button group`).
const TITLE_SEGMENT = /^(?:[A-Z][a-z0-9]*|[A-Z]{2,})(?: (?:[A-Z][a-z0-9]*|[A-Z]{2,}|&))*$/;
const PLUMBING = /^(aria-|on[A-Z]|data-)|^(className|style|id|ref|key|tabIndex|role|name|form|children|type)$/;

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.stories.tsx') ? [p] : [];
  });

/** Text of the first top-level object literal that starts at `start` (balanced braces). */
function objectAt(src, start) {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  return '';
}

/** Enum/boolean props declared on `<Component>Props` in the sibling component file. */
function visualProps(storyFile, component) {
  const file = join(dirname(storyFile), `${component}.tsx`);
  if (!existsSync(file)) return [];
  const src = readFileSync(file, 'utf8');
  const head = src.search(new RegExp(`(interface|type) ${component}Props\\b`));
  if (head < 0) return [];
  const body = objectAt(src, src.indexOf('{', head));
  const props = [];
  for (const m of body.matchAll(/^\s{2}(\w+)\?:\s*([^;\n]+)/gm)) {
    const [, name, type] = m;
    if (PLUMBING.test(name) || /deprecated/i.test(body.slice(Math.max(0, m.index - 200), m.index).split('*/').pop() ?? '')) continue;
    if (type.trim() === 'boolean' || /^'[^']+'(\s*\|\s*'[^']+')+$/.test(type.trim()) || /\b\w+(Size|Variant|Severity)\b/.test(type)) props.push(name);
  }
  return props;
}

const results = [];
for (const file of walk(join(ROOT, 'src/components')).sort()) {
  const src = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  const errors = [];
  const warnings = [];

  const metaStart = src.search(/^const meta\b/m);
  const meta = metaStart >= 0 ? objectAt(src, src.indexOf('{', metaStart)) : '';
  const title = meta.match(/^\s{2}title:\s*['"]([^'"]+)['"]/m)?.[1];
  if (!title) errors.push('meta has no title');
  else {
    const [category, ...rest] = title.split('/');
    if (!CATEGORIES.includes(category)) errors.push(`title category "${category}" is not one of: ${CATEGORIES.join(', ')}`);
    for (const seg of rest) if (!TITLE_SEGMENT.test(seg)) errors.push(`title segment "${seg}" must be spaced Title Case (e.g. "Search Bar")`);
  }

  if (/layout:\s*'centered'/.test(src)) errors.push("layout: 'centered' is the global default — remove it");
  if (!/specDocsParameters\(/.test(meta)) errors.push('spec not wired in meta (parameters: specDocsParameters(spec))');

  const exports = [...src.matchAll(/^export const ([A-Z]\w*)\s*:/gm)].map((m) => ({ name: m[1], index: m.index }));
  if (exports[0]?.name !== 'Playground') errors.push(`first story is "${exports[0]?.name ?? '—'}", expected "Playground"`);
  const playground = exports.find((e) => e.name === 'Playground');
  if (playground) {
    const body = objectAt(src, src.indexOf('{', playground.index));
    if (/render:\s*\(\s*\)\s*=>/.test(body)) errors.push('Playground ignores args (render: () => …) — use render: (args) => …');
    if (/^\s{2}name:/m.test(body)) errors.push('Playground has a custom `name:` — keep the display name "Playground"');
  }
  for (const { name } of exports) if (BANNED_NAME.test(name)) errors.push(`story "${name}" — use the shared Variants / Sizes / States stories (no AllX, *Hover, permutation names)`);

  const component = meta.match(/^\s{2}component:\s*(\w+)/m)?.[1];
  if (component) {
    const argTypes = meta.match(/argTypes:\s*\{/) ? objectAt(meta, meta.indexOf('{', meta.search(/argTypes:/))) : '';
    const missing = visualProps(file, component).filter((p) => !new RegExp(`\\b${p}\\s*:`).test(argTypes));
    if (missing.length) warnings.push(`no argType for: ${missing.join(', ')}`);
  }

  results.push({ rel, errors, warnings: STRICT ? [] : warnings, strictErrors: STRICT ? warnings : [] });
}

let failed = 0;
for (const r of results) {
  const errs = [...r.errors, ...r.strictErrors];
  if (errs.length) failed++;
  if (!errs.length && !(VERBOSE && r.warnings.length)) continue;
  console.log(`\n${errs.length ? '✖' : '⚠'} ${r.rel}`);
  for (const e of errs) console.log(`    ${e}`);
  if (VERBOSE) for (const w of r.warnings) console.log(`    (warn) ${w}`);
}

const warned = results.filter((r) => r.warnings.length).length;
console.log(`\nStory contract: ${results.length - failed}/${results.length} files pass${warned ? `, ${warned} with argType warnings${VERBOSE ? '' : ' (--verbose to list)'}` : ''}.`);
process.exit(failed ? 1 : 0);
