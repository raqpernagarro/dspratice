#!/usr/bin/env node
/**
 * DS-Nagarro token audit script
 *
 * Enforces the three-layer token architecture:
 *   primitives (raw hex) → semantics (var() refs) → component usage
 *
 * Detects violations in:
 *   - tokens.css               (primitive + semantic layer definitions)
 *   - src/**\/*.ts(x)          (Styled Components usage)
 *   - src/**\/*.css            (any other CSS)
 *
 * Also detects doc/token drift:
 *   - specs/**\/*.md           (component and pattern specs)
 *   - AI.md, AI-short.md       (consumer usage guides)
 *   - AGENTS.md                (builder guide)
 *
 * Exit 0 — no violations found
 * Exit 1 — violations found (CI fails)
 *
 * Usage:
 *   node scripts/audit-tokens.mjs
 *   node scripts/audit-tokens.mjs --verbose
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { fileURLToPath } from 'url';
import { parseToken, missingDefaults } from './lib/token-grammar.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const VERBOSE = process.argv.includes('--verbose');

// ─── Patterns ────────────────────────────────────────────────────────────────

const RAW_COLOR_RE = /#([0-9a-fA-F]{3,8})\b|rgba?\s*\(|hsla?\s*\(/g;
const CSS_VAR_DEF_RE = /^(\s*)(--[\w-]+)\s*:/;
const VAR_REF_RE = /var\s*\(--[\w-]+/;
// Dataviz series + neutral hold brand-locked hex. positive/negative/warning alias
// the feedback ramps (so a theme's Feedback choice reaches charts) — not primitives.
const PRIMITIVE_PREFIX_RE = /^--primitive-|^--color-background-dataviz-([1-8]|neutral)$/;

// Matches any var(--token-name) reference in doc files
const DOC_VAR_RE = /var\((--[\w-]+)\)/g;

// Matches var(--token-name) references in source files (including nested fallbacks)
const SOURCE_VAR_RE = /var\(\s*(--[\w-]+)/g;

// ─── File collection ─────────────────────────────────────────────────────────

function walk(dir, exts, ignore = ['node_modules', 'dist', '.storybook', 'storybook-static', 'docs', 'stories']) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (ignore.includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full, exts, ignore));
    } else if (exts.includes(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

// ─── Violation collectors ─────────────────────────────────────────────────────

const violations = [];
const warnings = [];

function report(file, line, lineNo, message) {
  violations.push({ file: relative(ROOT, file), line: lineNo, message, source: line.trim() });
}

// ─── Audit: tokens.css ───────────────────────────────────────────────────────

function auditTokensCSS() {
  const tokenPath = join(ROOT, 'tokens.css');
  let src;
  try {
    src = readFileSync(tokenPath, 'utf8');
  } catch {
    console.error('⚠️  tokens.css not found — skipping CSS token audit');
    return;
  }

  const lines = src.split('\n');
  const definedNames = [];

  let inRootBlock = false;
  let braceDepth = 0;
  // Depth at which the current [data-theme="dark"] block opened (-1 = not inside one).
  let darkDepth = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    const opensDark = /\[data-theme="dark"\]\s*\{/.test(line);
    for (const ch of line) {
      if (ch === '{') braceDepth++;
      if (ch === '}') braceDepth--;
    }
    if (opensDark) darkDepth = braceDepth;
    else if (darkDepth !== -1 && braceDepth < darkDepth) darkDepth = -1;

    const defMatch = line.match(CSS_VAR_DEF_RE);
    if (!defMatch) continue;

    // Every name parses against the closed vocabulary (Design Tokens/vocabulary.json).
    const { layer, error: grammarError } = parseToken(defMatch[2]);
    if (grammarError) {
      report(tokenPath, line, lineNo, `Token '${defMatch[2]}' breaks the grammar: ${grammarError}`);
    }
    if (layer === 'semantic') definedNames.push(defMatch[2]);

    // Component tokens are mode-agnostic: they alias a semantic token, which carries the
    // light/dark switch. Figma keeps them in a single-mode `component` collection, so a
    // per-mode alias here could never sync. CSS-only composites (shadows) are exempt.
    if (layer === 'component' && darkDepth !== -1) {
      let end = i; while (end < lines.length - 1 && !lines[end].includes(';')) end++;
      if (!lines.slice(i, end + 1).join(' ').includes('css-only')) {
        report(tokenPath, line, lineNo,
          `Component token '${defMatch[2]}' is redefined in dark mode — move the switch into a semantic token`);
      }
    }

    const propName = defMatch[2];
    const valueStart = line.indexOf(':', line.indexOf(propName)) + 1;
    const value = line.slice(valueStart).trim();

    const isPrimitive = PRIMITIVE_PREFIX_RE.test(propName);

    if (isPrimitive) {
      if (VAR_REF_RE.test(value)) {
        report(tokenPath, line, lineNo,
          `Primitive token '${propName}' references var() — primitives must hold raw values`);
      }
    } else {
      const rawMatches = [...value.matchAll(RAW_COLOR_RE)];
      for (const m of rawMatches) {
        if (m[0] === 'transparent' || m[0] === 'currentColor') continue;
        report(tokenPath, line, lineNo,
          `Semantic token '${propName}' contains raw color value '${m[0]}' — use var(--colors-*) instead`);
      }

      if (!VAR_REF_RE.test(value) && rawMatches.length === 0) {
        const namedColorRE = /\b(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey)\b/i;
        if (namedColorRE.test(value)) {
          report(tokenPath, line, lineNo,
            `Semantic token '${propName}' uses named color '${value.trim()}' — use var(--colors-*) instead`);
        }
      }
    }
  }

  // Handbook T7: a semantic family with hover/active states also has -default.
  for (const family of missingDefaults(definedNames)) {
    report(tokenPath, '', 0, `Family '--${family}' has hover/active states but no '--${family}-default'`);
  }
}

// ─── Audit: component source files ──────────────────────────────────────────

function auditSourceFiles() {
  const srcDir = join(ROOT, 'src');
  const files = walk(srcDir, ['.ts', '.tsx', '.css'])
    .filter(f => !f.endsWith('.stories.tsx') && !f.endsWith('.stories.ts') && !f.includes('/stories/'));

  const tokenPath = join(ROOT, 'tokens.css');

  for (const file of files) {
    if (file === tokenPath) continue;

    const src = readFileSync(file, 'utf8');
    const lines = src.split('\n');

    let inBlockComment = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;

      if (line.includes('/*')) inBlockComment = true;
      if (line.includes('*/')) { inBlockComment = false; continue; }
      if (inBlockComment) continue;

      if (/^\s*\/\//.test(line)) continue;
      if (/^\s*import\s/.test(line)) continue;

      if (['.ts', '.tsx'].includes(extname(file))) {
        const rawMatches = [...line.matchAll(RAW_COLOR_RE)];
        for (const m of rawMatches) {
          const colonBeforeMatch = line.lastIndexOf(':', m.index) > -1;
          const inCSSContext = colonBeforeMatch || /color|background|border|fill|stroke/i.test(line);
          if (inCSSContext) {
            report(file, line, lineNo,
              `Raw color value '${m[0]}' in component source — use a semantic token via var(--*)`);
          }
        }
      }

      if (extname(file) === '.css') {
        if (/^\s*(\/\*|\*|\/\/)/.test(line)) continue;
        const defMatch = line.match(CSS_VAR_DEF_RE);
        if (defMatch) {
          const propName = defMatch[2];
          const valueStart = line.indexOf(':', line.indexOf(propName)) + 1;
          const value = line.slice(valueStart).trim();
          const isPrimitive = PRIMITIVE_PREFIX_RE.test(propName);

          if (!isPrimitive) {
            const rawMatches = [...value.matchAll(RAW_COLOR_RE)];
            for (const m of rawMatches) {
              report(file, line, lineNo,
                `Token '${propName}' in '${relative(ROOT, file)}' contains raw color '${m[0]}' — use var(--colors-*)`);
            }
          }
        }
      }
    }
  }
}

// ─── Audit: component var() references ───────────────────────────────────────

function loadDefinedTokens() {
  const tokenPath = join(ROOT, 'tokens.css');
  const definedTokens = new Set();

  try {
    const tokensSrc = readFileSync(tokenPath, 'utf8');
    for (const line of tokensSrc.split('\n')) {
      const m = line.match(CSS_VAR_DEF_RE);
      if (m) definedTokens.add(m[2]);
    }
  } catch {
    console.error('⚠️  tokens.css not found — skipping source var() audit');
  }

  return definedTokens;
}

function collectLocalTokenDefinitions(src) {
  const localTokens = new Set();

  for (const line of src.split('\n')) {
    const m = line.match(CSS_VAR_DEF_RE);
    if (m) localTokens.add(m[2]);
  }

  return localTokens;
}

/**
 * Ensures every var(--token) in component source exists in tokens.css.
 * Skips component-local custom properties defined in the same file.
 */
function auditSourceVarReferences() {
  const definedTokens = loadDefinedTokens();
  if (definedTokens.size === 0) return;

  const srcDir = join(ROOT, 'src');
  const files = walk(srcDir, ['.ts', '.tsx', '.css'])
    .filter(f => !f.endsWith('.stories.tsx') && !f.endsWith('.stories.ts') && !f.includes('/stories/'));

  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const lines = src.split('\n');
    const localTokens = collectLocalTokenDefinitions(src);

    let inBlockComment = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;

      if (line.includes('/*')) inBlockComment = true;
      if (line.includes('*/')) { inBlockComment = false; continue; }
      if (inBlockComment) continue;
      if (/^\s*\/\//.test(line)) continue;
      if (/^\s*(\/\*|\*|\/\/)/.test(line)) continue;

      let m;
      SOURCE_VAR_RE.lastIndex = 0;
      while ((m = SOURCE_VAR_RE.exec(line)) !== null) {
        const tokenName = m[1];

        // Handbook T1: primitives are raw material — only tokens.css may consume them.
        // Warning while the shadow-composite work (T11) replaces the existing uses.
        if (/^--primitive-/.test(tokenName)) {
          warnings.push({ file: relative(ROOT, file), line: lineNo, message: `consumes primitive '${tokenName}'` });
          continue;
        }
        // --dsn-* are component runtime properties set from JS, never design tokens
        if (/^--dsn-/.test(tokenName)) continue;
        if (localTokens.has(tokenName)) continue;
        if (definedTokens.has(tokenName)) continue;

        report(file, line, lineNo,
          `Source references token '${tokenName}' which does not exist in tokens.css`);
      }
    }
  }
}

// ─── Audit: doc/token drift ──────────────────────────────────────────────────

/**
 * Checks that every var(--token) referenced in doc files actually exists
 * in tokens.css. Skips tokens that appear only in ❌ / "never use" / rejection
 * list contexts — these are intentional documentation of wrong usage.
 */
function auditDocTokenDrift() {
  // 1. Build the set of all defined token names from tokens.css
  const tokenPath = join(ROOT, 'tokens.css');
  let tokensSrc;
  try {
    tokensSrc = readFileSync(tokenPath, 'utf8');
  } catch {
    console.error('⚠️  tokens.css not found — skipping doc drift audit');
    return;
  }

  const definedTokens = new Set();
  for (const line of tokensSrc.split('\n')) {
    const m = line.match(CSS_VAR_DEF_RE);
    if (m) definedTokens.add(m[2]);
  }

  // 2. Collect doc files to scan
  const docFiles = [
    join(ROOT, 'AI.md'),
    join(ROOT, 'AI-short.md'),
    join(ROOT, 'AGENTS.md'),
  ];

  const specsDir = join(ROOT, 'specs');
  try {
    docFiles.push(...walk(specsDir, ['.md']));
  } catch {
    // specs/ doesn't exist — skip
  }

  // 3. Lines that signal intentional "wrong usage" documentation.
  // Any var() on these lines is documenting what NOT to do — skip them.
  const REJECTION_LINE_RE = /❌|✗|never use|wrong|don't|do not|fabricated|does not exist|avoid|incorrect/i;

  for (const file of docFiles) {
    let src;
    try {
      src = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;

      // Skip rejection-list / "never use" lines
      if (REJECTION_LINE_RE.test(line)) continue;

      // Skip markdown comment lines
      if (/^\s*<!--/.test(line)) continue;

      let m;
      DOC_VAR_RE.lastIndex = 0;
      while ((m = DOC_VAR_RE.exec(line)) !== null) {
        const tokenName = m[1];

        // Skip primitive tokens — docs are allowed to reference them
        // in explanatory text even though components shouldn't use them
        if (/^--primitive-/.test(tokenName)) continue;

        // Skip generic placeholders used in naming convention examples
        if (tokenName === '--token-name') continue;

        if (!definedTokens.has(tokenName)) {
          report(file, line, lineNo,
            `Doc references token '${tokenName}' which does not exist in tokens.css`);
        }
      }
    }
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────

console.log('🔍 DS-Nagarro token audit\n');

auditTokensCSS();
auditSourceFiles();
auditSourceVarReferences();
auditDocTokenDrift();

if (warnings.length) {
  console.log(`⚠️  ${warnings.length} warning${warnings.length === 1 ? '' : 's'} (handbook T1 — primitives consumed in components; not failing yet):`);
  if (VERBOSE) for (const w of warnings) console.log(`    ${w.file}:${w.line} ${w.message}`);
  else console.log(`    ${new Set(warnings.map(w => w.file)).size} files — run with --verbose to list them\n`);
}

if (violations.length === 0) {
  console.log('✅ No token violations found\n');
  process.exit(0);
} else {
  console.log(`❌ ${violations.length} violation${violations.length === 1 ? '' : 's'} found:\n`);

  const byFile = {};
  for (const v of violations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  for (const [file, vs] of Object.entries(byFile)) {
    console.log(`  ${file}`);
    for (const v of vs) {
      console.log(`    line ${v.line}: ${v.message}`);
      if (VERBOSE) console.log(`    ↳ ${v.source}`);
    }
    console.log();
  }

  console.log('Fix: verify token names against tokens.css before using in docs or components.\n');
  process.exit(1);
}
