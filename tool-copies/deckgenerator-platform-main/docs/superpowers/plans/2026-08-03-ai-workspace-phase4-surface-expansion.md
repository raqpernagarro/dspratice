# AI Workspace Phase 4 — Surface Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intention library driving the empty state, follow-up chips on settled cards, and inline quick actions (floating toolbar + right-click) — the AI reachable without the sidebar.

**Architecture:** New `product/ui/editor-ai/intents.js` as the single source of intent copy (empty-state intents, follow-up rules, quick-action prompts). panel.js consumes it for the empty state and follow-ups; editor.js imports the quick-action prompts (one-way import) for `#ed-float` and the canvas context menu.

**Tech Stack / rig:** as prior phases (API 4611, proxy 4612, deck a00dbcbb-36a9-4d8c-9ad9-4d4cbda48d1c).

**Spec:** `docs/superpowers/specs/2026-08-03-ai-workspace-phase4-surface-expansion-design.md` — read first, it is the contract.

## Global Constraints

- No `Math.random`/time-of-day timers for rotation — deterministic from slide index + date string.
- Follow-up chips DRAFT (never auto-send); quick actions SEND (by design). Both scoped by the existing selection/scope machinery.
- Tokens only; chips match existing chip language; focus-visible; both themes; no new animations.
- Phase 2/3 behavior unregressed. `node --check` per task; rig check per task.

---

### Task 1: intents.js + empty-state rotation

**Files:** Create `product/ui/editor-ai/intents.js`; Modify `panel.js`, `editor-ai.css` (only if chip layout needs it).

**Interfaces:** intents.js exports `emptyStateIntents({scopeLevel, slideIndex})` → 4 strings (slide scope: ≥1 tagged structural + ≥1 audience; deterministic rotation by slideIndex + `new Date().toISOString().slice(0,10)`), `QUICK_ACTIONS` = {shorter, improve, expand} prompt strings, `followUpsFor(item)` → string[] (Task 2 consumes; implement the rules table now). Library ~24 intents with tags per spec §1 (write the full copy — final wording, no placeholders).

- [ ] intents.js with the full library + selectors; panel.js empty state uses emptyStateIntents (element scope keeps its 3 short intents, sourced from the library too).
- [ ] Rig: empty state rotates across slides, structural+audience always present; drafting works. Commit `feat(editor-ai): intention library + rotating empty-state intents`.

### Task 2: follow-up chips on settled cards

**Files:** Modify `proposals.js` (rewrite card), `structural.js` (layout card), `review.js` (Fix-flow rule input), `panel.js` (newest-settled detection), `editor-ai.css`.

**Interfaces:** `followUpsFor(item, {nextReviewIssue})` from intents.js; "Next:" chip row rendered ONLY on the newest item with status applied/partial; chips call `ctx.composer.draft(text)`. "Fix the next issue" only when a stored review has an unresolved issue (review.js exports a helper for the next issue's fix text; resolved = its fix was sent — track sent fixes per session in review.js, simple Set).

- [ ] Implement + rig-verify (accept a proposal → Next row appears on that card only; older cards never show it; chips draft). Commit `feat(editor-ai): follow-up chips on the newest settled card`.

### Task 3: inline quick actions

**Files:** Modify `product/ui/editor.html` (#ed-float 3 buttons), `product/ui/editor.js` (handlers + context-menu items in openCanvasMenu; import QUICK_ACTIONS from ./editor-ai/intents.js), `app.css` (float button styling per existing float conventions if needed).

**Interfaces:** buttons call `ai.sendAi(QUICK_ACTIONS.x, "rewrite")`; disabled + title "AI is working on this slide" while the current slide has a working item (expose `ai.slideBusy()` from index.js/composer.js if not already derivable — add minimal accessor); context menu adds the same three under "Ask AI about this".

- [ ] Implement; rig-verify (select element → toolbar shows quick actions → Shorter sends scoped ask → proposals land; right-click menu same; disabled while working). Commit `feat(editor): inline AI quick actions (toolbar + context menu)`.

### Task 4: verification pass (controller)

- [ ] Spec verification list + Phase 2/3 regression spot-checks; fix-rounds as needed; ledger; commit fixes.
