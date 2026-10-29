# Template Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 200 new template modules can be dropped into `js/templates/`, registered, validated, audited, and browsed with one command and zero hand-edits to shared files.

**Architecture:** A generator rewrites the manual registry from the folder contents; a validator (tool + test) enforces the module contract and refuses silent scoring degradation; the dark-safe audit becomes incremental; the one prompt that ignores the 32k budget gets the existing budget treatment; the Templates page mounts stages on scroll instead of all at once. Spec: `docs/superpowers/specs/2026-08-08-template-readiness-design.md`.

**Tech Stack:** Node 20+ ESM, `node --test`, Playwright (audits only), no new dependencies.

## Global Constraints

- `js/templates/index.js` is loaded by the BROWSER as a plain ES module — the generated registry must remain a static file with static imports, committed to git. No runtime fs, no build step.
- Public registry exports must not change shape: `modules`, `allTemplates`, `templates`, `getTemplate(name)`, `installTemplateStyles(doc)`.
- The Claude CLI prompt cap is `MAX_PROMPT_CHARS = 32_000` (`product/infrastructure/ai/claude-cli-provider.js`). Budgeted prompts use the existing pattern: `BUDGET = 31_000`, measure fixed text, per-template allowance with a 40-char floor (see `buildSlidePlanPrompt`, ~line 527).
- The Templates page must NOT use IntersectionObserver — a comment at `product/ui/templates.js:225-229` records that its callbacks are throttled/suppressed in hidden or embedded contexts and left cards permanently blank. Lazy mounting must be scroll-position-driven and deterministic.
- Unknown role/shape must be a LOUD validator error naming the exact table to extend — never silent degradation.
- `npm test` = `node --test test/*.test.js`; suite currently 232 green; keep it green and pristine.
- Restart `npm start` before trusting any manual verification (module cache gotcha).

---

### Task 1: Generated registry

**Files:**
- Create: `tools/generate-template-index.mjs`
- Modify: `js/templates/index.js` (regenerated output), `package.json` (scripts)
- Test: `test/template-registry.test.js`

**Interfaces:**
- Produces: `npm run templates:index` regenerates `js/templates/index.js`; the file keeps exports `modules`, `allTemplates`, `templates`, `getTemplate`, `installTemplateStyles` with today's exact semantics (getTemplate's error message becomes `Unknown template: "<name>" (<N> registered).`). Later tasks rely on `npm run templates:check` = index + validate (script added in Task 2).

- [ ] **Step 1: Write the failing test**

```js
// test/template-registry.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

test("the registry is generated and covers every module file", async () => {
  const src = await readFile("js/templates/index.js", "utf8");
  assert.match(src, /GENERATED — do not edit/, "index.js must carry the generated header");
  const files = (await readdir("js/templates")).filter(
    (f) => f.endsWith(".js") && f !== "index.js" && !f.startsWith("_")
  );
  for (const f of files) {
    assert.ok(src.includes(`./${f}`), `module file ${f} is not registered — run npm run templates:index`);
  }
});

test("registry exports keep their contract", async () => {
  const { modules, allTemplates, templates, getTemplate } = await import("../js/templates/index.js");
  assert.ok(Array.isArray(modules) && modules.length > 200);
  assert.equal(allTemplates, modules);
  assert.equal(Object.keys(templates).length, modules.length, "duplicate template names");
  assert.equal(getTemplate(modules[0].name), modules[0]);
  assert.throws(() => getTemplate("nope/nope"), /Unknown template/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/template-registry.test.js`
Expected: FAIL — no generated header in the hand-written index.js.

- [ ] **Step 3: Write the generator**

```js
// tools/generate-template-index.mjs
// Regenerates js/templates/index.js from the folder contents. The output is a
// static ES module (the browser imports it directly — no build step), so this
// runs at authoring time and the result is committed.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = fileURLToPath(new URL("../js/templates/", import.meta.url));
const files = (await readdir(DIR))
  .filter((f) => f.endsWith(".js") && f !== "index.js" && !f.startsWith("_"))
  .sort();

// Import each module to read its declared name/family — the registry is
// ordered by family then name so diffs stay reviewable.
const entries = [];
for (const file of files) {
  const mod = (await import(pathToFileURL(DIR + file))).default;
  if (!mod?.name) {
    console.error(`SKIP ${file}: no default export with a name — fix the module first.`);
    process.exitCode = 1;
    continue;
  }
  const ident = file.replace(/\.js$/, "").replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  entries.push({ file, ident, name: mod.name, family: mod.family || "core" });
}
entries.sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name));

const byFamily = new Map();
for (const e of entries) {
  if (!byFamily.has(e.family)) byFamily.set(e.family, []);
  byFamily.get(e.family).push(e);
}

const lines = [];
lines.push("// =============================================================================");
lines.push("// Template registry (v2). GENERATED — do not edit; run npm run templates:index.");
lines.push(`// ${entries.length} modules. See _CONTRACT.md for the module shape.`);
lines.push("// =============================================================================");
lines.push("");
for (const e of entries) lines.push(`import ${e.ident} from "./${e.file}";`);
lines.push("");
lines.push("export const modules = [");
for (const [family, list] of byFamily) {
  lines.push(`  // ---- ${family} (${list.length}) ----`);
  for (const e of list) lines.push(`  ${e.ident},`);
}
lines.push("];");
lines.push("");
lines.push("export const allTemplates = modules;");
lines.push("export const templates = Object.fromEntries(modules.map((m) => [m.name, m]));");
lines.push("");
lines.push("export function getTemplate(name) {");
lines.push("  const t = templates[name];");
lines.push("  if (!t) throw new Error(`Unknown template: \\\"${name}\\\" (${modules.length} registered).`);");
lines.push("  return t;");
lines.push("}");
lines.push("");
lines.push("let installed = false;");
lines.push("export function installTemplateStyles(doc = document) {");
lines.push("  if (installed) return;");
lines.push("  installed = true;");
lines.push("  const style = doc.createElement(\"style\");");
lines.push("  style.id = \"template-styles\";");
lines.push("  style.textContent = modules.map((m) => m.css || \"\").join(\"\\n\\n\");");
lines.push("  doc.head.appendChild(style);");
lines.push("}");
lines.push("");

await writeFile(DIR + "index.js", lines.join("\n"));
console.log(`Wrote js/templates/index.js: ${entries.length} modules, ${byFamily.size} families.`);
```

Before finalizing, check whether any file exports `findTemplate` from index.js (`grep -rn "findTemplate" js/ product/ | grep "templates/index"`); if some consumer imports it from the registry, keep that export too (today `findTemplate` lives in `product/domain/slide-content.js` — verify, don't assume).

Add to `package.json` scripts: `"templates:index": "node tools/generate-template-index.mjs"`.

- [ ] **Step 4: Regenerate and verify**

Run: `npm run templates:index` then `node --test test/template-registry.test.js` (PASS) then `npm test` (232+2 green — the whole suite exercises the registry heavily; any regression means the generator dropped or renamed an export).
Also `git diff --stat js/templates/index.js` — the diff should be pure reordering + header; NO module additions/removals (currently 229 both before and after).

- [ ] **Step 5: Commit**

```bash
git add tools/generate-template-index.mjs js/templates/index.js package.json test/template-registry.test.js
git commit -m "feat: generated template registry — drop a module file in, run one command"
```

---

### Task 2: Contract validator

**Files:**
- Create: `tools/validate-templates.mjs`
- Modify: `product/domain/template-scoring.js` (add `KNOWN_SHAPES` export), `package.json` (script)
- Test: `test/template-contract.test.js`

**Interfaces:**
- Consumes: `allTemplates` (Task 1 registry), `ROLE_AFFINITY` (already exported? verify — if module-private, export it), `ROLE_CATEGORY` from `product/domain/template-service.js` (verify export; export if private).
- Produces: `validateModule(mod, context) → string[]` (error messages, empty = valid) exported from `tools/validate-templates.mjs` for tests; CLI prints per-template PASS/FAIL and exits 1 on errors; `--only a,b` filters. `npm run templates:check` = `templates:index && validate`. `KNOWN_SHAPES: Set<string>` exported from template-scoring.js.

- [ ] **Step 1: Write the failing test**

```js
// test/template-contract.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../tools/validate-templates.mjs";
import { allTemplates } from "../js/templates/index.js";
import { KNOWN_SHAPES } from "../product/domain/template-scoring.js";

test("every registered template passes the contract", () => {
  const failures = [];
  for (const t of allTemplates) {
    const errors = validateModule(t, { names: allTemplates.map((x) => x.name) });
    if (errors.length) failures.push(`${t.name}: ${errors.join("; ")}`);
  }
  assert.deepEqual(failures, []);
});

test("a module with an unknown role fails loudly, naming the tables to extend", () => {
  const bad = { ...allTemplates[0], name: "core/fake-test", role: "holographic" };
  const errors = validateModule(bad, { names: [] });
  assert.ok(errors.some((e) => /ROLE_CATEGORY/.test(e) && /ROLE_AFFINITY/.test(e)), errors.join("; "));
});

test("a module missing capacity fails", () => {
  const bad = { ...allTemplates[0], name: "core/fake-test2", capacity: undefined };
  const errors = validateModule(bad, { names: [] });
  assert.ok(errors.some((e) => /capacity/.test(e)));
});

test("an unknown shape fails and KNOWN_SHAPES covers the live library", () => {
  for (const t of allTemplates) assert.ok(KNOWN_SHAPES.has(t.shape), `${t.name} shape "${t.shape}" not in KNOWN_SHAPES`);
  const bad = { ...allTemplates[0], name: "core/fake-test3", shape: "dodecahedron" };
  assert.ok(validateModule(bad, { names: [] }).some((e) => /KNOWN_SHAPES/.test(e)));
});
```

- [ ] **Step 2: Run to verify it fails** — `node --test test/template-contract.test.js`: FAIL (no validateModule, no KNOWN_SHAPES).

- [ ] **Step 3: Implement**

In `product/domain/template-scoring.js`, derive and export the shape vocabulary near the affinity tables (seed from the live library so the set can't drift):

```js
/** Every shape the library declares. The validator refuses shapes outside this
 *  set — scoring ignores unknown shapes SILENTLY (they just never earn the
 *  shape bonus), which is exactly the degradation new authors must not hit.
 *  Extending: add the shape here (and to SHAPE_AFFINITY if it should score). */
export const KNOWN_SHAPES = new Set([
  /* seeded with the 46 shapes in use — generate the literal list with:
     node -e "import('./js/templates/index.js').then(m => console.log([...new Set(m.allTemplates.map(t=>t.shape))].sort()))" */
]);
```

(Write the actual 46 strings into the literal — no runtime derivation from allTemplates, or the check would be circular.)

Verify `ROLE_AFFINITY` is exported from template-scoring.js and `ROLE_CATEGORY` from `product/domain/template-service.js`; add `export` if module-private (check both files first — the recon says ROLE_AFFINITY is at template-scoring.js:26-38, ROLE_CATEGORY at template-service.js:64-94).

```js
// tools/validate-templates.mjs
// Per-module contract validation. Run via npm run templates:check.
// Exports validateModule for the test suite.
import { allTemplates } from "../js/templates/index.js";
import { ROLE_AFFINITY, KNOWN_SHAPES } from "../product/domain/template-scoring.js";
import { ROLE_CATEGORY } from "../product/domain/template-service.js";
import darkSafe from "../js/dark-safe.json" with { type: "json" };

const KNOWN_ROLES_CATEGORY = new Set(Object.keys(ROLE_CATEGORY));
const KNOWN_ROLES_AFFINITY = new Set(Object.values(ROLE_AFFINITY).flat());
const SLOT_KEYS = new Set(["images", "titles", "subtitles", "body", "stats", "icons", "list"]);

export function validateModule(mod, { names = [] } = {}) {
  const errors = [];
  const err = (m) => errors.push(m);

  if (typeof mod?.name !== "string" || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(mod.name)) {
    err(`name must be "family/slug" (got ${JSON.stringify(mod?.name)})`);
    return errors; // nothing else is meaningful without a name
  }
  if (typeof mod.family !== "string" || !mod.family) err("family is required");
  else if (!mod.name.startsWith(`${mod.family}/`)) err(`name "${mod.name}" does not match family "${mod.family}"`);
  if (names.filter((n) => n === mod.name).length > 1) err(`duplicate name "${mod.name}"`);

  if (typeof mod.role !== "string" || !mod.role) err("role is required");
  else {
    const inCategory = KNOWN_ROLES_CATEGORY.has(mod.role);
    const inAffinity = KNOWN_ROLES_AFFINITY.has(mod.role);
    if (!inCategory || !inAffinity) {
      err(`role "${mod.role}" is unknown to the engine — add it to ` +
        `${inCategory ? "" : "ROLE_CATEGORY (product/domain/template-service.js)"}` +
        `${!inCategory && !inAffinity ? " and " : ""}` +
        `${inAffinity ? "" : "ROLE_AFFINITY (product/domain/template-scoring.js)"}` +
        `, or the template will never be offered/categorized`);
    }
  }

  if (typeof mod.shape !== "string" || !mod.shape) err("shape is required");
  else if (!KNOWN_SHAPES.has(mod.shape)) {
    err(`shape "${mod.shape}" is not in KNOWN_SHAPES (product/domain/template-scoring.js) — add it there (and to SHAPE_AFFINITY if it should score)`);
  }

  if (typeof mod.media !== "string") err("media must be a string (may be empty)");
  const cap = mod.capacity;
  if (!cap || typeof cap !== "object") err("capacity {items,min,max} is required");
  else {
    for (const k of ["items", "min", "max"]) {
      if (!Number.isInteger(cap[k]) || cap[k] < 0) err(`capacity.${k} must be a non-negative integer`);
    }
    if (Number.isInteger(cap.min) && Number.isInteger(cap.items) && Number.isInteger(cap.max) &&
        !(cap.min <= cap.items && cap.items <= cap.max)) {
      err(`capacity must satisfy min <= items <= max (got ${cap.min}/${cap.items}/${cap.max})`);
    }
  }
  if (!mod.slots || typeof mod.slots !== "object") err("slots object is required");
  else {
    for (const k of Object.keys(mod.slots)) {
      if (!SLOT_KEYS.has(k)) err(`slots.${k} is not a known slot (${[...SLOT_KEYS].join(", ")})`);
      else if (!Number.isInteger(mod.slots[k]) || mod.slots[k] < 0) err(`slots.${k} must be a non-negative integer`);
    }
  }

  if (typeof mod.theme !== "string") err("theme is required");
  if (typeof mod.description !== "string" || !mod.description.trim()) err("description is required");
  if (typeof mod.use !== "string" || !mod.use.trim()) err("use is required");
  if (!mod.schema || typeof mod.schema !== "object" || !Object.keys(mod.schema).length) err("non-empty schema is required");
  if (!mod.example || typeof mod.example !== "object" || !Object.keys(mod.example).length) err("non-empty example is required");
  if (typeof mod.render !== "function") err("render() function is required");

  return errors;
}

// ---- CLI ----
const isMain = import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1] || "").href;
if (isMain) {
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
  const pool = only ? allTemplates.filter((t) => only.includes(t.name)) : allTemplates;
  const names = pool.map((t) => t.name);
  let failed = 0;
  for (const t of pool) {
    const errors = validateModule(t, { names });
    if (errors.length) {
      failed++;
      console.log(`FAIL  ${t.name}`);
      for (const e of errors) console.log(`      - ${e}`);
    }
  }
  const missing = pool.filter((t) => !darkSafe.safe?.includes(t.name) &&
    !darkSafe.unsafe?.some?.((u) => u.name === t.name)).map((t) => t.name);
  if (missing.length) {
    console.log(`\nWARN: ${missing.length} template(s) not yet dark-audited — run:`);
    console.log(`      node tools/audit-dark-mode.mjs --missing   (studio must be running)`);
  }
  console.log(`\n${pool.length - failed}/${pool.length} templates pass.`);
  if (failed) process.exit(1);
}
```

Add scripts: `"templates:validate": "node tools/validate-templates.mjs"`, `"templates:check": "npm run templates:index && npm run templates:validate"`.

- [ ] **Step 4: Run** — `node --test test/template-contract.test.js` → PASS (if any live template fails a rule, the rule is wrong or the template is genuinely broken — investigate the specific template before loosening; loosen only with a comment naming the offender). Then `npm run templates:check` → all pass. Then `npm test`.

- [ ] **Step 5: Commit**

```bash
git add tools/validate-templates.mjs product/domain/template-scoring.js product/domain/template-service.js package.json test/template-contract.test.js
git commit -m "feat: template contract validator — unknown roles/shapes fail loudly"
```

---

### Task 3: Incremental dark-safe audit

**Files:**
- Modify: `tools/audit-dark-mode.mjs`
- Create: `tools/lib/dark-safe-merge.mjs`
- Test: `test/dark-safe-merge.test.js`

**Interfaces:**
- Produces: `mergeDarkSafe(existing, { safe, unsafe, audited }) → manifest` (pure, exported from tools/lib/dark-safe-merge.mjs); audit flags `--only=a,b`, `--missing`, `--strict`; filtered runs merge instead of rewrite; exit 1 only under `--strict`.

- [ ] **Step 1: Write the failing test**

```js
// test/dark-safe-merge.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { mergeDarkSafe } from "../tools/lib/dark-safe-merge.mjs";

const existing = {
  generatedBy: "tools/audit-dark-mode.mjs", contrastFloor: 3, total: 3,
  safe: ["a/one", "a/two"], unsafe: [{ name: "a/three", reason: "low contrast" }],
};

test("a filtered run only touches the audited names", () => {
  const out = mergeDarkSafe(existing, {
    safe: ["a/three"], unsafe: [], audited: ["a/three"],
  });
  assert.deepEqual(out.safe, ["a/one", "a/three", "a/two"]); // sorted, three promoted
  assert.deepEqual(out.unsafe, []);
  assert.equal(out.total, 3);
});

test("a previously safe template demoted by a re-audit moves to unsafe", () => {
  const out = mergeDarkSafe(existing, {
    safe: [], unsafe: [{ name: "a/one", reason: "regressed" }], audited: ["a/one"],
  });
  assert.ok(!out.safe.includes("a/one"));
  assert.ok(out.unsafe.some((u) => u.name === "a/one"));
});

test("unaudited names are untouched", () => {
  const out = mergeDarkSafe(existing, { safe: [], unsafe: [], audited: [] });
  assert.deepEqual(out.safe, existing.safe);
});
```

- [ ] **Step 2: Run to verify it fails** — module doesn't exist.

- [ ] **Step 3: Implement**

```js
// tools/lib/dark-safe-merge.mjs
/** Merges a (possibly filtered) audit run into the existing manifest.
 *  Only names in `audited` change state; everything else is preserved. */
export function mergeDarkSafe(existing, { safe, unsafe, audited }) {
  const auditedSet = new Set(audited);
  const keptSafe = (existing.safe || []).filter((n) => !auditedSet.has(n));
  const keptUnsafe = (existing.unsafe || []).filter((u) => !auditedSet.has(u.name));
  const outSafe = [...new Set([...keptSafe, ...safe])].sort();
  const outUnsafe = [...keptUnsafe, ...unsafe].sort((a, b) => a.name.localeCompare(b.name));
  return {
    ...existing,
    total: outSafe.length + outUnsafe.length,
    safe: outSafe,
    unsafe: outUnsafe,
  };
}
```

In `tools/audit-dark-mode.mjs`:
- Parse `--only=<csv>` and `--missing` next to the existing `--theme=light` parsing (~line 32). Build the audit pool: `--only` → matching names; `--missing` → templates absent from both `safe` and `unsafe` of the current `js/dark-safe.json`; neither → all (today's behavior).
- Iterate the pool instead of `allTemplates` in the measure loop (~line 143).
- At the write site (~line 157): when the pool is filtered, read the existing manifest and write `mergeDarkSafe(existing, { safe, unsafe, audited: pool.map(t => t.name) })`; a full run writes wholesale as today (still through mergeDarkSafe with `audited` = all names, for one code path).
- Replace the unconditional `process.exit(1)` on unsafe (~line 175) with `if (unsafe.length && process.argv.includes("--strict")) process.exit(1);`.
- Update the header comment documenting the flags.

- [ ] **Step 4: Run** — merge tests PASS; `npm test` green. (A live audit run needs the studio + Playwright — not part of the suite; verify the flag parsing by `node tools/audit-dark-mode.mjs --only=core/cover-single` against a running server ONCE if the server is up, else note it for the acceptance task.)

- [ ] **Step 5: Commit**

```bash
git add tools/audit-dark-mode.mjs tools/lib/dark-safe-merge.mjs test/dark-safe-merge.test.js
git commit -m "feat: incremental dark-safe audit — --only/--missing merge instead of rewrite"
```

---

### Task 4: Budget the editor's generate-slide prompt

**Files:**
- Modify: `product/infrastructure/ai/claude-cli-provider.js` (`buildSlideGenerationPrompt`, ~line 763)
- Test: `test/prompt-budget.test.js` (extend)

**Interfaces:**
- Consumes: the existing budget pattern from `buildSlidePlanPrompt` (~line 527): `BUDGET = 31_000`, `fixed = assemble("").length`, `perTemplate = Math.max(40, floor((BUDGET - fixed) / templates.length) - 1)`, clip each line.
- Produces: `buildSlideGenerationPrompt(intent, templates)` never exceeds `MAX_PROMPT_CHARS`; exported for the test (add `export` if module-private — check how prompt-budget.test.js imports the other builders and match).

- [ ] **Step 1: Write the failing test**

Read `test/prompt-budget.test.js` first and match its import/measure style exactly. Add:

```js
test("the editor generate-slide prompt stays under the cap at 4x library size", () => {
  const quadrupled = [];
  for (let copy = 0; copy < 4; copy++) {
    for (const t of allTemplates) quadrupled.push({ ...t, name: `${t.name}-v${copy}` });
  }
  const prompt = buildSlideGenerationPrompt("A slide about quarterly results", quadrupled);
  assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
});

test("the editor generate-slide prompt is under the cap TODAY (regression: it was 45.8k at 229 templates)", () => {
  const prompt = buildSlideGenerationPrompt("A slide about quarterly results", allTemplates);
  assert.ok(prompt.length < CAP, `prompt is ${prompt.length}, cap ${CAP}`);
});
```

(`CAP`/`allTemplates` names per the existing file's conventions; export `buildSlideGenerationPrompt` the same way the file's other tested builders are exported.)

- [ ] **Step 2: Run to verify it fails** — the today-test FAILS at ~45.8k chars. (If it passes, STOP — the premise is wrong; re-measure and report instead of "fixing".)

- [ ] **Step 3: Implement**

Restructure `buildSlideGenerationPrompt` on the `buildSlidePlanPrompt` pattern:

```js
function buildSlideGenerationPrompt(intent, templates) {
  const line = (t) =>
    `- "${t.name}": ${Object.entries(t.schema || {}).map(([f, d]) => `${f} (${d})`).join("; ")}`;
  const assemble = (catalog) => [
    "You are choosing and drafting ONE slide for a business presentation.",
    "",
    `What this slide should communicate: "${intent}"`,
    "",
    "Available templates (choose exactly one by its exact name):",
    catalog,
    "",
    // ... keep the existing Rules/response-shape lines verbatim ...
  ].join("\n");

  const BUDGET = 31_000;
  const fixed = assemble("").length;
  const perTemplate = Math.max(40, Math.floor((BUDGET - fixed) / Math.max(1, templates.length)) - 1);
  const clip = (l) => (l.length > perTemplate ? `${l.slice(0, perTemplate - 1)}…` : l);
  return assemble(templates.map((t) => clip(line(t))).join("\n"));
}
```

(Keep the existing rules text byte-for-byte — only the catalog assembly changes.)

- [ ] **Step 4: Run** — both new tests PASS; whole suite green.

- [ ] **Step 5: Commit**

```bash
git add product/infrastructure/ai/claude-cli-provider.js test/prompt-budget.test.js
git commit -m "fix: budget the editor generate-slide prompt (was 45.8k against a 32k cap)"
```

---

### Task 5: Templates page at 400+ — scroll-driven stage mounting + family facet

**Files:**
- Modify: `product/ui/templates.js`, `product/ui/templates.html` (family filter row markup if the chips are static; check — chips are built dynamically at templates.js:95, so likely JS-only)

**Interfaces:**
- Consumes: `buildStagesInChunks` / `renderStage` / `thumbObserver` (templates.js:225-283), `state.cards`.
- Produces: stages mount on demand as the user scrolls; family chips filter alongside categories; search matches name+category+description+role+family.

- [ ] **Step 1: Implement scroll-driven mounting**

Constraint (recorded in the file at :225-229): NO IntersectionObserver. Replace the time-driven "build everything in chunks" with demand-driven chunks, deterministic:

```js
/* Stages mount on demand: a rAF-throttled scroll/resize handler builds the
   next chunk whenever an unbuilt, visible card is within one viewport-height
   of the fold. Deterministic (no IntersectionObserver — its callbacks are
   throttled or suppressed in hidden/embedded contexts, which left cards
   permanently blank). The first two chunks build immediately so the page
   never opens empty. */
const BUILD_AHEAD_PX = () => window.innerHeight;
let buildScheduled = false;

function unbuiltVisibleCards() {
  return state.cards.filter((c) => !c.el.hidden && !c.frame.querySelector(".stage"));
}

function buildNearbyStages() {
  buildScheduled = false;
  const pending = unbuiltVisibleCards();
  if (!pending.length) return;
  const limit = window.innerHeight + BUILD_AHEAD_PX();
  const near = pending.filter((c) => c.el.getBoundingClientRect().top < limit).slice(0, CHUNK_SIZE);
  if (!near.length) return;
  for (const card of near) mountStage(card);       // extracted from buildStagesInChunks's body
  if (near.length === CHUNK_SIZE) scheduleBuild(); // keep going while there's close work
}

function scheduleBuild() {
  if (buildScheduled) return;
  buildScheduled = true;
  requestAnimationFrame(buildNearbyStages);
}

window.addEventListener("scroll", scheduleBuild, { passive: true });
window.addEventListener("resize", scheduleBuild);
```

- Extract the per-card body of `buildStagesInChunks` (try/renderStage/catch/scale) into `mountStage(card)`; delete the old time-driven loop; call `scheduleBuild()` after initial render AND after every filter/search change (filters unhide cards that may need mounting).
- Keep `thumbObserver` attaching at mount time (it currently observes at card creation — check and move the `observe` call to `mountStage` if needed so unmounted cards cost nothing).

- [ ] **Step 2: Family facet + search fields**

- Build a second chip row from `[...new Set(items.map((i) => i.family))]` (the projection must include `family` — check `product/domain/template-service.js:108-127` and add `family` + `role` to the projection if absent).
- Active filters compose: `visible = matchesCategory && matchesFamily && matchesSearch`.
- Extend the search haystack (templates.js:219) to `name + category + description + role + family`, lowercased.

- [ ] **Step 3: Verify in the browser**

Start the server (`npm start` or worktree port), open `/templates.html`: page paints immediately; scrolling mounts stages progressively (watch the DOM in devtools — `.stage` count grows with scroll); family chips filter; search "quote" and a family name both narrow correctly; `test/pages.smoke.test.js` still passes (`node --test test/pages.smoke.test.js` — it asserts `lib-count`; check whether it waits for stages and adjust ONLY its wait strategy if lazy mounting breaks it, never the count assertion).

- [ ] **Step 4: Commit**

```bash
git add product/ui/templates.js product/ui/templates.html product/domain/template-service.js
git commit -m "feat: templates page scales — scroll-driven stage mounting + family facet"
```

---

### Task 6: Rewrite the contract + onboarding docs

**Files:**
- Modify: `js/templates/_CONTRACT.md` (full rewrite), `CLAUDE.md` (hardcoded 229s), `README.md` (229s), `docs/CHANGELOG.md`

- [ ] **Step 1: Rewrite `_CONTRACT.md`**

Replace the v1 content with the v2 reality. Structure:

1. **Module shape** — the actual field list with one-line semantics and a complete minimal example module (copy a real small one, e.g. `core-divider-single.js`, abridged): `name` ("family/slug", must match filename `family-slug.js`), `family`, `role`, `shape`, `media`, `capacity {items,min,max}`, `slots` (the 7 keys), `theme`, `description`, `use`, `schema` (prose field descriptions — they drive the editor's field kinds), `example` (real renderable content; asset paths must exist), `render(s, ctx)`.
2. **Styling** — modules carry NO css. Reuse `v2f-*` primitives from `css/primitives.css`; a genuinely new family appends a `/* ---- <family> ---- */` section at the END of primitives.css. The `type-*` utilities are historical — don't use them.
3. **Taxonomy rule** — role must exist in `ROLE_CATEGORY` (product/domain/template-service.js) and `ROLE_AFFINITY` (product/domain/template-scoring.js); shape must be in `KNOWN_SHAPES` (template-scoring.js). The validator names exactly what's missing.
4. **Onboarding workflow** (the section the 200-template drop uses):
   ```
   1. Copy module files into js/templates/   (family-slug.js naming)
   2. npm run templates:check                (registers + validates; fix reds)
   3. npm start, then in another terminal:
      node tools/audit-dark-mode.mjs --missing
   4. Open /templates.html and eyeball the new family
   5. Commit js/templates/ + js/dark-safe.json + index.js together
   ```
5. **Do not hand-edit `js/templates/index.js`** — it is generated.

- [ ] **Step 2: Update stale counts**

`grep -rn "229" CLAUDE.md README.md AGENTS.md` — replace each with registry-derived phrasing ("the v2 library", "all registered templates") keeping sentences natural. Do NOT touch `js/dark-safe.json`'s total (Task 3's merge recomputes it).

- [ ] **Step 3: CHANGELOG** — dated entry: generated registry, validator, incremental dark audit, budgeted editor prompt, lazy Templates page, rewritten contract.

- [ ] **Step 4: Commit**

```bash
git add js/templates/_CONTRACT.md CLAUDE.md README.md AGENTS.md docs/CHANGELOG.md
git commit -m "docs: v2 template contract + onboarding workflow for the incoming 200"
```

---

### Task 7: Acceptance — synthetic new-family dry run

**Files:**
- Create (temporarily, deleted before commit): `js/templates/zz-test-alpha.js`, `js/templates/zz-test-beta.js`, `js/templates/zz-test-broken.js`

- [ ] **Step 1: Author fixtures**

`zz-test-alpha.js` / `zz-test-beta.js`: valid modules of family `zz-test` (copy `core-divider-single.js`'s structure, rename to `zz-test/alpha` etc., role/shape from the known sets, trivial render). `zz-test-broken.js`: role `"holographic"`, no capacity.

- [ ] **Step 2: Run the onboarding pipeline exactly as documented**

1. `npm run templates:check` → index regenerates with 232 modules (alpha, beta, broken register); validator FAILS broken with the two expected messages (role tables + capacity) and PASSES the others; exit code 1.
2. Fix nothing; instead confirm the error text names `ROLE_CATEGORY`, `ROLE_AFFINITY`, and `capacity`.
3. Start the server; `node tools/audit-dark-mode.mjs --only=zz-test/alpha,zz-test/beta` → merges exactly 2 entries into dark-safe.json (git diff shows only those + total).
4. Open `/templates.html` → the `zz-test` family chip appears; its stages mount on scroll.
5. `npm test` with fixtures present: template-contract test FAILS on broken (proving the suite guards the library) — expected, documented in the report.

- [ ] **Step 3: Clean up and verify restoration**

Delete the three fixtures; `npm run templates:check` → 229, all pass; `git checkout js/dark-safe.json` (drop the fixture merge); `git status` clean except intended changes; `npm test` fully green.

- [ ] **Step 4: Commit** (only if steps 1-3 revealed fixes; otherwise nothing to commit — record results in the task report)
