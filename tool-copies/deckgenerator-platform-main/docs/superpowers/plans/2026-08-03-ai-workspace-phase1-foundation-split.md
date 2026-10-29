# AI Workspace Phase 1 — Foundation Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the ~900-line AI panel out of `product/ui/editor.js` into a standalone `product/ui/editor-ai/` module with **zero behavior change** — same DOM, same CSS classes, same UX.

**Architecture:** The AI code moves file-by-file into `product/ui/editor-ai/`, communicating with the host editor only through an explicit `aiInterface` object stored in a shared `context.js`. Cross-file calls inside the module (e.g. proposals.js re-rendering the panel) go through that context, avoiding import cycles. After every task the app still runs — moved functions are re-imported into `editor.js` until the final wiring task replaces those imports with a single `createAiPanel()` call.

**Tech Stack:** Vanilla ES modules in the browser, no bundler, no framework, no test runner. Server: `python3 serve.py 4599` (no-cache — never `python -m http.server`).

**Spec:** `docs/superpowers/specs/2026-08-03-ai-workspace-phase1-foundation-split-design.md`

## Global Constraints

- **Zero behavior change.** Moved code is moved **verbatim** — same logic, same DOM output, same CSS class names, same comments. Do not fix bugs, do not rename user-facing anything, do not "improve" while moving.
- All new files live under `product/ui/editor-ai/`.
- The AI module must never reach into `editor.js` internals except through the `aiInterface`/context. Shared library modules (`lib/api.js`, `lib/dom.js`, `lib/scene-graph.js`) are imported directly by the new files — they are already standalone.
- After **every** task: `node --check` passes on every touched file, and the editor page loads without console errors.
- The "Generate slide with AI" modal (`openAiSlideModal` / `generateSlideWithAi`, editor.js ~1668–1720) is **not** part of this split — it belongs to the slide-add flow and stays in `editor.js`.
- The command palette (⌘K, editor.js ~3417–3498) stays in `editor.js`; it calls the AI module through the returned panel API.
- No behavior verification is automated (there is no test suite). Each task ends with a syntax check; Task 8 is the full manual browser verification pass.

## Reference: current code map (before the split)

All in `product/ui/editor.js` (3,594 lines). Line numbers are pre-split and shift as tasks remove code — locate functions **by name**, not line, after Task 2.

| Function / state | Lines | Destination |
|---|---|---|
| `currentScope`, `renderAiScope` | 2531–2571 | conversation.js |
| `threadKey`, `loadThread`, `pushThread`, `stateFor`, `fieldLabel`, `aiStates` (decl. line 169) | 2576–2598 | conversation.js |
| `previewSpans`, `applyCanvasPreview`, `paintPreview`, `clearCanvasPreviewDom`, `updateReviewBar`, `wireReviewBar` | 2605–2654 | proposals.js |
| `acceptProposal`, `acceptAllProposals`, `discardProposals` | 2657–2738 | proposals.js |
| `renderAiPanel` | 2741–2859 | panel.js |
| `stepTimer`, `ADVICE_ACTIONS`, `stepsFor`, `buildStepsEl`, `stepStartedAt`, `startSteps`, `stopSteps` | 2865–2907 | thinking.js |
| `asLines`, `markWords`, `diffLines` | 2912–2944 | proposals.js |
| `deckReview`, `deckReviewBusy`, `runDeckReview`, `buildReviewEl` | 2953–3010 | review.js |
| `buildStructuralEl`, `applyStructuralPlan`, `buildLayoutOpEl`, `applyLayoutOp` | 3012–3164 | structural.js |
| `buildDiffEl` | 3166–3234 | proposals.js |
| `wireAiWorkspace`, `autoGrowAi`, `syncSendState` | 3236–3264 | composer.js |
| `isAssetLikeField`, `editableContentForAi`, `STRUCTURAL_HINT`, `sendAi` | 3273–3411 | composer.js |
| AI DOM refs (`aiScopeEl` … `aiClearBtn`, lines 122–129; `reviewBar` … `reviewDiscardBtn`, 131–134) | 122–134 | context.js (looked up by the module itself) |

External call sites in `editor.js` that must keep working (post-split they call the returned panel API):
lines 228 (`wireAiWorkspace()`), 538–539 (`renderAiPanel(); renderAiScope();`), 619 (`stateFor(...).phase === "review"` → `applyCanvasPreview()`), 888/918/1047/1060 (`renderAiScope()`), 1067/1482/1522 (`if (previewSpans.length) clearCanvasPreviewDom()`), 1405 (`floatAskAi` → `aiInput.focus()`), 1615 (`aiInput.focus()`), 3426 (`runDeckReview()`), 3481 (`sendAi(text, "rewrite")`).

CSS in `product/ui/app.css`: every rule whose selector contains `.ed-ai`, `.ed-diff`, `.ed-steps`, `.ed-structural`, or `.ed-review-card` → `product/ui/editor-ai/editor-ai.css`. (`.ed-review` — the floating review BAR, ids `ed-review*` — is host chrome and **stays** in app.css; only `.ed-review-card__*` moves.)

---

### Task 1: Module skeleton — context.js and index.js

**Files:**
- Create: `product/ui/editor-ai/context.js`
- Create: `product/ui/editor-ai/index.js`

**Interfaces:**
- Consumes: nothing yet (editor.js is untouched by this task).
- Produces: `ctx` (mutable shared object) from context.js; `createAiPanel(iface)` from index.js. Every later task imports `ctx` from context.js.

- [ ] **Step 1: Write context.js**

```js
// product/ui/editor-ai/context.js
// =============================================================================
// Shared context for the editor-ai module. Populated once by createAiPanel()
// (index.js) before any other function in this module runs. Cross-file calls
// inside the module (proposals.js re-rendering the panel, review.js starting
// the thinking steps, …) go through `ctx` rather than importing each other,
// which keeps the module free of import cycles.
// =============================================================================

const $ = (id) => document.getElementById(id);

export const ctx = {
  /** The aiInterface passed in by editor.js — see index.js for the shape. */
  iface: null,

  // Panel DOM. These ids live in editor.html and belong to the AI panel, so
  // the module owns their lookup; the host never touches them.
  dom: null,

  /** Set by panel.js at init: () => void. Everything that needs a re-render
   *  calls ctx.renderAiPanel() instead of importing panel.js. */
  renderAiPanel: () => {},
  /** Set by conversation.js at init. */
  renderAiScope: () => {},
};

export function initContext(iface) {
  ctx.iface = iface;
  ctx.dom = {
    aiScopeEl: $("ai-scope"),
    aiScopeText: $("ai-scope-text"),
    aiActivity: $("ai-activity"),
    aiStatus: $("ai-status"),
    aiComposer: $("ai-composer"),
    aiInput: $("ai-input"),
    aiSend: $("ai-send"),
    aiClearBtn: $("ai-clear-btn"),
    reviewBar: $("ed-review"),
    reviewLabel: $("ed-review-label"),
    reviewAcceptBtn: $("ed-review-accept"),
    reviewDiscardBtn: $("ed-review-discard"),
  };
}
```

- [ ] **Step 2: Write index.js (skeleton — fills in as later tasks land)**

```js
// product/ui/editor-ai/index.js
// =============================================================================
// Public entry for the AI panel. editor.js constructs an aiInterface and calls
// createAiPanel(iface); everything the panel needs from the host goes through
// that object — the module never reaches into editor.js internals.
//
// aiInterface shape (all functions; live values are getters because the host
// reassigns its `slides` / `selection` / `scene` bindings):
//   getSlides()        → slide[]            (live array reference)
//   getCurrentIndex()  → number
//   getSelection()     → selection | null
//   getFieldDefs()     → fieldDef[]
//   getScene()         → sceneGraph | null
//   getBusy()          → boolean
//   getCanvas()        → HTMLElement        (the #ed-canvas node)
//   presentationId     → string
//   setBusy(b), beginSave(), endSave(ok, msg?)
//   writeField(slide, field, value, prevValue, opts) → Promise<boolean>
//   writeStyle(slide, nextMap, prevMap) → Promise<void>
//   pushHistory(entry), renderCanvas(), paintThumb(i),
//   adoptSlides(presentation, index), selectSlide(i),
//   styleKeyFor(origin) → string | null
//   deepEqual(a, b) → boolean
//   errText(err, fallback) → string
// =============================================================================
import { initContext, ctx } from "./context.js";

export function createAiPanel(iface) {
  initContext(iface);
  // Wiring added by later tasks:
  //   conversation.js  — registers ctx.renderAiScope
  //   panel.js         — registers ctx.renderAiPanel
  //   composer.js      — wires the composer form + clear button
  //   proposals.js     — wires the floating review bar
  return {
    // Populated by later tasks. Kept as named methods (not re-exports) so the
    // host has one stable surface.
  };
}
```

- [ ] **Step 3: Syntax check**

Run: `node --check product/ui/editor-ai/context.js && node --check product/ui/editor-ai/index.js`
Expected: no output (both pass).

- [ ] **Step 4: Commit**

```bash
git add product/ui/editor-ai/context.js product/ui/editor-ai/index.js
git commit -m "refactor(editor-ai): module skeleton — shared context + createAiPanel entry"
```

---

### Task 2: Move conversation + scope state (conversation.js)

**Files:**
- Create: `product/ui/editor-ai/conversation.js`
- Modify: `product/ui/editor.js` (delete moved code, add temporary import)

**Interfaces:**
- Consumes: `ctx` from context.js.
- Produces (exports): `currentScope()`, `renderAiScope()`, `threadKey(slideId)`, `loadThread(slideId)`, `pushThread(state, slideId, role, text)`, `stateFor(slideId)`, `fieldLabel(field)`, `aiStates` (Map). Signatures identical to today's editor.js versions.

- [ ] **Step 1: Create conversation.js with the moved functions**

Move **verbatim** from editor.js: `currentScope`, `renderAiScope` (2531–2571), `threadKey`, `loadThread`, `pushThread`, `stateFor`, `fieldLabel` (2576–2598), plus the `aiStates` Map declaration (line 169) and its doc comment (164–168). Adapt only the host references, mechanically:

- `selection` → `ctx.iface.getSelection()`
- `currentIndex` → `ctx.iface.getCurrentIndex()`
- `fieldDefs` → `ctx.iface.getFieldDefs()`
- `presentationId` → `ctx.iface.presentationId`
- `aiScopeEl` / `aiScopeText` / `aiActivity` → `ctx.dom.aiScopeEl` / `ctx.dom.aiScopeText` / `ctx.dom.aiActivity`
- the `renderAiPanel()` call inside `renderAiScope` → `ctx.renderAiPanel()`

File header + registration:

```js
// product/ui/editor-ai/conversation.js
// Per-slide AI state and the running conversation thread (sessionStorage),
// plus the scope line ("Slide 3 · Headline selected") above the composer.
import { ctx } from "./context.js";

export const aiStates = new Map();

// … moved functions, exported …

export function initConversation() {
  ctx.renderAiScope = renderAiScope;
}
```

- [ ] **Step 2: Update editor.js**

Delete the moved code (functions listed above, the `aiStates` declaration, and its comment). At the top, next to the other module imports, add the **temporary** bridge import (removed again in Task 7):

```js
import { currentScope, renderAiScope, loadThread, pushThread, stateFor, fieldLabel, aiStates, initConversation } from "./editor-ai/conversation.js";
```

In editor.js's init path, immediately after the DOM-ref constants exist (top-level is fine since the script runs after DOM parse as `type="module"`), call `initContext` + `initConversation`. For now — until Task 7 builds the real `aiInterface` — pass a getter-based interface **inline at the top of editor.js**, right after the state declarations (~line 170):

```js
import { initContext } from "./editor-ai/context.js";

initContext({
  getSlides: () => slides,
  getCurrentIndex: () => currentIndex,
  getSelection: () => selection,
  getFieldDefs: () => fieldDefs,
  getScene: () => scene,
  getBusy: () => busy,
  getCanvas: () => canvas,
  presentationId,
  // Action members are added in the tasks that need them (Task 4 onward):
  // functions declared later in the file are hoisted, so they can be
  // referenced here directly once added.
});
initConversation();
```

(Function declarations hoist, so `initContext` at line ~170 can safely reference `writeField` etc. later; the getters close over the `let` bindings and always read the current value.)

- [ ] **Step 3: Syntax check + smoke**

Run: `node --check product/ui/editor.js && node --check product/ui/editor-ai/conversation.js`
Then start `python3 serve.py 4599`, open `http://localhost:4599/product/ui/editor.html?id=<any test presentation id>` in the browser pane, confirm: page loads, scope line shows "Slide 1", no console errors. (Grab a valid id from `http://localhost:4599/product/ui/presentations.html` or the API.)

- [ ] **Step 4: Commit**

```bash
git add -A product/ui
git commit -m "refactor(editor-ai): move conversation thread + scope state into module"
```

---

### Task 3: Move the thinking steps (thinking.js)

**Files:**
- Create: `product/ui/editor-ai/thinking.js`
- Modify: `product/ui/editor.js`

**Interfaces:**
- Consumes: `ctx` (for `ctx.dom.aiActivity`), `escapeHtml` from `../lib/dom.js`.
- Produces (exports): `ADVICE_ACTIONS` (Set), `stepsFor(action, scope)`, `buildStepsEl(steps)`, `startSteps()`, `stopSteps()`. Identical signatures.

- [ ] **Step 1: Create thinking.js**

Move verbatim from editor.js: `stepTimer`, `ADVICE_ACTIONS`, `stepsFor`, `buildStepsEl`, `stepStartedAt`, `startSteps`, `stopSteps` (2865–2907) — including the block comment above them. Mechanical adaptations: `aiActivity` → `ctx.dom.aiActivity`; add `import { ctx } from "./context.js";` and `import { escapeHtml } from "../lib/dom.js";`. Module-local `stepTimer` / `stepStartedAt` stay module-level `let`s.

- [ ] **Step 2: Update editor.js**

Delete the moved block; add temporary import:

```js
import { ADVICE_ACTIONS, stepsFor, buildStepsEl, startSteps, stopSteps } from "./editor-ai/thinking.js";
```

- [ ] **Step 3: Syntax check + smoke**

Run: `node --check product/ui/editor.js && node --check product/ui/editor-ai/thinking.js`
Browser: reload the editor page; send any AI ask; the named-steps animation with elapsed ticker must appear exactly as before.

- [ ] **Step 4: Commit**

```bash
git add -A product/ui
git commit -m "refactor(editor-ai): move thinking-steps UI into module"
```

---

### Task 4: Move proposals — preview, accept/discard, diff cards (proposals.js)

**Files:**
- Create: `product/ui/editor-ai/proposals.js`
- Modify: `product/ui/editor.js`

**Interfaces:**
- Consumes: `ctx`; `stateFor`, `pushThread`, `fieldLabel` from `./conversation.js`; `escapeHtml`, `cssEscape`, `toast` from `../lib/dom.js`; `api`, `ApiError` from `../lib/api.js`. Host actions via `ctx.iface`: `writeField`, `beginSave`, `endSave`, `pushHistory`, `renderCanvas`, `paintThumb`, `getCanvas`, `errText`.
- Produces (exports): `applyCanvasPreview()`, `clearCanvasPreviewDom()`, `hasPreview()` → boolean (new, trivial: `previewSpans.length > 0` — the host's `if (previewSpans.length)` checks need it since the array is now module-private), `updateReviewBar()`, `wireReviewBar()`, `acceptProposal(p)`, `acceptAllProposals()`, `discardProposals({silent}?)`, `buildDiffEl(p)`, `asLines(value)`, `markWords(line, counterpart)`, `diffLines(value, counterpart, cls, sign)`.

- [ ] **Step 1: Extend the inline `initContext` call in editor.js**

Add the action members proposals.js needs (hoisted function references):

```js
  setBusy, beginSave, endSave, writeField, writeStyle, pushHistory,
  renderCanvas, paintThumb, adoptSlides, selectSlide, styleKeyFor,
  deepEqual, errText,
```

(Check each exists as a function declaration in editor.js; `deepEqual` and `errText` are — see editor.js `function deepEqual` and line 3594. If any is a `const` arrow defined later, convert the interface member to a getter-style thunk `x: (...a) => x(...a)` — but prefer confirming they're declarations first.)

- [ ] **Step 2: Create proposals.js**

Move verbatim: `previewSpans`, `applyCanvasPreview`, `paintPreview`, `clearCanvasPreviewDom`, `updateReviewBar`, `wireReviewBar` (2605–2654), `acceptProposal`, `acceptAllProposals`, `discardProposals` (2657–2738), `asLines`, `markWords`, `diffLines` (2912–2944), `buildDiffEl` (3166–3234) — with their comments. Mechanical adaptations:

- `canvas` → `ctx.iface.getCanvas()`
- `slides` / `currentIndex` → `ctx.iface.getSlides()` / `ctx.iface.getCurrentIndex()`
- `reviewBar` / `reviewLabel` / `reviewAcceptBtn` / `reviewDiscardBtn` → `ctx.dom.…`
- `presentationId` → `ctx.iface.presentationId`
- `writeField` / `beginSave` / `endSave` / `pushHistory` / `renderCanvas` / `paintThumb` / `errText` → `ctx.iface.…`
- `renderAiPanel()` → `ctx.renderAiPanel()`
- `stateFor` / `pushThread` / `fieldLabel` → direct imports from `./conversation.js`
- `api` / `ApiError` / `toast` / `escapeHtml` / `cssEscape` → direct lib imports

Add the one new export:

```js
export function hasPreview() { return previewSpans.length > 0; }
```

- [ ] **Step 3: Update editor.js**

Delete moved code; add temporary import; replace the three `if (previewSpans.length) clearCanvasPreviewDom();` call sites (lines ~1067, 1482, 1522) with `if (hasPreview()) clearCanvasPreviewDom();`.

```js
import { applyCanvasPreview, clearCanvasPreviewDom, hasPreview, updateReviewBar, wireReviewBar, acceptProposal, acceptAllProposals, discardProposals, buildDiffEl } from "./editor-ai/proposals.js";
```

- [ ] **Step 4: Syntax check + smoke**

Run: `node --check product/ui/editor.js && node --check product/ui/editor-ai/proposals.js`
Browser: send an AI rewrite ask → canvas preview paints, review bar counts, Accept one / Accept all / Discard / Edit each work; undo restores.

- [ ] **Step 5: Commit**

```bash
git add -A product/ui
git commit -m "refactor(editor-ai): move proposal preview/accept/diff cards into module"
```

---

### Task 5: Move structural proposals (structural.js) and deck review (review.js)

**Files:**
- Create: `product/ui/editor-ai/structural.js`
- Create: `product/ui/editor-ai/review.js`
- Modify: `product/ui/editor.js`

**Interfaces:**
- structural.js consumes: `ctx`; `stateFor`, `pushThread` from `./conversation.js`; `escapeHtml`, `toast` from `../lib/dom.js`; `api` from `../lib/api.js`. Host via `ctx.iface`: `setBusy`, `beginSave`, `endSave`, `pushHistory`, `adoptSlides`, `renderCanvas`, `paintThumb`, `writeStyle`, `errText`.
  Produces: `buildStructuralEl(plan)`, `applyStructuralPlan(plan)`, `buildLayoutOpEl(op)`, `applyLayoutOp(op)`.
- review.js consumes: `ctx`; `stateFor` from `./conversation.js`; `startSteps`, `stopSteps` from `./thinking.js`; `escapeHtml`, `toast`; `api`. Host via `ctx.iface`: `setBusy`, `selectSlide`, `errText`, `getBusy`. Plus `ctx.sendAi` — see below.
  Produces: `runDeckReview()`, `buildReviewEl(review)`, `getDeckReview()` → the module-private `deckReview` value (panel.js needs to know whether to render the card).

- [ ] **Step 1: Create structural.js**

Move verbatim: `buildStructuralEl`, `applyStructuralPlan`, `buildLayoutOpEl`, `applyLayoutOp` (3012–3164) with comments. Same mechanical substitutions as Task 4 (`slides`/`currentIndex`/`presentationId`/host actions → `ctx.iface`; `renderAiPanel()` → `ctx.renderAiPanel()`; `stateFor`/`pushThread` imported from conversation.js).

- [ ] **Step 2: Create review.js**

Move verbatim: `deckReview`, `deckReviewBusy`, `runDeckReview`, `buildReviewEl` (2953–3010) with comments. `deckReview`/`deckReviewBusy` become module-level `let`s. Substitutions as above; `busy` (read in `runDeckReview`'s guard) → `ctx.iface.getBusy()`. The `sendAi(iss.fix, "rewrite")` call inside `buildReviewEl` → `ctx.sendAi(iss.fix, "rewrite")` — composer.js registers `ctx.sendAi` in Task 6; until then add to context.js:

```js
  /** Set by composer.js at init. */
  sendAi: () => {},
```

Add the accessor panel.js will need:

```js
export function getDeckReview() { return deckReview; }
```

and inside `buildReviewEl`'s dismiss handler and `runDeckReview`, keep assigning the module-local `deckReview` exactly as today.

- [ ] **Step 3: Update editor.js**

Delete moved code; temporary imports:

```js
import { buildStructuralEl, buildLayoutOpEl } from "./editor-ai/structural.js";
import { runDeckReview, buildReviewEl, getDeckReview } from "./editor-ai/review.js";
```

`renderAiPanel` (still in editor.js until Task 6) currently reads the old top-level `deckReview` variable — change its two references (`if (deckReview) …buildReviewEl(deckReview)`) to `const dr = getDeckReview(); if (dr) aiActivity.appendChild(buildReviewEl(dr));`.

- [ ] **Step 4: Syntax check + smoke**

Run: `node --check product/ui/editor.js product/ui/editor-ai/structural.js product/ui/editor-ai/review.js`
Browser: "Review the whole presentation" from the empty state → score card renders; Dismiss works; a structural ask ("split this into two slides") → structural card, Discard works.

- [ ] **Step 5: Commit**

```bash
git add -A product/ui
git commit -m "refactor(editor-ai): move structural proposals + deck review into module"
```

---

### Task 6: Move the panel renderer and composer (panel.js, composer.js)

**Files:**
- Create: `product/ui/editor-ai/panel.js`
- Create: `product/ui/editor-ai/composer.js`
- Modify: `product/ui/editor.js`

**Interfaces:**
- panel.js consumes: `ctx`; `stateFor`, `currentScope` from `./conversation.js`; `buildStepsEl` from `./thinking.js`; `buildDiffEl`, `applyCanvasPreview` from `./proposals.js`; `buildStructuralEl`, `buildLayoutOpEl` from `./structural.js`; `buildReviewEl`, `getDeckReview`, `runDeckReview` from `./review.js`; `escapeHtml`. Composer helpers (`autoGrowAi`, `syncSendState`, example-button wiring targets `ctx.dom.aiInput`) — the empty-state example wiring calls `ctx.composer.draft(text)` (see composer.js).
  Produces: `renderAiPanel()`, `initPanel()` (registers `ctx.renderAiPanel = renderAiPanel`).
- composer.js consumes: `ctx`; `stateFor`, `pushThread`, `currentScope`, `aiStates` from `./conversation.js`; `stepsFor`, `startSteps`, `stopSteps` from `./thinking.js`; `discardProposals` from `./proposals.js`; `sceneDigest` from `../lib/scene-graph.js`; `api` from `../lib/api.js`. Host via `ctx.iface`: `getSlides`, `getCurrentIndex`, `getSelection`, `getFieldDefs`, `getScene`, `getBusy`, `setBusy`, `deepEqual`, `errText`, `presentationId`.
  Produces: `sendAi(text, action)`, `wireAiWorkspace()`, `initComposer()` (registers `ctx.sendAi = sendAi` and `ctx.composer = { draft }` where `draft(text)` sets `aiInput.value = text; autoGrowAi(); syncSendState(); focus + caret to end` — exactly the example-button body from today's `renderAiPanel`), `focusComposer()` (→ `ctx.dom.aiInput.focus()`).

- [ ] **Step 1: Create composer.js**

Move verbatim: `wireAiWorkspace`, `autoGrowAi`, `syncSendState` (3236–3264), `isAssetLikeField`, `editableContentForAi`, `STRUCTURAL_HINT`, `sendAi` (3273–3411) with comments. Substitutions per the consumes-list above; `wireAiWorkspace`'s `aiClearBtn` handler uses `aiStates` (imported) and `clearCanvasPreviewDom` (imported from proposals.js); it also calls `wireReviewBar()` — import that too. `busy` reads → `ctx.iface.getBusy()`.

- [ ] **Step 2: Create panel.js**

Move verbatim: `renderAiPanel` (2741–2859) with comments. Substitutions per consumes-list; the empty-state example-button click handler body becomes `ctx.composer.draft(b.dataset.ex)`; the `#ai-review-cta` handler stays `runDeckReview` (imported). `aiClearBtn`/`aiStatus`/`aiActivity` → `ctx.dom.…`.

- [ ] **Step 3: Fill in index.js**

```js
import { initContext, ctx } from "./context.js";
import { initConversation, renderAiScope, stateFor } from "./conversation.js";
import { initPanel, renderAiPanel } from "./panel.js";
import { initComposer, sendAi, wireAiWorkspace, focusComposer } from "./composer.js";
import { applyCanvasPreview, clearCanvasPreviewDom, hasPreview } from "./proposals.js";
import { runDeckReview } from "./review.js";

export function createAiPanel(iface) {
  initContext(iface);
  initConversation();
  initPanel();
  initComposer();
  wireAiWorkspace();
  return {
    renderPanel: renderAiPanel,
    renderScope: renderAiScope,
    stateFor,
    sendAi,
    runDeckReview,
    applyCanvasPreview,
    clearCanvasPreview: clearCanvasPreviewDom,
    hasPreview,
    focusComposer,
  };
}
```

- [ ] **Step 4: Rewire editor.js**

- Delete the moved composer/panel code and ALL temporary `./editor-ai/*` named imports from Tasks 2–5.
- Replace the early `initContext({...}); initConversation();` block with the full interface + single call, assigned where the temp block was:

```js
import { createAiPanel } from "./editor-ai/index.js";

const ai = createAiPanel({
  getSlides: () => slides,
  getCurrentIndex: () => currentIndex,
  getSelection: () => selection,
  getFieldDefs: () => fieldDefs,
  getScene: () => scene,
  getBusy: () => busy,
  getCanvas: () => canvas,
  presentationId,
  setBusy, beginSave, endSave, writeField, writeStyle, pushHistory,
  renderCanvas, paintThumb, adoptSlides, selectSlide, styleKeyFor,
  deepEqual, errText,
});
```

- Swap every remaining AI call site to the panel API: `wireAiWorkspace()` (line ~228) → **delete** (createAiPanel wires it); `renderAiPanel()`/`renderAiScope()` → `ai.renderPanel()`/`ai.renderScope()`; `stateFor(...)` (line ~619) → `ai.stateFor(...)`; `applyCanvasPreview()` → `ai.applyCanvasPreview()`; `if (hasPreview()) clearCanvasPreviewDom()` → `if (ai.hasPreview()) ai.clearCanvasPreview()`; `aiInput.focus()` (lines ~1405, ~1615) → `ai.focusComposer()`; `runDeckReview()` (⌘K, ~3426) → `ai.runDeckReview()`; `sendAi(text, "rewrite")` (⌘K, ~3481) → `ai.sendAi(text, "rewrite")`.
- Delete the now-unused AI DOM-ref constants from editor.js (lines 122–134, the `aiScopeEl`…`reviewDiscardBtn` block) — the module looks them up itself. **Verify with grep** that nothing else in editor.js still references them before deleting.

- [ ] **Step 5: Syntax check + smoke**

Run: `node --check product/ui/editor.js product/ui/editor-ai/*.js`
Also: `grep -n "renderAiPanel\|sendAi\|stateFor\|previewSpans\|aiActivity" product/ui/editor.js` — every hit must be an `ai.` call or gone.
Browser: full loop — ask → steps → proposals → accept/discard; empty-state examples draft into composer; ⌘K "Ask AI" works; ⌘K "Review presentation" works.

- [ ] **Step 6: Commit**

```bash
git add -A product/ui
git commit -m "refactor(editor-ai): move panel renderer + composer; editor.js now uses createAiPanel()"
```

---

### Task 7: Move the CSS (editor-ai.css)

**Files:**
- Create: `product/ui/editor-ai/editor-ai.css`
- Modify: `product/ui/app.css` (delete moved rules)
- Modify: `product/ui/editor.html` (add the link tag)

**Interfaces:**
- Consumes/produces: none (pure stylesheet move — selectors and declarations byte-identical).

- [ ] **Step 1: Identify the rules**

Run: `grep -n "ed-ai\|ed-diff\|ed-steps\|ed-structural\|ed-review-card" product/ui/app.css | head -50` to find the block boundaries. Move every rule whose selector mentions `.ed-ai`, `.ed-diff`, `.ed-steps`, `.ed-structural`, or `.ed-review-card` — including any `@keyframes` or media queries used only by them. **Leave** rules for the review BAR (`#ed-review`, `.ed-review` without `-card`) in app.css.

- [ ] **Step 2: Create editor-ai.css and delete the rules from app.css**

Cut-and-paste verbatim, preserving order and comments. Header comment:

```css
/* ============================================================================
   AI panel styles — companion to product/ui/editor-ai/*.js. Moved out of
   app.css in the Phase-1 foundation split; selectors unchanged.
   ========================================================================= */
```

- [ ] **Step 3: Link it in editor.html**

After the existing `app.css` link:

```html
<link rel="stylesheet" href="editor-ai/editor-ai.css" />
```

- [ ] **Step 4: Verify**

Run: `grep -c "ed-ai__\|ed-diff__\|ed-steps__\|ed-review-card__" product/ui/app.css` — expected `0`.
Browser: hard-reload the editor; panel, diff cards, steps, review card all styled identically (compare against a pre-change screenshot if in doubt).

- [ ] **Step 5: Commit**

```bash
git add -A product/ui
git commit -m "refactor(editor-ai): move AI panel CSS out of app.css"
```

---

### Task 8: Full manual verification pass

**Files:**
- Modify: none (verification only; fix regressions found, each as its own commit).

- [ ] **Step 1: Start the server and open a test presentation**

`python3 serve.py 4599` → `http://localhost:4599/product/ui/editor.html?id=<id>`. Use a scratch presentation, not "export v1" (its slide-4 content is intentionally left polluted from a prior investigation).

- [ ] **Step 2: Walk every flow from the spec's verification list**

1. Empty state: scope-specific examples; click one → drafts into composer with caret at end.
2. Send a rewrite ask → named steps animate with elapsed ticker → proposals land as diff cards + canvas preview + review bar count.
3. Accept one proposal → field updates, "Recent changes" entry, undo/redo works.
4. Accept all (with ≥2 proposals) → single undo entry restores all.
5. Edit a proposal → textarea → Accept applies edited text.
6. Discard (per-card and review-bar) → preview cleared, canvas restored.
7. Select an element on canvas → scope line updates; element-level examples appear when idle.
8. Structural ask ("split this into two slides") → structural card → Apply and undo; Discard path too.
9. Deck review (empty-state CTA and ⌘K) → score card; issue "Fix" jumps to slide and produces normal proposals; Dismiss.
10. Error path: stop the backend (or use an invalid id) mid-ask → error line + "Try again"; retry works after restoring.
11. Switch slides during review phase → preview/review bar follow the current slide correctly (same as before the split).
12. ⌘K free text → "Ask AI: …" sends.
13. Reload the page → conversation thread persists (sessionStorage), proposals do not (same as before).

- [ ] **Step 3: Console + line-count audit**

No console errors across all flows. `wc -l product/ui/editor.js` — expect roughly 2,650–2,750 (≈900 lines gone). `grep -n "ed-ai__\|buildDiffEl\|renderAiPanel" product/ui/editor.js` — no hits except `ai.renderPanel` call sites.

- [ ] **Step 4: Final commit (if fixes were needed) and wrap-up**

```bash
git status
```

Confirm clean tree; all work committed task-by-task.
