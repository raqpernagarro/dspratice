# AI Workspace Redesign — Phase 5: Craft Pass

Phase 5 of 5 — the closing quality pass over everything Phases 1–4 built.
Executed autonomously. Scope from the original brief: accessibility (§12),
performance sanity (§13), microinteractions (§14), error-experience
completeness (§15 residuals), MVP-artifact removal (§16), pixel polish
(§17), plus every minor deferred in the phase ledgers.

## 1. Accessibility hardening (WCAG AA target)

- Full keyboard walk of the panel: composer → context chips → memory →
  health chip → task strip → every card action, in a logical DOM order; no
  traps; Escape closes transient states it should (inline editors, delete
  confirm).
- Focus-visible audit on every interactive element (already largely done in
  P2/P4 — verify and close gaps).
- Screen-reader pass: every card `article[aria-label]` includes kind + ask
  + status; `#ai-status` announces working/landed/cancelled/error and
  accept/discard outcomes; chips and toggles have accurate labels/pressed/
  expanded states; the score ring has a text alternative.
- Contrast check of status chips, muted text, and severity chips in BOTH
  themes against AA (tokens only — adjust alphas where needed).
- Reduced-motion re-audit (every animation guarded).

## 2. Deferred-minors closeout (from phase ledgers)

- `.ed-item__btn:hover` mint tint on non-affirmative buttons → neutral
  hover; mint stays affirmative-only.
- layoutOps settle path not liveSlide-gated on slide deletion + the
  "edited that text" drop-copy being wrong for deletions → gate ops like
  content proposals; neutral copy ("The slide changed before the
  suggestions landed.").
- Mixed proposals+layoutOps live spot-check (one rig run that returns both,
  or a seeded-state verification of the dual-row card).
- "Fix the next issue" chip: note in a title that it re-offers until the
  fix is actually run (documented-intentional; make it visible).

## 3. MVP-artifact and polish sweep

- Kill remaining debug/placeholder language anywhere in the panel copy;
  one voice throughout (calm, specific, no exclamation marks).
- Dead CSS/JS sweep: grep every `ed-ai__`/`ed-item`/`ed-memory`/`ed-steps`
  class both ways (CSS↔JS/HTML); delete orphans.
- Spacing/alignment pixel pass in both themes at panel widths ~320–420px
  (the rail) and the narrow-viewport stacked layout.
- Microinteraction check: hover/active states consistent; the one entrance
  animation feels right at 160ms; accept → applied transition reads
  clearly; no layout jumps when cards change status (reserve space where
  cheap).

## 4. Performance sanity (§13 scoped honestly)

Feed is capped at 8 items/slide — no virtualization needed. Verify: no
full-canvas rebuilds triggered by panel-only renders; renderAiPanel work is
O(items); the elapsed ticker touches only text nodes; no interval leaks
(idle profile after all tasks settle).

## Out of scope

New features of any kind; backend changes; the export pipeline; deck
templates.

## Verification

Full end-to-end regression on the rig (the union of the P2/P3/P4
verification lists), keyboard-only session, both themes, reduced-motion,
console clean — followed by the whole-branch final review.
