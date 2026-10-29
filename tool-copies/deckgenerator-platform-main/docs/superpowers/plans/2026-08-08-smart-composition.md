# Smart Composition + Live Build View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decks compose as planned narratives (analysis → deck plan → enriched choose/write → visual review) with live staged progress in the UI instead of a spinner.

**Architecture:** A `tick()` progress sink (mirroring the existing `note()` warnings sink) threads through composition and persists onto the generation record, which the UI already polls. Two new provider passes (`analyzeOutline`, `planDeck`) run before template choice and steer shortlists, theming, and structure (section dividers). After slides are built, a DOM-measurement review loop (reusing the audit tooling's `window.__mountSlide` capture page) repairs hard defects on the worst slides. Every new pass degrades to today's behavior with a warning. Spec: `docs/superpowers/specs/2026-08-08-smart-composition-design.md`.

**Tech Stack:** Node 20+ ESM, `node --test`, Playwright (already installed; review loop only), Claude CLI provider.

## Global Constraints

- Every new pass is OPTIONAL at runtime: any failure → `note()` warning + pipeline continues exactly as today. Failure-path tests (stub provider) are mandatory per pass.
- Prompt budget: no prompt may exceed `MAX_PROMPT_CHARS = 32_000`; new prompts use measured budgets like the existing passes (`CHOICE_BUDGET`/`IMPORT_BUDGET` pattern in `product/infrastructure/ai/claude-cli-provider.js`).
- Import fidelity contract stands: analysis/plan inform LAYOUT and structure (dividers add structure, never content); imported slide copy is never rewritten by these passes.
- Dark theming stays gated by `DARK_SAFE` (`product/domain/generation-service.js:35-40`); bookends stay forced dark via `themeFor`.
- Progress writes must never fail the build (fire-and-forget, throttled ≥1s).
- The visual review loop measures HARD defects only (overflow, off-canvas, >300px dead band). Verify-your-detector rule (CLAUDE.md): before acting on any measurement, the implementation mirrors thresholds from `tools/audit-dead-space.mjs` / `tools/audit-dark-mode.mjs`, and the acceptance task eyeballs repaired slides.
- Time-box: review loop aborts with a warning at 3 minutes.
- `npm test` green and pristine throughout; restart the server before manual verification.

---

### Task 1: Progress plumbing (core)

**Files:**
- Modify: `product/domain/generation-service.js`, `product/infrastructure/ai/claude-cli-provider.js` (batch callbacks)
- Test: `test/compose-progress.test.js`

**Interfaces:**
- Produces: generation records carry `progress = { stage, detail, done, total, slides: [{n, title, state}], updatedAt }`, `state ∈ pending|analyzing|choosing|writing|reviewing|done|fallback`. `composeSlides(provider, mapping, opts)` accepts `opts.onProgress(patch)`; `#composeInBackground` wires it to a throttled `generationRepository.updateStatus(id, { progress })` (updateStatus already merges any non-immutable field — verified: `GENERATION_IMMUTABLE` is only id/workspaceId/userId/prompt/createdAt).
- `composeDeck` and `composeImportDeck` accept optional `onBatch({ pass, index, total, slideNumbers })` called before each LLM batch; generation-service maps these to progress patches ("Choosing layouts for slides 7–12 of 19").

- [ ] **Step 1: Write the failing test**

```js
// test/compose-progress.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { composeSlides } from "../product/domain/generation-service.js";
import { allTemplates } from "../js/templates/index.js";

const REAL = allTemplates.find((t) => t.name === "core/content-twocol");
const mapping = [
  { slideNumber: 1, title: "Cover", content: { title: "Cover", body: "Sub", notes: "" } },
  { slideNumber: 2, title: "Body", content: { title: "Body", body: ["a", "b"], notes: "" } },
];

test("composition emits staged progress through onProgress", async () => {
  const patches = [];
  const provider = {
    composeImportDeck: async ({ onBatch }) => {
      onBatch?.({ pass: "compose", index: 1, total: 1, slideNumbers: [1, 2] });
      return { rows: [{ source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } }], warnings: [] };
    },
  };
  await composeSlides(provider, mapping, {
    title: "T", origin: "import", onProgress: (p) => patches.push(p),
  });
  const stages = patches.map((p) => p.stage).filter(Boolean);
  assert.ok(stages.includes("choosing"), `stages seen: ${stages}`);
  assert.ok(patches.some((p) => Array.isArray(p.slides)), "per-slide states must be reported");
  const last = patches.at(-1);
  assert.equal(last.stage, "assembling");
});

test("a provider without onBatch support still composes (progress is optional)", async () => {
  const provider = { composeImportDeck: async () => ({ rows: [], warnings: [] }) };
  const slides = await composeSlides(provider, mapping, { title: "T", origin: "import" });
  assert.equal(slides.length, 2); // fallback slides, no crash with no onProgress
});
```

- [ ] **Step 2: Run to verify it fails** — `onProgress` is ignored today.

- [ ] **Step 3: Implement**

In `generation-service.js`:

```js
/** Builds the tick() sink composition threads through. Mirrors note(): callers
 *  that pass nothing get a no-op; emitting can never fail the build. */
function progressSink(onProgress, mapping) {
  const slides = mapping.map((s) => ({ n: s.slideNumber, title: s.title, state: "pending" }));
  const emit = (patch) => {
    try { onProgress?.({ slides, ...patch, updatedAt: new Date().toISOString() }); } catch { /* never fatal */ }
  };
  const setStates = (numbers, state) => {
    for (const s of slides) if (numbers.includes(s.n)) s.state = state;
  };
  return { emit, setStates };
}
```

- `composeSlides(provider, proposedMapping, { …, onProgress })`: create the sink; emit `{ stage: "choosing", detail, done, total }` from the provider's `onBatch` (pass `onBatch` through in the `composeImportDeck`/`composeDeck` call options), set batch slide states `choosing`→`writing`→`done` as rows come back, and emit `{ stage: "assembling" }` just before returning. Fallback slides get state `fallback`.
- In `claude-cli-provider.js`: `composeDeck` and `composeImportDeck` accept `onBatch` in their options object and call it (wrapped in try/catch) before each `runClaude` dispatch with `{ pass: "choose"|"fill"|"compose", index, total, slideNumbers }`. Batches are already assembled before dispatch in both (pass 1/pass 2 loops in composeDeck; the interleaved loop's `dispatch()` in composeImportDeck) — compute `total` where known (composeDeck: `layoutBatches.length` / `batches.length`; composeImportDeck's interleaved loop doesn't know totals up front — pass `total: null` and the sink shows "batch 3" without "of N").
- `#composeInBackground`: build a throttled writer and pass it as `onProgress`:

```js
      let lastWrite = 0;
      const onProgress = (progress) => {
        const now = Date.now();
        if (now - lastWrite < 1000) return;
        lastWrite = now;
        generationRepository.updateStatus(id, { progress }).catch(() => {});
      };
```

Also write one final un-throttled progress (`stage: "done"`) alongside the `approved` status write, and clear stale progress on failure (the `completed`+error write includes `progress: null`).

- [ ] **Step 4: Run** — new tests PASS; whole suite green (notably `test/import-compose.test.js` — the options object grew, defaults must keep old calls working).

- [ ] **Step 5: Commit** — `git commit -m "feat: composition emits staged per-slide progress onto the generation record"`

---

### Task 2: Build timeline UI

**Files:**
- Modify: `product/ui/lib/deck-build.js` (pass `record.progress` to onProgress), `product/ui/home.js` + the home page HTML file that hosts the composer (grep `attachmentChip` / outline markup — same file Task 6 of the import plan touched: `product/ui/index.html`), `product/ui/app.css` (timeline styles), `product/ui/presentations.js` (toast detail line)

**Interfaces:**
- Consumes: `progress` shape from Task 1.
- Produces: during build, the home composer shows a stage timeline + per-slide state strip; the library page toast line shows `stage — detail`.

- [ ] **Step 1: deck-build.js**

In `approveAndWait`'s poll loop (~line 73), extend the callback payload: `onProgress?.({ attempt, elapsedMs: Date.now() - startedAt, progress: record.progress || null });` (records without `progress` pass null — old-server compatibility).

- [ ] **Step 2: Home composer timeline**

Add below the composer (hidden by default) a `#build-timeline` region:

```html
<section id="build-timeline" hidden>
  <ol class="bt-stages">
    <li data-stage="analyzing">Reading the content</li>
    <li data-stage="planning">Planning the deck</li>
    <li data-stage="choosing">Choosing layouts</li>
    <li data-stage="writing">Writing slides</li>
    <li data-stage="reviewing">Reviewing the result</li>
    <li data-stage="assembling">Assembling</li>
  </ol>
  <div class="bt-strip" aria-label="Slide status"></div>
  <p class="bt-detail"></p>
</section>
```

home.js: a `renderBuildProgress(progress)` that (a) marks the `<li>` matching `progress.stage` active and earlier ones done; (b) renders one `.bt-cell` per `progress.slides` entry with `data-state` and `title` attributes; (c) sets `.bt-detail` text from `progress.detail`. Wire it via the `onProgress` option of `approveAndWait` in `reviewOutlineAndBuild` (the shared helper from the import work); show the section on build start, hide on completion/error. When `progress` is null keep today's busy label — that IS the fallback.

Styles in app.css using existing tokens only: stages as a muted list with the active item in text color; `.bt-cell` an ~14px square, `pending` navy-300, `choosing`/`writing`/`analyzing`/`reviewing` mint at 50%, `done` mint, `fallback` navy-500. No new colors, no animations beyond a simple opacity transition.

- [ ] **Step 3: Library page** — in `presentations.js`'s import handler, pass `onProgress` to `importAndWait` (threads to `approveAndWait` — check `importAndWait` forwards options; it does) and update the existing info toast's text node in place: `Importing… ${progress?.stage ? progress.detail || progress.stage : "laying the slides out takes a moment."}` (toast element must persist — reuse the toast node instead of stacking; check `showImportToast` and, if toasts auto-remove on a timer, give this one a `data-progress` mode that updates textContent and only removes on completion).

- [ ] **Step 4: Verify in browser** — worktree server + a real import (fixture): timeline appears, stages advance, strip fills, no spinner-only phase. Screenshot in the task report. `npm test` green.

- [ ] **Step 5: Commit** — `git commit -m "feat: live build timeline — stages, per-slide states, no more bare spinner"`

---

### Task 3: Content-understanding pass (`analyzeOutline`)

**Files:**
- Modify: `product/infrastructure/ai/claude-cli-provider.js`, `product/domain/generation-service.js`, `product/domain/content-signature.js` (export a small merge helper)
- Test: `test/analyze-outline.test.js`

**Interfaces:**
- Produces: provider method `analyzeOutline({ title, outline }) → { slides: [{ n, kind, keyClaim, dataPoints, tone, visualNeed, weight }], warnings }` where `kind ∈ numeric|sequence|comparison|people|quote|agenda|awards|visual|assertion|content`, `visualNeed`/`weight` ∈ 0..2. Batched under `ANALYZE_BUDGET = 24_000`; JSON schema `ANALYZE_SCHEMA`; per-batch failure → warning + those slides absent (fallback to regex signature).
- `applyAnalysis(sig, a)` exported from content-signature.js: maps kind onto the existing booleans (`numeric→isNumeric`, `sequence→isSequence`, `comparison→isComparison`, `people→isPeople`, `quote→isQuote`, `agenda→isAgenda`, `awards→isAwards`, `visual→wantsVisual`, `assertion→isAssertion`; `content` = no change), sets `sig.analysis = a`. Never unsets a regex-derived true (analysis adds signal, regex stays as floor).
- generation-service: both compose paths call `analyzeOutline` first (progress stage `analyzing`, slide states `analyzing`), merge via `applyAnalysis`, store `{ analysis }` on the record via the same fire-and-forget updateStatus used for progress, and reuse a cached `record.analysis` if present (passed through opts).

- [ ] **Step 1: Failing tests**

```js
// test/analyze-outline.test.js — stub-provider integration + merge unit tests
import test from "node:test";
import assert from "node:assert/strict";
import { applyAnalysis, contentSignature } from "../product/domain/content-signature.js";
import { composeSlides } from "../product/domain/generation-service.js";

test("applyAnalysis maps kinds onto signature booleans without unsetting regex signals", () => {
  const sig = contentSignature({ title: "Q3: 40% growth, £2m ARR, 3x", bullets: ["a"] }, { index: 1, total: 5 });
  assert.equal(sig.isNumeric, true);
  const merged = applyAnalysis({ ...sig }, { kind: "quote", visualNeed: 0, weight: 1 });
  assert.equal(merged.isQuote, true);
  assert.equal(merged.isNumeric, true); // regex floor preserved
});

test("a failing analyzeOutline degrades to a warning, not a failed deck", async () => {
  const warnings = [];
  const provider = {
    analyzeOutline: async () => { throw new Error("boom"); },
    composeImportDeck: async () => ({ rows: [], warnings: [] }),
  };
  const mapping = [{ slideNumber: 1, title: "T", content: { title: "T", body: ["x"], notes: "" } }];
  const slides = await composeSlides(provider, mapping, { title: "D", origin: "import", warnings });
  assert.equal(slides.length, 1);
  assert.ok(warnings.some((w) => /analysis/i.test(w)));
});
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement** — provider: `buildAnalyzePrompt` (per-slide full title + bullets clipped at 600 chars + tables/elements one-liners for imports; instructions: classify structurally, quote the key claim verbatim, list explicit figures as dataPoints; respond JSON only) with `ANALYZE_SCHEMA` requiring `slides[{n, kind, …}]`, batched with the same interleave-free pattern as pass 1 (`layoutBatches` style, budget 24_000), failures per batch → warnings + continue. generation-service: in `composeSlides` (both branches, BEFORE signature building): if `opts.analysis` given, use it; else if `provider.analyzeOutline`, call with progress stage `analyzing` (try/catch → `note("Content analysis was unavailable: …")`). Merge: `signatures = outlineSignatures(outline).map((sig, i) => byN.has(i + 1) ? applyAnalysis(sig, byN.get(i + 1)) : sig)`. `#composeInBackground` passes `analysis: record.analysis || null` and stores a fresh analysis via updateStatus (fire-and-forget).

- [ ] **Step 4: Run** — new tests + whole suite green.

- [ ] **Step 5: Commit** — `git commit -m "feat: LLM content analysis feeds template scoring, regex signatures as floor"`

---

### Task 4: Deck plan pass (`planDeck`) — sections, dark, emphasis, dividers

**Files:**
- Modify: `product/infrastructure/ai/claude-cli-provider.js`, `product/domain/generation-service.js`, `product/domain/template-scoring.js` (boostRoles option)
- Test: `test/plan-deck.test.js`

**Interfaces:**
- Produces: provider `planDeck({ title, outline, analysis }) → { plan: { sections: [{from,to,title}], emphasis: number[], dark: number[], pace: {"<n>": "dense"|"breather"}, dividers: [{after: number, title: string}] }, warnings }` (single call, budget-clipped like analyze; `PLAN_SCHEMA`).
- `shortlistFor(sig, { …, boostRoles })`: `boostRoles: string[]` adds +20 to templates whose role is listed (scoring change is exactly one term; document next to ROLE_AFFINITY).
- generation-service applies the plan in BOTH compose paths:
  - validate: sections/dividers/dark/emphasis indexes within 1..N; dividers ≤ `Math.floor(N/6)`; else drop the offending part with a warning.
  - `dark`: after choice, override middle-slide themes — `themeFor(index, total, { templateName, theme: plan.dark.includes(sourceN) ? "dark" : "light" })` (DARK_SAFE still gates inside themeFor).
  - `emphasis`: those slides' `shortlistFor` call gets `boostRoles: ["statement", "quote"]` plus shape-boost via wants (set `sig.isAssertion = true`).
  - `pace`: rides into the choice/import prompt per slide (`pace: breather — prefer airy layouts` line).
  - `dividers`: after all content slides are built, insert divider slides at section boundaries: pick the highest-scoring `role === "divider"` template via `shortlistFor` on a synthetic signature (`{ itemCount: 0, density: "sparse", titleChars: title.length, … }` — build with `contentSignature({title, bullets: []}, {index, total})`), content = template example with its title field(s) replaced by the plan's section title, chrome + theme via the same builder the path already uses; renumber `order`/chrome afterwards (the import path already recomputes chrome at push time — extend the same mechanism; the prompt path's final map needs an equivalent reindex pass).
  - Progress: stage `planning` before, detail names the sections found.
  - Any planDeck failure → `note("Deck planning was unavailable: …")` + compose as today.

- [ ] **Step 1: Failing tests**

```js
// test/plan-deck.test.js (stub provider; no CLI)
test("a plan's dividers become divider slides at section boundaries", async () => {
  // mapping of 7 slides; stub planDeck returns one section break after 3 titled "Part Two";
  // stub composeImportDeck returns valid rows for each source (use core/content-twocol example).
  // Assert: output has 8 slides; the inserted one's templateReference names a role=divider
  // template; its content carries "Part Two"; order fields are 0..7 sequential;
  // chrome meta.page matches position.
});
test("an out-of-range divider or dark index is dropped with a warning, not applied", async () => { /* plan.dividers=[{after: 99,…}], plan.dark=[99] → no insert, warning */ });
test("planDeck failure degrades to a warning", async () => { /* throws → deck still ships, warning matches /plan/i */ });
test("boostRoles raises listed-role templates in the shortlist", () => {
  // import shortlistFor directly: same sig with and without boostRoles:["statement"];
  // assert a statement-role template ranks strictly higher with the boost.
});
```

(Write these fully in the test file — the sketches above name every assertion required.)

- [ ] **Step 2-4:** RED → implement → GREEN → whole suite (composition-contract test especially — inserted dividers must not break its retention floor; divider roles are already exempted there).

- [ ] **Step 5: Commit** — `git commit -m "feat: deck-level art direction — sections, dividers, dark placement, emphasis"`

---

### Task 5: Visual review loop

**Files:**
- Create: `product/domain/slide-review-service.js`
- Modify: `product/domain/generation-service.js` (hook both paths pre-return), `product/export-runtime/capture.html` only if `__mountSlide` needs a measurement hook (prefer page.evaluate from Node — no capture changes)
- Test: `test/slide-review.test.js`

**Interfaces:**
- Produces: `reviewSlides(slides, { title, note, tick, origin }) → Promise<slides>` — measures each built slide, repairs up to `MAX_REPAIRS = 4`, returns the (possibly patched) array. Exported pure helpers for tests: `pickWorst(measurements, max)` and `betterOf(before, after)`.
- Measurement (per slide, via Playwright against `http://127.0.0.1:${config.port}/product/export-runtime/capture.html`, mounting with `window.__mountSlide({ template, theme, ...content }, {})` exactly as `tools/audit-dead-space.mjs:107` does): `{ overflowPx, offCanvasPx, deadBandPx }` —
  - overflow: max over elements of `scrollHeight - clientHeight` where positive (skip the root);
  - off-canvas: max bottom/right beyond 1080/1920 of visible text nodes (mirror `audit-dark-mode.mjs`'s text-node walk);
  - dead band: largest empty vertical gap, threshold 300px, reusing the gap logic shape from `audit-dead-space.mjs` (skip background-painted elements — that tool's comments record the false-positive traps; copy its guards, don't re-derive).
- Defect score = `overflowPx * 3 + offCanvasPx * 3 + max(0, deadBandPx - 300)`; only slides with score > 0 are candidates.
- Repair strategy per slide (one round): if the slide has shortlist alternates recorded (thread each slide's shortlist names through composition on the slide object as `slide.__shortlist`, stripped before persist), rebuild content onto the next candidate via the same `prepareContentUpdate`+`clampToCapacity` path; else re-clamp with tightened budgets (`clampText` at 0.8× example lengths). Re-measure; `betterOf` keeps the lower score. Every repair or failure → `note(...)`; `tick({ stage: "reviewing", detail })`.
- Guards: Playwright launch or page.goto failure → `note("Visual review skipped: …")` return input unchanged; whole loop hard-boxed at 180s (`Promise.race` + browser.close in finally).

- [ ] **Step 1: Failing unit tests** — `pickWorst` (orders by score, caps at 4, ignores score-0), `betterOf` (prefers lower score; ties keep the original), and a `reviewSlides` stub-injection test: export an internal `_measureAll` override hook (module-scope `let measureImpl` with a test setter, or accept `measure` as an option param — choose the option param: `reviewSlides(slides, { measure })`) so tests can fake measurements and assert a repair happened and warnings/ticks fired, with NO Playwright in the test path.
- [ ] **Step 2-4:** RED → implement → GREEN; suite green. Manual: run one real review against the worktree server with a deliberately overflowing slide (edit a copy of a deck via API) and confirm detection + repair in the logs — record output in the task report.
- [ ] **Step 5: Commit** — `git commit -m "feat: visual review loop — measure rendered slides, repair hard defects"`

---

### Task 6: Copy fitting

**Files:**
- Modify: `product/infrastructure/ai/claude-cli-provider.js` (fill + import prompts)
- Test: extend `test/import-compose-prompt.test.js`

- [ ] **Step 1:** Failing test: import prompt contains a parallel-structure instruction (`/parallel|same grammatical shape/i`) and, when a slide carries `pace`, the pace hint line.
- [ ] **Step 2:** Add to `buildSlideFillPrompt` and `buildImportComposePrompt` rules: `"- Sibling entries in a card grid or column list share grammatical shape and comparable length — parallel construction, no odd one out."`; both prompt builders accept optional per-slide `pace` and render `    pace: breather — keep this slide airy; fewer, calmer words` / `dense` variant. Thread `pace` from the plan through the outline rows in generation-service (both paths).
- [ ] **Step 3:** GREEN + suite. Commit: `git commit -m "feat: parallel-structure and pacing instructions in slide copy prompts"`

---

### Task 7: Acceptance + docs

- [ ] **Step 1:** `npm test` fully green; restart worktree server; confirm `/api/meta` = HEAD.
- [ ] **Step 2: Prompt-path acceptance** — generate a 12+ slide deck from a substantial prompt via the UI. Verify: timeline shows all stages (screenshot); plan produced ≥1 divider (or plan warning explains why not); dark slides ⊆ DARK_SAFE with bookends dark; no hard-defect slides after review (or a warning names each); wall clock ≤ 10 min.
- [ ] **Step 3: Import acceptance** — re-import `/Users/hugojsfranca/Downloads/AI-Native  Technology Due Diligence for CXOs.pptx` (source images). Verify the same, PLUS: slide copy still transplanted (spot-check 3 slides vs source), dividers carry section titles only (no invented content).
- [ ] **Step 4:** `docs/CHANGELOG.md` entry (analysis pass, deck plan, dividers, visual review, live timeline, copy fitting); CLAUDE.md: one line in the architecture notes that composition is now analyze → plan → compose → review and progress rides on the generation record.
- [ ] **Step 5: Commit** — `git commit -m "docs: smart composition + live build view shipped"`
