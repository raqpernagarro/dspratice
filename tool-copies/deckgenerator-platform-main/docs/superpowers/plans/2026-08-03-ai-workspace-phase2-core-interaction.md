# AI Workspace Phase 2 — Core Interaction Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the latest-result-only AI panel with a per-slide feed of lifecycle-carrying work-item cards (ask + outcome in one card), add cancel/retry/edit-ask, an interactive context chip row, and a restrained visual system on the existing app tokens.

**Architecture:** All redesign work lands inside `product/ui/editor-ai/` (the Phase 1 module). Per-slide state gains an `items` array rendered newest-first by panel.js; kind-specific card renderers live beside the code they evolve from (proposals.js, structural.js, review.js). Host touchpoints are exactly four: two new iface actions (`clearSelection`, `highlightField`), an optional `{signal}` on two `lib/api.js` wrappers, and CSS for `.is-ai-hint` beside `.is-preview` in app.css.

**Tech Stack:** Vanilla browser ES modules, no framework, no build step. Existing token system in app.css (mint `--c-accent`, hairlines `--c-edge`, both themes). Test rig: worktree API `localhost:4611` + UI proxy `localhost:4612`, scratch deck `a00dbcbb-36a9-4d8c-9ad9-4d4cbda48d1c`.

**Spec:** `docs/superpowers/specs/2026-08-03-ai-workspace-phase2-core-interaction-design.md` — read it before any task; it is the contract.

## Global Constraints

- Design language: existing tokens ONLY. Mint (`--c-accent`) appears solely on primary/affirmative actions (Accept, Apply, Send), the working pulse, and the score ring fill. Hairlines `rgb(var(--c-edge) / .16)`-ish per existing conventions. No new fonts, colors, gradients, shadows beyond app.css patterns. Both themes must work (the token system does this if you never hardcode).
- Motion: one 160ms ease-out entrance per new card; pulsing working dot; everything inside `@media (prefers-reduced-motion: reduce)` guards OFF.
- The host contract is frozen except the four touchpoints in the spec. Undo/redo, autosave, review bar, canvas preview (`state.phase === "review"` gating, `.is-preview`/`data-ed-prev` painting), sessionStorage thread, all backend endpoints: UNCHANGED.
- `node --check` on every touched JS file after every task; live browser check per task on the test rig (controller may do this if the implementer lacks a browser tool — say so in the report).
- Accessibility baseline per spec: cards are `article[aria-label]`, `#ai-status` announcements maintained, real buttons, focus-visible.
- CSS class naming: keep the `ed-ai__*` root; new card classes use `ed-item`, `ed-item__head`, `ed-item__chip`, etc. Old classes that lose their purpose are DELETED (no dead CSS).

---

### Task 1: Work-item state + feed skeleton

**Files:**
- Modify: `product/ui/editor-ai/conversation.js` (state shape)
- Modify: `product/ui/editor-ai/panel.js` (feed rendering)
- Modify: `product/ui/editor-ai/composer.js` (item creation in sendAi)
- Modify: `product/ui/editor-ai/proposals.js`, `structural.js`, `review.js` (state-field access shims)
- Modify: `product/ui/editor-ai/editor-ai.css`

**Interfaces:**
- Produces: `stateFor(slideId)` now returns `{ phase, items: [], thread }`. Helper exports from conversation.js: `newItem(state, {kind, ask, scopeLabel})` → item (unshifts, caps at 8), `activeRewriteItem(state)` → newest kind:"rewrite" item with status "ready"|"working" or null. Item shape per spec (id via crypto.randomUUID(), status transitions working→ready→applied/partial/discarded, or →cancelled/→error).
- Consumes: existing module internals (Phase 1 layout).

- [ ] **Step 1:** In conversation.js, replace the old state factory (`proposals/layoutOps/structural/advice/error/notice/recent/steps/lastAsk`) with `{ phase: "idle", items: [], thread: loadThread(slideId) }`, add `newItem`/`activeRewriteItem`, and migrate `stateFor` callers module-wide: proposals.js reads `activeRewriteItem(state)?.payload.proposals` where it read `state.proposals` (applyCanvasPreview, updateReviewBar, accept/discard paths), structural.js and review.js will be fully reworked in Tasks 3–4 but must keep compiling — give them minimal mechanical adaptations now (their payloads live on the items created by composer.js).
- [ ] **Step 2:** In composer.js `sendAi`: create a work item at send time (`kind` from STRUCTURAL_HINT/action as today, ask text, scopeLabel from currentScope()), status "working", store `steps` on the item; on response, fill `payload`, `elapsedMs`, status "ready" (or "error" + error message on catch; keep the notice semantics as an advice-kind auto-item only when the model returned nothing). Remove `state.lastAsk` (the item carries the ask). The one-in-flight `busy` gate stays.
- [ ] **Step 3:** In panel.js `renderAiPanel`: render `state.items` newest-first as placeholder cards — `article.ed-item[data-kind][data-status]` with header (ask, status chip, relative time) and a raw payload summary line; deck review still renders via getDeckReview() at feed top (unchanged pending Task 4). Keep empty state, aiStatus announcements, Clear button (now clears `state.items` + preview), and `applyCanvasPreview()` call.
- [ ] **Step 4:** CSS: `.ed-item` base card (hairline, radius per app conventions, entrance animation + reduced-motion guard), status chip variants, feed spacing. Delete `.ed-ai__recent*` styles (recent list is absorbed).
- [ ] **Step 5:** `node --check` all touched files; browser: two sequential asks produce two cards, both visible, newest first; accept/preview still works through the shims; console clean.
- [ ] **Step 6:** Commit `feat(editor-ai): work-item feed model + skeleton rendering`.

### Task 2: Rewrite card — per-row proposals, diff on demand, partial state

**Files:**
- Modify: `product/ui/editor-ai/proposals.js` (buildRewriteCard replaces buildDiffEl)
- Modify: `product/ui/editor-ai/panel.js` (dispatch by kind)
- Modify: `product/ui/editor-ai/editor-ai.css`

**Interfaces:**
- Produces: `buildRewriteCard(item)` export; proposal rows carry `rowStatus: "pending"|"applied"|"discarded"`; item status derived: all applied → "applied", mix → "partial", all discarded → "discarded", any pending → "ready".
- Consumes: Task 1 item model; existing acceptProposal/acceptAllProposals/discardProposals logic (rework in place: they now operate on `item.payload.proposals` rows and set rowStatus instead of removing rows; the canvas preview paints only PENDING rows of the active item).

- [ ] **Step 1:** Rework accept/discard: accepting a row runs the existing writeField path; on success set rowStatus "applied" (keep the row rendered as a muted ✓ line: label + final text snippet); discard sets "discarded" (strikethrough label, no text). Update `applyCanvasPreview`/`updateReviewBar` to count only pending rows. `state.phase` leaves "review" when no pending rows remain across items.
- [ ] **Step 2:** buildRewriteCard: header per spec (glyph, ask, chip, sub-line with scopeLabel · relative time · elapsed); body rows: field label + human summary (reuse the words→words logic) + Accept/Edit/Discard + per-row Diff toggle (word-level diff, existing markWords); footer Accept all / Discard all only when ≥2 pending. Edit keeps the inline textarea behavior.
- [ ] **Step 3:** Field-label chips: each row's label is a chip; mouseenter/mouseleave call `ctx.iface.highlightField(field, true/false)` (STUB until Task 5 — call only if the iface member exists: `ctx.iface.highlightField?.(...)`).
- [ ] **Step 4:** CSS for rows, chips, diff blocks (evolve `.ed-diff__line` styles into `.ed-item` scope), applied/discarded row treatments. Delete unused `.ed-diff` styles when nothing references them.
- [ ] **Step 5:** Browser: ask → accept one row (muted ✓ stays), discard another (strike), card flips to "partial"; accept-all path; undo still works; preview counts only pending. Commit `feat(editor-ai): rewrite work-item card with row lifecycle`.

### Task 3: Working card + cancel; error card + retry/edit-ask

**Files:**
- Modify: `product/ui/lib/api.js` (optional `{signal}` on assistEditorSlide, planSlideChange)
- Modify: `product/ui/editor-ai/composer.js` (AbortController; cancelled/error item states)
- Modify: `product/ui/editor-ai/thinking.js` (steps render inside the working card; Cancel button)
- Modify: `product/ui/editor-ai/panel.js`, `editor-ai.css`

**Interfaces:**
- Produces: working card = `.ed-item[data-status="working"]` containing steps + elapsed + Cancel; `cancelCurrent()` in composer.js aborts the in-flight fetch, sets item status "cancelled", clears busy. Error/cancelled cards expose Retry (re-send verbatim: `sendAi(item.ask, actionFor(item))`) and Edit ask (`ctx.composer.draft(item.ask)`).
- Consumes: request() in api.js — add `signal` pass-through to fetch options for the two wrappers only.

- [ ] **Step 1:** api.js: the two wrappers accept an optional trailing options object member `signal`, forwarded into `request`'s fetch init. AbortError must surface distinguishably (rethrow as-is).
- [ ] **Step 2:** composer.js: one module-level AbortController per send; on abort, catch AbortError → status "cancelled" (NOT "error"), stopSteps, setBusy(false), render. Cancel of a structural plan call likewise. Ensure a late-arriving response for a superseded/cancelled item is ignored (guard by item id).
- [ ] **Step 3:** thinking.js: steps/elapsed render into the working item's card body (buildStepsEl gets the item's steps; startSteps targets the card's elements — keep the single global timer, there is only ever one working item). Cancel button wired to cancelCurrent().
- [ ] **Step 4:** Error path: status "error" + item.error text; card body shows the message; Retry/Edit-ask actions. Delete the old `.ed-ai__error`/`.ed-ai__retry` block styles once unreferenced.
- [ ] **Step 5:** Browser: cancel mid-working (card stays as cancelled, composer re-enabled, Retry works); error via fetch monkey-patch (Retry + Edit ask both work; input preserved). Commit `feat(editor-ai): cancellable working card + error work items`.

### Task 4: Layout + review cards as work items

**Files:**
- Modify: `product/ui/editor-ai/structural.js`, `review.js`, `panel.js`, `editor-ai.css`

**Interfaces:**
- Produces: `buildLayoutCard(item)` (structural plan and/or layoutOps rows; Apply/Discard semantics unchanged; applied → status "applied" with template name recorded); `buildReviewCard(review)` (score ring SVG 40px stroke-dasharray on mint, minutes, summary, severity-chip issue rows, Fix, Dismiss). Review stays deck-global at feed top (not an item — it renders above items on every slide while present, exactly today's visibility).
- Consumes: item model; existing applyStructuralPlan/applyLayoutOp logic unchanged beneath the new renderers.

- [ ] **Step 1:** structural.js: renderers become card-shaped; applying sets the owning item's status "applied" (record `Layout → <template>` as the card's outcome line); discard → "discarded". Multiple layoutOps rows behave like proposal rows (rowStatus).
- [ ] **Step 2:** review.js: buildReviewCard with score ring (inline SVG circle, `stroke-dasharray` proportion, mint stroke, muted track), severity chips (`data-sev` colors from existing danger/warn tokens + muted), unchanged Fix/Dismiss handlers.
- [ ] **Step 3:** panel.js dispatch: kind "layout" → buildLayoutCard; review block → buildReviewCard. Advice items render as a quiet "Notes" card.
- [ ] **Step 4:** Browser: structural ask → layout card → Apply → applied state + undo; deck review → ring + issues → Fix produces a rewrite item on the target slide; Dismiss. Commit `feat(editor-ai): layout and review work-item cards`.

### Task 5: Context chip row + canvas hover highlight (host touchpoints)

**Files:**
- Modify: `product/ui/editor.js` (iface: clearSelection, highlightField; ~10 lines)
- Modify: `product/ui/app.css` (`.is-ai-hint` beside `.is-preview` styles)
- Modify: `product/ui/editor-ai/conversation.js` (renderAiScope → chip row), `editor-ai.css`
- Modify: `product/ui/editor.html` ONLY if the scope element needs a container class (ids preserved)

**Interfaces:**
- Produces: `iface.clearSelection()` (wraps editor.js's existing clearSelection), `iface.highlightField(field, on)` (toggles `.is-ai-hint` on `.ed-editable[data-ed-field="<cssEscaped>"]` spans). Chip row: `Presentation · Slide N · [<label> ×]`; × → clearSelection.
- Consumes: currentScope() levels (slide/object/visual).

- [ ] **Step 1:** editor.js: add the two actions to the iface object; `.is-ai-hint` style: 1.5px mint outline at .45 alpha, no layout shift (outline-offset), removed automatically by canvas rebuilds (transient class, acceptable).
- [ ] **Step 2:** conversation.js renderAiScope builds the chip row; element chip only at object/visual level; keyboard-accessible × button (aria-label "Clear selection").
- [ ] **Step 3:** Wire Task 2's row-chip hover to the real highlightField.
- [ ] **Step 4:** Browser: select element → chip appears → × clears selection and chip; hover a proposal field chip → canvas outline appears/disappears. Commit `feat(editor-ai): context chip row + canvas field highlighting`.

### Task 6: Composer + empty state restyle, polish pass

**Files:**
- Modify: `product/ui/editor-ai/panel.js`, `composer.js`, `editor-ai.css`

**Interfaces:** none new — visual + copy pass.

- [ ] **Step 1:** Empty state: example chips in the card language, review CTA as a quiet card, canvas hint line; composer restyle (hairline field, mint send, focus ring per app conventions). Placeholder cycles two scope-appropriate hints (plain rotation on scope change, no timer).
- [ ] **Step 2:** Sweep: spacing rhythm top-to-bottom, chip/status color audit in BOTH themes (toggle `data-theme`), reduced-motion audit, focus-visible audit, delete every now-unreferenced legacy class from editor-ai.css (grep before deleting).
- [ ] **Step 3:** Browser screenshot both themes; console clean. Commit `feat(editor-ai): composer + empty state restyle, visual polish`.

### Task 7: Full verification pass (controller)

- [ ] Walk the spec's verification list end-to-end on the test rig, including host-contract regressions (undo/redo, review bar counts, canvas preview, ⌘K, slide-switch state isolation, thread persistence across reload, feed non-persistence across reload). Fix regressions via fix-round dispatches; ledger everything; commit any fixes.
