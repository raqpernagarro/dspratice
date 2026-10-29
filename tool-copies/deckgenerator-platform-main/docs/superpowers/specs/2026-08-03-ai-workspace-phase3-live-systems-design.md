# AI Workspace Redesign — Phase 3: Live Systems

Phase 3 of 5. Builds on the Phase 2 work-item feed. Executed autonomously per
the user's standing instruction. Scope: the "task queue" (§5), always-visible
presentation health (§6), and AI memory (§8) from the original brief — sized
to what the current architecture supports without destabilizing it.

## 1. Live tasks: per-slide concurrency + task strip

Today one global `busy` flag blocks the composer everywhere while any AI call
runs, and a running task is invisible from other slides.

Changes:

- **Per-slide in-flight gate.** The global one-request rule becomes one
  in-flight AI request *per slide* (the racing hazard was always per-slide
  proposal state; requests to different slides are independent CLI
  processes). `sendAi` refuses only when the CURRENT slide already has a
  working item. Deck review keeps its own single-flight guard.
- **Host `busy` decouples from AI.** `setBusy` today also freezes slide
  navigation/actions during AI calls via the shared flag. AI requests stop
  setting the global busy; they only disable the composer for their own
  slide (working item present) and the review CTA while a review runs.
  Structural APPLY operations (writes) keep using the global busy exactly as
  today — only the *thinking* phase is freed.
- **Task strip.** A slim strip between the feed and the context chips lists
  every working item across ALL slides: "Slide 3 — Rewriting… 12s · Cancel"
  (click the label → selectSlide; Cancel aborts that task). Hidden when
  nothing runs. Cancelling from the strip behaves exactly like the card's
  Cancel.
- **Multi-controller bookkeeping.** composer.js keeps a Map of
  AbortControllers keyed by item id (replacing the single module-level
  controller); late-response guards already exist per item and stay.

## 2. Presentation health: persistent, glanceable

- **Health chip** in the panel header row (left of Clear): mini score ring
  (18px) + score + "≈ N min". Present whenever a review result is known.
  Clicking it scrolls to / re-opens the full review card (if dismissed, it
  re-renders from the stored result). A "Re-run" action sits on the review
  card as today (the empty-state CTA and ⌘K path remain).
- **Persistence: localStorage** keyed `nps:review:<presentationId>` storing
  `{ review, reviewedAt, updatedAtAtReview }`. Loaded on editor boot; the
  chip and card render from it. No backend change: the review is advisory
  UI state, and the deck's own `updatedAt` gives staleness for free.
- **Staleness.** If `presentation.updatedAt` (or any local edit since load)
  is newer than `updatedAtAtReview`, the chip and card show a quiet "deck
  changed since review" state (dimmed ring + dot); the stored score stays
  visible. Any accepted change flips staleness immediately (hook: the
  existing item-applied paths).
- Dismissing the review card hides the CARD but keeps the chip (the chip is
  the always-visible §6 surface). "Forget review" is not needed — a re-run
  overwrites.

## 3. AI memory

Deck-scoped facts the model should always honor (audience, tone, language,
brand constraints, goal…). Real persistence, backend-backed:

- **Storage:** new `aiMemory` array on the presentation record:
  `[{ id, text, pinned, createdAt }]` (text ≤200 chars, ≤20 entries).
  Repository: `aiMemory` joins the PATCH whitelist (`MUTABLE_FIELDS`),
  stored verbatim (validated shape server-side: array of {id,text,pinned},
  lengths enforced, unknown keys dropped). No new endpoints — it rides the
  existing presentation PATCH + GET.
- **Model integration:** `editor-ai-service.assist()` and
  `planSlideChange()` load the presentation's `aiMemory` and prepend a
  compact block to the instructions: pinned facts first, then others,
  capped at 12 lines: "Standing instructions from the author: …". Provider
  contract unchanged (it's just instruction text).
- **UI:** a collapsible "Memory" section in the panel between the health
  chip row and the feed, collapsed by default showing a count ("Memory · 3").
  Expanded: one row per fact (text, pin toggle, delete ×) + an add field
  (Enter to add). Edits PATCH the presentation (debounced like other saves,
  through the existing api client — add a thin `updatePresentation` usage or
  reuse the existing one if present). Pinned facts sort first.
- Memory is deck-scoped, not per-slide, and survives reloads/machines (it
  lives in the record). Trust note: memory text is injected into the model
  prompt with "follow unless the current ask overrides" framing — it is
  author-controlled and the same trust level as slide content, and outputs
  still land as reviewable proposals. On a shared deck, one editor's
  standing instructions steer every other editor's asks. Undo/redo does NOT cover memory edits (they're not
  slide edits; delete has an inline confirm instead: × turns into "Sure?"
  for 3s).

## Host / backend touchpoints (exhaustive)

- `product/storage/presentation-repository.js`: add `aiMemory` to
  MUTABLE_FIELDS + shape validation on write.
- `product/domain/presentation-service.js`: none (update() path already
  flows).
- `product/domain/editor-ai-service.js`: read `record.aiMemory` in assist()
  and planSlideChange(), prepend the standing-instructions block.
- `product/ui/lib/api.js`: `updatePresentation` PATCH wrapper if missing.
- `product/ui/editor.js`: `iface.getPresentation()` getter (id, updatedAt,
  aiMemory) + `iface.patchPresentation(fields)` action; global-busy decoupling
  for AI *thinking* calls (setBusy no longer called by composer.js sends —
  verify nothing else keyed on it for AI; the review-bar/save flows keep it).
- `product/ui/editor.html`: a container for the health chip / memory section
  if the existing panel header can't host them (ids may be added, not
  removed).

## Out of scope

Cross-slide QUEUING of multiple asks per slide, server-side review storage,
memory auto-extraction from conversation, org/user-level memory, generation
endpoints using memory (only assist + plan), Phase 4 surfaces.

## Verification

Rig pass: two slides with simultaneous asks (strip shows both, cancel one
from the strip, other lands); composer blocked only on the busy slide;
review → chip persists across reload → accept an edit → stale state; memory
add/pin/delete → reload survives → send an ask and verify the instruction
block reaches the provider (inspect request payload / provider prompt log);
undo/autosave/console regressions.
