# Template Readiness — Design

**Date:** 2026-08-08
**Status:** Approved (user pre-authorized execution of both this and the smart-composition spec)

## Problem

~200 new template modules arrive next week ("same contract, same master"). Today the
system cannot absorb them safely:

1. **Registration is manual** — 3 hand-edits per module in `js/templates/index.js`
   (510 lines, imports + array + banner comments). 200 modules = ~400 edits in one file.
2. **Nothing validates a module.** A missing `role`/`capacity`/`slots` silently degrades;
   an unknown `role` scores 0 in `template-scoring.js` (`ROLE_AFFINITY`) and the template
   is **never offered** to the engine; unmapped roles collapse into the "Other" category
   on the Templates page (`ROLE_CATEGORY`).
3. **`_CONTRACT.md` documents the dead v1 format** (per-module `css`, `figmaNode`,
   `archetype`) — 200 authors would build against the wrong spec.
4. **The editor's "generate slide" prompt is already over the 32k CLI cap** at 229
   templates (`buildSlideGenerationPrompt`, measured 45.8k chars) — silently broken now,
   ~85k at 429.
5. **Dark-safe audit is all-or-nothing** (`tools/audit-dark-mode.mjs` rewrites
   `js/dark-safe.json` wholesale, no per-template mode); unlisted templates never render
   dark, and nothing detects staleness.
6. **The Templates page mounts every template as a live 1920×1080 stage** at load —
   ~1.7s of main-thread churn and 429 ResizeObservers at scale.

## Goal

Next week the user drops 200 module files into `js/templates/`, runs one command, and
gets a per-template pass/fail report; passing templates are registered, categorized,
scoreable, auditable, and browsable with no hand-edits to shared files.

## Design

### 1. Generated registry

- `tools/generate-template-index.mjs` scans `js/templates/*.js` (excluding `_*` and
  `index.js`), imports each module, sorts by family then name, and **writes
  `js/templates/index.js`** (with a "GENERATED — do not edit; run npm run templates:index"
  header). Output stays committed (browser loads it as a plain ES module — no build step
  at runtime).
- Preserve the existing public exports exactly: `modules`, `allTemplates`, `templates`,
  `getTemplate`, `findTemplate` (if present), `installTemplateStyles`. `getTemplate`'s
  error drops the full name dump (names count instead).
- npm scripts: `templates:index` (regenerate), and `templates:check` = index + validate.

### 2. Contract validator

`tools/validate-templates.mjs` + `test/template-contract.test.js` (the test enforces the
same invariants over `allTemplates`, so `npm test` also guards them):

- Required per module: `name` (`family/slug`, unique, matching its `family`), `family`,
  `role`, `shape`, `media` (string, may be empty), `capacity` `{items,min,max}` with
  `min <= items <= max`, `slots` object (known keys only), `theme`, `description`, `use`,
  non-empty `schema` object, non-empty `example` object, `render` function.
- **Reachability checks (the anti-silent-degradation rule):** `role` must appear in
  `ROLE_CATEGORY` (template-service) AND in at least one `ROLE_AFFINITY` list
  (template-scoring); `shape` must be in a new exported `KNOWN_SHAPES` set in
  template-scoring.js (seeded with the 46 shapes in use; scoring itself is unchanged).
  Violation = error naming the exact file and table to extend.
- Schema descriptions must classify under the existing field-kind rules (reuse the logic
  `test/field-kind.test.js` exercises).
- Dark-safe coverage: warn (not fail) listing templates absent from `js/dark-safe.json`,
  with the command to fix.
- Output: per-template PASS/FAIL table + summary; exit 1 only on errors. `--only a,b`
  filters.

### 3. Dark-safe audit: incremental

`tools/audit-dark-mode.mjs` gains `--only name1,name2` and `--missing` (only templates
not yet in dark-safe.json); filtered runs **merge** into `dark-safe.json` instead of
rewriting it; `total` recomputed from the file content. `process.exit(1)` only under
`--strict`. Full-run behavior unchanged.

### 4. Fix the over-cap editor prompt

`buildSlideGenerationPrompt` (claude-cli-provider.js) gets the same per-template budget
treatment `buildSlidePlanPrompt` already has: fixed-text measurement, per-template char
allowance with a floor, clipped schema descriptions. Extend `test/prompt-budget.test.js`
to cover this prompt at 4× library size (same pattern as the existing guard).

### 5. Templates page at scale

- Lazy-mount stages with an IntersectionObserver: cards render immediately with header +
  placeholder; the live 1920×1080 stage mounts when the card first approaches the
  viewport (stays mounted after). ResizeObserver attaches at mount time.
- Add a **family** filter row alongside categories; search haystack gains role + family.
- No API pagination (single-fetch design stands; the projection is already served once).

### 6. Documentation

- **Rewrite `js/templates/_CONTRACT.md`** to the v2 reality: actual field list,
  `v2f-*`/primitives styling rules (no per-module `css`), the taxonomy rule ("a new role
  or shape must be added to ROLE_CATEGORY / ROLE_AFFINITY / KNOWN_SHAPES — the validator
  tells you"), and the onboarding workflow:
  `drop files → npm run templates:check → fix reds → node tools/audit-dark-mode.mjs --missing → commit`.
- CLAUDE.md / README: replace hardcoded "229" with registry-derived phrasing.
- CSS guidance (not tooling): new templates reuse `v2f-*` primitives; a genuinely new
  family adds a `/* ---- <family> ---- */` section at the end of `css/primitives.css`.
  (Splitting the stylesheet is deliberately out of scope — one file, appended sections,
  no build step.)

## Out of scope

- Changing scoring weights/affinities themselves (Project B territory).
- API pagination, stylesheet splitting, second Master Template support.

## Acceptance

A synthetic "new family" fixture (2-3 modules, one deliberately broken: unknown role,
missing capacity) exercises the pipeline: `templates:check` registers the good ones,
fails the broken one with actionable messages; the Templates page lazy-mounts; the
editor generate-slide prompt stays under budget at 4× library; dark-safe `--missing`
audits only the fixtures and merges. Fixtures removed after the test (not committed to
the library).
