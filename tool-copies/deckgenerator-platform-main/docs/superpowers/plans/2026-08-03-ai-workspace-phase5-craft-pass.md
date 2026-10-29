# AI Workspace Phase 5 — Craft Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every deferred minor, harden accessibility to AA, sweep out MVP artifacts, and land the final polish — no new features.

**Architecture:** All work inside `product/ui/editor-ai/` + the minimal host CSS/copy it already owns. Three tasks: (1) a11y hardening, (2) deferred-minors + polish sweep, (3) full regression + handoff to the whole-branch final review.

**Spec:** `docs/superpowers/specs/2026-08-03-ai-workspace-phase5-craft-pass-design.md`. Rig: API 4611, proxy 4612, deck a00dbcbb-36a9-4d8c-9ad9-4d4cbda48d1c.

## Global Constraints

- NO new features, no behavior changes beyond the named fixes; tokens only; mint affirmative-only; both themes; `node --check` per task; rig verification per task.

---

### Task 1: Accessibility hardening

**Files:** Modify `product/ui/editor-ai/*.js`, `editor-ai.css`, `product/ui/editor.html` (ARIA attributes only), `app.css` (contrast alphas only if needed).

- [ ] Keyboard walk (implement fixes): logical order, no traps, Escape closes inline proposal editor and memory delete-confirm; verify strip/chip/memory/tab order follows the visual order.
- [ ] ARIA: card labels include kind+ask+status (update on status change); #ai-status announces accept/discard outcomes too ("Headline updated." / "Suggestion discarded."); score ring gets role="img" aria-label "Presentation score N of 100"; pin toggles aria-pressed; diff toggles aria-expanded (exists — verify); task-strip rows labeled ("Cancel the task on slide 3").
- [ ] Contrast: programmatically compute (in the rig console) the rendered contrast of status chips, muted text, severity chips in both themes; fix any < 4.5:1 (text) / 3:1 (UI) via token alphas.
- [ ] Reduced-motion re-audit. Commit `fix(editor-ai): accessibility hardening (keyboard, ARIA, contrast)`.

### Task 2: Deferred minors + MVP sweep + pixel polish

**Files:** Modify `product/ui/editor-ai/*.js`, `editor-ai.css`, `app.css`.

- [ ] Ledgered fixes: neutral hover on non-affirmative `.ed-item__btn`; layoutOps liveSlide-gated on deletion + neutral drop copy ("The slide changed before the suggestions landed."); "Fix the next issue" chip title noting it stays until run.
- [ ] Copy sweep: one calm voice, no debug words, no exclamation marks (read every user-facing string in the module).
- [ ] Dead-code sweep: two-way grep of every module class; delete orphans (JS and CSS).
- [ ] Pixel pass at 320–420px rail widths + stacked narrow layout, both themes; fix spacing/alignment drift; ensure status changes don't cause layout jumps.
- [ ] Commit `fix(editor-ai): deferred minors + polish sweep`.

### Task 3: Full regression + mixed-payload spot-check (controller)

- [ ] Seed/exercise a mixed proposals+layoutOps card (rig ask crafted to move + rewrite, or seeded state) — dual-row lifecycle correct.
- [ ] Union of P2/P3/P4 verification lists end-to-end; keyboard-only session; both themes; reduced-motion (emulate via rig); console + interval-leak check (idle after settle).
- [ ] Ledger; fixes via fix rounds; then whole-branch final review (separate dispatch).
