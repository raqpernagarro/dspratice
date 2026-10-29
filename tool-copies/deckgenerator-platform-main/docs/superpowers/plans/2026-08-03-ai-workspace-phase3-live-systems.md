# AI Workspace Phase 3 — Live Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-slide AI concurrency with a cross-slide task strip, a persistent presentation-health chip with staleness, and backend-backed deck-scoped AI memory that the model actually honors.

**Architecture:** UI work in `product/ui/editor-ai/` on the Phase 2 feed. Backend: `aiMemory` on the presentation record (repository whitelist + validation) consumed by `editor-ai-service` as instruction text. Health persistence is localStorage keyed by presentation id with `updatedAt` staleness.

**Tech Stack:** As Phases 1–2. Test rig: API 4611, UI proxy 4612, scratch deck `a00dbcbb-36a9-4d8c-9ad9-4d4cbda48d1c`.

**Spec:** `docs/superpowers/specs/2026-08-03-ai-workspace-phase3-live-systems-design.md` — the contract; read before any task.

## Global Constraints

- Tokens only; mint discipline as Phase 2; both themes; reduced-motion guards; `article`/button/a11y conventions of the module.
- Phase 2 behavior is the baseline: nothing regresses (row lifecycle, cancel/retry, chips, review card, host contract).
- Backend changes are exactly the spec's touchpoint list. Plain content-edit merge semantics and the replaceContent flag are untouched.
- `node --check` every touched JS file per task; live rig verification per task (implementer if browser-capable, else controller).
- The global `busy` flag continues to gate WRITES (accept/apply/structural/save) exactly as today; only AI *think* requests stop using it.

---

### Task 1: Per-slide in-flight + multi-controller + task strip

**Files:**
- Modify: `product/ui/editor-ai/composer.js` (gate + controller Map)
- Modify: `product/ui/editor-ai/conversation.js` (helper `workingItems(allStates)` or equivalent iteration surface)
- Modify: `product/ui/editor-ai/panel.js` (task strip render)
- Modify: `product/ui/editor-ai/review.js` (review keeps its own single-flight; stop using global busy for the review call)
- Modify: `product/ui/editor.js` (remove setBusy from... NO — composer.js owns those calls; editor.js only if a leftover assumption breaks — investigate `setBusy` consumers first and report)
- Modify: `product/ui/editor-ai/editor-ai.css`

**Interfaces:**
- Produces: `sendAi` gates on `stateFor(currentSlide).items.some(working)` instead of global busy; AbortController Map keyed by item id, `cancelItem(itemId)` exported (card Cancel + strip Cancel both use it); task strip element listing working items across `aiStates` with slide label → `ctx.iface.selectSlide(idx)` and Cancel.
- Consumes: Phase 2 composer/thinking internals.

- [ ] **Step 1:** Inventory `setBusy`/`getBusy` consumers (grep editor.js + module). Map which uses are AI-think vs write. Record findings in the report. Composer send path stops calling setBusy; syncSendState keys on current-slide working item (`getBusy() || currentSlideWorking` → just currentSlideWorking + keep getBusy for write-locks).
- [ ] **Step 2:** Controller Map + cancelItem(itemId); thinking.js elapsed ticker must handle N working items (per-card timers or one interval walking all working cards — keep it simple: one interval, update every visible `.ed-item[data-status="working"]` elapsed node and strip rows).
- [ ] **Step 3:** Task strip: renders when ≥1 working item anywhere; row per item: "Slide N — <ask, truncated> · elapsed · Cancel". Slide label is a button (selectSlide). Strip lives above the context chips (new container in the panel DOM the module already owns; if editor.html needs a div, add id `ai-tasks`).
- [ ] **Step 4:** Review call stops setting global busy; deckReviewBusy still guards re-entry; review CTA disabled while running.
- [ ] **Step 5:** Rig check: start asks on two slides (switch slide while first runs — composer must be usable), strip shows both, cancel one from strip, the other lands correctly on its own slide; editing text on a third slide while tasks run stays fully interactive. Commit `feat(editor-ai): per-slide AI concurrency + cross-slide task strip`.

### Task 2: Health chip + review persistence + staleness

**Files:**
- Modify: `product/ui/editor-ai/review.js` (store/load/staleness)
- Modify: `product/ui/editor-ai/panel.js` (chip in header row)
- Modify: `product/ui/editor.js` (iface.getPresentation() → {id, updatedAt}; call `ai.notifyDeckChanged()` from the same paths that already repaint thumbs after writes — find ONE choke point, e.g. inside writeField success + structural/apply/add/delete/reorder adopt paths; if no single choke point exists, expose `iface.onDeckMutated(cb)`-style registration — pick the minimal correct one and document)
- Modify: `product/ui/editor-ai/editor-ai.css`, `product/ui/editor.html` (chip container id if needed)

**Interfaces:**
- Produces: localStorage `nps:review:<pid>` {review, reviewedAt, updatedAtAtReview}; `getStoredReview()`/`markDeckChanged()` in review.js; chip (mini ring 18px, score, ≈min, stale dim state); chip click re-opens card (clears dismissed flag, scrolls feed top); `ai.notifyDeckChanged` exposed via index.js.
- Consumes: Task 1 state (review single-flight).

- [ ] **Step 1:** review.js: persist on successful runDeckReview; load at init (module init runs before first render — read lazily on first render to have presentationId ready); dismissed = session-only flag hiding the card, chip always renders while a stored review exists.
- [ ] **Step 2:** Staleness: compare stored updatedAtAtReview vs iface.getPresentation().updatedAt at load; flip stale on notifyDeckChanged() calls (accepted proposals, applied ops/plans, manual writeField success, slide add/delete/reorder — wire ONE host choke point; document which).
- [ ] **Step 3:** Chip UI + interactions; stale = dimmed ring + "changed since review" tooltip/title.
- [ ] **Step 4:** Rig: run review → reload → chip persists with score; accept any change → stale state appears; chip click re-opens card; re-run refreshes. Commit `feat(editor-ai): persistent presentation-health chip with staleness`.

### Task 3: aiMemory backend (repository + service + api wrapper)

**Files:**
- Modify: `product/storage/presentation-repository.js` (whitelist + validation)
- Modify: `product/domain/editor-ai-service.js` (instruction block in assist + planSlideChange)
- Modify: `product/ui/lib/api.js` (updatePresentation wrapper if absent — check; the presentations UI likely PATCHes title already)

**Interfaces:**
- Produces: PATCH `{aiMemory: [{id, text, pinned}]}` accepted (validated: array ≤20, text string ≤200 trimmed non-empty, pinned boolean, id string; unknown keys stripped; createdAt preserved server-side for existing ids, set for new); GET returns it. assist/plan prepend "Standing instructions from the author (follow unless the current ask overrides):\n- …" pinned-first, ≤12 lines.
- Consumes: existing update() path; existing provider contract (instructions string).

- [ ] **Step 1:** Repository: add "aiMemory" to MUTABLE_FIELDS with a `normalizeAiMemory()` validator (reject non-array with a 422-shaped error consistent with existing validation errors; silently clamp lengths). Verify the routes layer passes unknown top-level fields through to update() (it PATCHes record fields via MUTABLE_FIELDS — confirm the route doesn't have its own whitelist; if it does, extend it identically).
- [ ] **Step 2:** editor-ai-service: both methods already load the record (assist does via slide? check — if only the slide is loaded, load the record once); prepend the block to `instructions` before provider call; cap and pinned-first ordering; skip entirely when empty.
- [ ] **Step 3:** api.js wrapper (check existing `updatePresentation`; add if missing).
- [ ] **Step 4:** Verify via curl on the rig: PATCH aiMemory → GET roundtrip; invalid shapes rejected; assist request with memory present → inspect the provider prompt (claude-cli-provider logs or add temporary local echo — do NOT commit debug code) to confirm the block. Commit `feat(product): deck-scoped aiMemory field + standing-instruction injection`.

### Task 4: Memory UI section

**Files:**
- Modify: `product/ui/editor-ai/panel.js` or new `product/ui/editor-ai/memory.js` (prefer new file), `editor-ai.css`, `product/ui/editor.js` (iface.getPresentation() gains aiMemory; iface.patchPresentation(fields) → api.updatePresentation + local record refresh), `editor.html` (container id `ai-memory` if needed), `index.js` (wiring)

**Interfaces:**
- Produces: collapsible "Memory · N" section between header row and feed; expanded rows (text, pin toggle, delete-with-inline-confirm "Sure?" 3s), add input (Enter adds, ≤200 chars, client-side cap 20 with quiet count); PATCHes debounced 600ms; pinned sort first; optimistic UI with rollback on 4xx/5xx (toast on failure).
- Consumes: Task 3 backend.

- [ ] **Step 1:** memory.js module (render + state from iface.getPresentation().aiMemory; local working copy; debounce; rollback).
- [ ] **Step 2:** Collapse state in sessionStorage (`nps:memexp:<pid>`); count badge; a11y (button semantics, aria-expanded).
- [ ] **Step 3:** Rig: add/pin/delete/reload-survives; kill API → edit → rollback+toast; send an ask → provider receives block (from Task 3's verification method). Commit `feat(editor-ai): deck memory panel`.

### Task 5: Full verification pass (controller)

- [ ] Spec verification list end-to-end + Phase 2 regression sweep (row lifecycle, cancel/retry, chips, themes, reload semantics, undo, ⌘K, console). Fix-rounds as needed; ledger; commit fixes.
