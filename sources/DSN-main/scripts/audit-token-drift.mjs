#!/usr/bin/env node
/**
 * DS-Nagarro token drift detector
 *
 * Compares Design Tokens/*.json (Figma export) against tokens.css
 * (hand-maintained source of truth for components).
 *
 * Reports:
 *   - Tokens in JSON but missing from tokens.css  → Figma added something not yet in CSS
 *   - Tokens in tokens.css but missing from JSON   → CSS has tokens not in Figma JSON
 *
 * NOTE: tokens.css is hand-maintained (Option B architecture). The JSON files
 * are Figma exports used as a reference. Some naming divergences between JSON
 * and CSS are intentional and listed in the exceptions below.
 *
 * Exit 0 — no drift found
 * Exit 1 — drift found (CI fails)
 *
 * Usage:
 *   node scripts/audit-token-drift.mjs
 *   node scripts/audit-token-drift.mjs --verbose
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { loadTierJSON } from './lib/tier-tokens.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const VERBOSE = process.argv.includes('--verbose');

// ─── Exceptions ───────────────────────────────────────────────────────────────

/**
 * Tokens in tokens.css that have no direct JSON counterpart.
 * These are verified against live Figma — they exist in Figma but the
 * JSON exports use different names, or they are CSS-only by design.
 */
const CSS_ONLY_EXCEPTIONS = new Set([
  // ── Spacing scale — JSON uses old names (space/tight, space/standard)
  // CSS uses the correct Figma names (verified live): space/micro, space/compact etc.
  '--space-none', '--space-micro', '--space-tiny', '--space-small',
  '--space-compact', '--space-medium', '--space-large', '--space-spacious',
  '--space-ample', '--space-grand',
  '--space-form-vertical', '--space-toolbar-standard',
  '--inset-none', '--inset-micro', '--inset-tiny', '--inset-small',
  '--inset-compact', '--inset-medium', '--inset-large', '--inset-spacious',

  // ── Radius — JSON uses old names (radius/sharp, radius/outter-*)
  // CSS uses correct Figma names: radius/none, radius/xsmall, radius/small etc.
  '--radius-none', '--radius-xsmall', '--radius-small', '--radius-standard',
  '--radius-large', '--radius-xlarge', '--radius-full',

  // ── Border width — not in JSON, hand-maintained in CSS
  '--size-border-sm', '--size-border-md',
  '--size-border-lg', '--size-border-focus',

  // ── Transitions — motion collection not exported to JSON files
  '--transition-instant', '--transition-fast', '--transition-normal',
  '--transition-slow', '--transition-popover', '--transition-switcher',
  '--transition-drawer', '--transition-modal',

  // ── z-index + breakpoints — JSON has capitalisation/plural bugs
  // (z-Index, breakpoints) — CSS uses correct names verified in live Figma
  '--z-index-sticky', '--z-index-fixed', '--z-index-modal-backdrop',
  '--z-index-modal', '--z-index-popover', '--z-index-tooltip',
  '--size-breakpoint-sm', '--size-breakpoint-md',
  '--size-breakpoint-lg', '--size-breakpoint-xl',

  // ── Dataviz tokens — pending Figma variable setup (known architectural gap)
  '--color-background-dataviz-1', '--color-background-dataviz-2', '--color-background-dataviz-3',
  '--color-background-dataviz-4', '--color-background-dataviz-5', '--color-background-dataviz-6',
  '--color-background-dataviz-7', '--color-background-dataviz-8',
  '--color-background-dataviz-positive', '--color-background-dataviz-negative',
  '--color-background-dataviz-warning', '--color-background-dataviz-neutral',
  '--color-border-dataviz-grid', '--color-border-dataviz-axis', '--color-foreground-dataviz-label',
  '--color-background-dataviz-tooltip', '--color-border-dataviz-tooltip',

  // ── CTA interactive states — Figma renamed these to primary/* in JSON
  // but CSS keeps old names for backward compat with existing components.
  // Both are valid until components migrate to new naming.
  '--color-foreground-interactive-primary-hover', '--color-foreground-interactive-primary-active',

  // ── Layer 3 alias tokens (no direct Figma variable — reference other semantics)
  '--color-foreground-interactive-primary-default',
  '--text-tag-neutral', '--text-tag-error', '--text-tag-success',
  '--text-tag-warning', '--text-tag-progress',
  '--color-border-neutral-primary',
  '--color-border-interactive-primary-selected',
  '--color-shadow-focus-inset', '--color-border-interactive-focus', '--color-border-interactive-destructive-focus',
  '--tag-border-neutral', '--tag-border-error', '--tag-border-success',
  '--tag-border-warning', '--tag-border-progress',
  '--surface-default', '--surface-elevated', '--surface-disabled',
  '--surface-tag-error', '--surface-tag-success', '--surface-tag-warning',
  '--surface-button-primary-default', '--surface-button-primary-hover', '--surface-button-primary-pressed',
  '--surface-button-secondary-default', '--surface-button-secondary-hover', '--surface-button-secondary-pressed',
  '--surface-button-destructive-default', '--surface-button-destructive-hover', '--surface-button-destructive-pressed',
  '--color-shadow-default',
  '--color-shadow-contrast-border',
  '--color-shadow-separator-emboss-light',
  '--color-shadow-emboss-button-secondary-top',
  '--color-shadow-emboss-button-secondary-bottom',

  // ── Backward-compat aliases (used by existing input components)
  '--color-foreground-neutral-primary', '--color-foreground-neutral-secondary', '--color-foreground-neutral-tertiary',
  '--input-foreground-placeholder', '--color-foreground-interactive-disabled',
  '--color-foreground-interactive-destructive-default', '--color-foreground-interactive-destructive-hover', '--color-foreground-interactive-destructive-active',
  '--color-border-neutral-primary', '--input-border-error',
  '--input-border-default',
  '--button-background-primary-default', '--color-background-interactive-secondary-selected',

  // ── Composite box-shadow tokens
  '--button-shadow-primary-default', '--button-shadow-primary-hover',
  '--button-shadow-active',
  '--button-shadow-secondary-default', '--button-shadow-secondary-hover',
  '--button-shadow-destructive-default', '--button-shadow-destructive-hover',
  '--button-shadow-focus', '--button-shadow-destructive-focus',
  '--button-shadow-group',
  '--switcher-shadow-track-off', '--switcher-shadow-thumb',
  '--input-shadow',

  // ── Component token aliases
  '--control-button-inset-standard', '--control-button-inset-small',
  '--control-button-space-standard', '--space-xs', '--control-button-space-small',
  '--space-xs', '--control-chip-space-small',
  '--space-none', '--inset-label-wrapper-standard',
  '--space-xs', '--space-2xs',
  '--tag-height', '--tag-inset', '--tag-radius', '--border-ui-icon',
  '--space-md',
  '--control-height-standard', '--size-control-height-sm',
  '--control-radius-standard', '--control-radius-small',
  '--avatar-size-2xs', '--avatar-size-xs', '--avatar-size-sm',
  '--avatar-size-lg', '--avatar-size-xl', '--avatar-size-2xl',
  '--avatar-overlap',
  '--size-container-md', '--popover-width-md',
  '--topbar-height', '--toolbar-height', '--space-md',
  '--section-header-height-sm', '--sidebar-width-expanded-min', '--sidebar-width-collapsed',
  '--surface-tooltip-radius', '--surface-popover-radius',
  '--surface-card-radius', '--surface-modal-radius', '--surface-modal-max-width',
  '--surface-popover-width-min', '--surface-popover-width-standard',
  '--surface-popover-width-large', '--surface-popover-width-max',

  // ── Teal compat primitives (manually maintained, not in Figma)
  '--primitive-teal-300', '--primitive-teal-400', '--primitive-teal-600',

  // ── Effects dimension tokens
  '--effects-offset-1', '--effects-blur-subtle', '--effects-spread-positive-1',
  '--primitive-size-1', '--primitive-size-negative-1',

  // ── Scale primitives
  '--primitive-size-0', '--primitive-size-1', '--primitive-size-2', '--primitive-size-4', '--primitive-size-8',
  '--primitive-size-12', '--primitive-size-16', '--primitive-size-24', '--primitive-size-32', '--primitive-size-48',
  '--primitive-size-64', '--primitive-size-128', '--primitive-size-192', '--primitive-size-256', '--primitive-size-320',
  '--primitive-size-480', '--primitive-size-512', '--primitive-size-768', '--primitive-size-1024', '--primitive-size-full',

  // ── Size semantic tokens
  '--primitive-size-0', '--primitive-size-2', '--primitive-size-4', '--primitive-size-8', '--primitive-size-12', '--primitive-size-16',
  '--primitive-size-24', '--primitive-size-32', '--primitive-size-48', '--primitive-size-64', '--primitive-size-192',
  '--primitive-size-256', '--primitive-size-320', '--primitive-size-480', '--primitive-size-1024',
]);

/**
 * Tokens in JSON that are intentionally not in tokens.css.
 * Either superseded by better-named CSS tokens, or primitive internals
 * not needed at the CSS layer.
 */
const JSON_ONLY_EXCEPTIONS = new Set([
  // ── Primitive type scale — CSS uses font-size-* directly
  '--scale-type-scale-t-12', '--scale-type-scale-t-14', '--scale-type-scale-t-16',
  '--scale-type-scale-t-20', '--scale-type-scale-t-24', '--scale-type-scale-t-32',
  '--scale-type-scale-t-40', '--scale-type-scale-t-48', '--scale-type-scale-t-52',
  '--scale-type-scale-t-56', '--scale-type-scale-t-60', '--scale-type-scale-t-64',

  // ── Old JSON spacing names — CSS uses correct Figma names instead

  // ── Old JSON radius names — CSS uses correct Figma names instead

  // ── Control/component tokens with old JSON names
  '--tag-height',                    // CSS: --tag-height

  // ── Effects tokens not yet needed in CSS
  '--effects-offset-2', '--effects-offset-3',
  '--effects-blur-medium', '--effects-blur-strong',
  '--effects-spread-positive-2', '--effects-spread-positive-3',
  '--effects-spread-negative-1', '--effects-spread-negative-2', '--effects-spread-negative-3',

  // ── JSON capitalisation bugs — real tokens use correct casing in CSS
  '--z-Index-sticky', '--z-Index-fixed', '--z-Index-modal-backdrop',
  '--z-Index-modal', '--z-Index-popover', '--z-Index-tooltip',
  '--breakpoints-mobile', '--breakpoints-tablet',
  '--breakpoints-desktop', '--breakpoints-desktop-large',

  // ── New Figma naming (primary/*) — components not yet migrated
  // Old names kept in CSS for backward compat (in CSS_ONLY_EXCEPTIONS above)
]);

// ─── Load tokens.css ──────────────────────────────────────────────────────────

function loadCSSTokens() {
  const src = readFileSync(join(ROOT, 'tokens.css'), 'utf8');
  const defined = new Set();
  for (const line of src.split('\n')) {
    const m = line.match(/^\s*(--[\w-]+)\s*:/);
    if (!m) continue;
    defined.add(m[1]);
    // Inline /* css-only */ marker — same convention as sync-tokens.mjs
    if (/\/\*\s*css-only\b/.test(line)) CSS_ONLY_EXCEPTIONS.add(m[1]);
  }
  return defined;
}

// ─── Load JSON tokens ─────────────────────────────────────────────────────────
// One file per tier; the JSON path is the CSS name (scripts/lib/tier-tokens.mjs).

const loadJSONTokens = () => loadTierJSON(join(ROOT, 'Design Tokens'));
const isJsonOnly = name => JSON_ONLY_EXCEPTIONS.has(name) || /^--primitive-font-size-/.test(name);

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log('🔍 DS-Nagarro token drift audit\n');

const cssTokens = loadCSSTokens();
const jsonTokens = loadJSONTokens();

const missingFromCSS = [];
const missingFromJSON = [];

for (const [cssName, meta] of jsonTokens) {
  if (!cssTokens.has(cssName) && !isJsonOnly(cssName)) {
    missingFromCSS.push({ cssName, ...meta });
  }
}

for (const cssName of cssTokens) {
  if (!jsonTokens.has(cssName) && !CSS_ONLY_EXCEPTIONS.has(cssName)) {
    missingFromJSON.push(cssName);
  }
}

if (missingFromCSS.length === 0 && missingFromJSON.length === 0) {
  console.log('✅ No drift found — tokens.css is in sync with Design Tokens/\n');
  if (VERBOSE) {
    console.log(`   ${cssTokens.size} tokens in tokens.css`);
    console.log(`   ${jsonTokens.size} tokens in JSON files`);
    console.log(`   ${CSS_ONLY_EXCEPTIONS.size} CSS-only exceptions`);
    console.log(`   ${JSON_ONLY_EXCEPTIONS.size} JSON-only exceptions\n`);
  }
  process.exit(0);
}

let exitCode = 0;

if (missingFromCSS.length > 0) {
  exitCode = 1;
  console.log(`❌ ${missingFromCSS.length} token${missingFromCSS.length === 1 ? '' : 's'} in Figma JSON but missing from tokens.css:\n`);
  console.log('   These were added in Figma but not yet mirrored in tokens.css.\n');
  const byFile = {};
  for (const t of missingFromCSS) {
    if (!byFile[t.file]) byFile[t.file] = [];
    byFile[t.file].push(t);
  }
  for (const [file, tokens] of Object.entries(byFile)) {
    console.log(`  ${file}`);
    for (const t of tokens) console.log(`    ${t.cssName}  ← JSON path: ${t.path}`);
    console.log();
  }
}

if (missingFromJSON.length > 0) {
  exitCode = 1;
  console.log(`⚠️  ${missingFromJSON.length} token${missingFromJSON.length === 1 ? '' : 's'} in tokens.css but not in Figma JSON or exceptions list:\n`);
  console.log('   Verify each against Figma or add to CSS_ONLY_EXCEPTIONS with a comment.\n');
  for (const t of missingFromJSON) console.log(`    ${t}`);
  console.log();
}

if (VERBOSE) {
  console.log(`\n   ${cssTokens.size} tokens in tokens.css`);
  console.log(`   ${jsonTokens.size} tokens in JSON files`);
  console.log(`   ${CSS_ONLY_EXCEPTIONS.size} CSS-only exceptions`);
  console.log(`   ${JSON_ONLY_EXCEPTIONS.size} JSON-only exceptions\n`);
}

process.exit(exitCode);
