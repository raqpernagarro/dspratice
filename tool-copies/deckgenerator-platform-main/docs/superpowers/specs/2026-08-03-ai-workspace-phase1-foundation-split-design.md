# AI Workspace Redesign — Phase 1: Foundation Split

## Context

The user requested a complete redesign of the AI Workspace panel and its
interaction model, with the ambition of making it "the best AI editing
experience in any presentation product" — comparable to Cursor, Figma, and
Linear rather than a chatbot embedded in a sidebar. The full request spans
~17 largely independent areas (panel layout, proposal redesign, live
"thinking" states, task queue, persistent AI memory, inline AI, natural
language suggestions, accessibility, performance, microinteractions, error
handling, and a final polish pass).

That scope is too large for one spec or one implementation plan. It has been
decomposed into five sequential phases, each with its own spec → plan →
build cycle:

1. **Foundation split** (this spec) — extract the AI panel into its own
   module with zero behavior change.
2. **Core interaction redesign** — panel hierarchy, work-item cards instead
   of chat bubbles, redesigned proposals, real "thinking" steps, context
   bar, error experience.
3. **Live systems** — task queue, persistent presentation health, AI memory
   panel (new backend store).
4. **Surface expansion** — natural-language suggestion chips, inline AI /
   right-click toolbar, follow-up workflows.
5. **Craft pass** — accessibility, performance, microinteractions, MVP
   artifact removal, pixel polish — applied across everything built in 1–4.

This document specs Phase 1 only.

## Current state

The AI panel has no dedicated module. Its ~900 lines of behavior live
inline inside `product/ui/editor.js` (a 3,594-line file that also owns
canvas rendering, selection, drag/resize, undo/redo, and autosave), roughly
at lines 2528–3450:

- `renderAiPanel()` (2741) — top-level render.
- `sendAi()` (3296) — composer submit.
- `buildStepsEl` / `startSteps` / `stopSteps` (2875–2907) — "thinking" step
  list with elapsed-time ticker.
- `buildDiffEl`, `asLines`, `markWords` (2909+) — GitHub-PR-style diff
  cards for proposals.
- `buildReviewEl` (2979) — deck review score card.
- `buildStructuralEl` / `buildLayoutOpEl` (3013+) — layout-swap / new-slide
  proposal cards.
- `acceptProposal` (2657), `acceptAllProposals` (2679),
  `discardProposals` (2730), `applyCanvasPreview` (2607) — proposal
  lifecycle; preview is painted directly onto canvas DOM via `.is-preview`
  class, original text kept in `data-ed-prev` until Accept/Reject.
- Per-slide conversation thread persisted in `sessionStorage` only
  (`nps:thread:<presentationId>:<slideId>`, capped to last 12 turns) —
  `threadKey` / `loadThread` / `pushThread` (2576–2584).

CSS for the panel (`.ed-ai__*`, `.ed-diff__*`, `.ed-steps__*`,
`.ed-review-card__*`) lives mixed into the shared `product/ui/app.css`.

Backend (out of scope, unchanged by this phase): `product/domain/editor-ai-service.js`,
route `product/application/routes/editor-ai.js`, client wrapper
`product/ui/lib/api.js` (`assistEditorSlide`, `planSlideChange`,
`reviewPresentation`, `generateSlideWithAi`, `suggestFieldMapping`).

The existing audit doc (`issues/2026-08-02-editor-audit.md`) already flags
that `editor.js` needs splitting into `editor-rail` / `editor-canvas` /
`editor-style` / `editor-ai` / `editor-palette`. This phase performs the
`editor-ai` half of that split.

## Goal

Move the AI panel out of `editor.js` into a standalone
`product/ui/editor-ai/` module with **zero behavior change**. This is pure
refactoring: same DOM output, same CSS classes, same UX, same bugs (none
fixed, none introduced) — just relocated and given real boundaries. It
unblocks Phase 2, which needs a real component to redesign rather than
inline functions tangled into the host file.

## Module structure

```
product/ui/editor-ai/
  index.js       createAiPanel(host, aiInterface) → { destroy, refresh }
  panel.js       renderAiPanel() orchestration
  conversation.js  thread rendering, sessionStorage persistence
  composer.js    sendAi(), input handling
  thinking.js    buildStepsEl / startSteps / stopSteps
  proposals.js   buildDiffEl, asLines, markWords, acceptProposal,
                 acceptAllProposals, discardProposals, applyCanvasPreview
  structural.js  buildStructuralEl, buildLayoutOpEl
  review.js      buildReviewEl
  editor-ai.css  .ed-ai__*, .ed-diff__*, .ed-steps__*, .ed-review-card__*
                 (moved out of app.css)
```

`editor.html` gains a `<link>` to `editor-ai.css` alongside `app.css`.

## Boundary: the `aiInterface` object

`editor.js` constructs an explicit interface object and passes it into
`createAiPanel(host, aiInterface)` at init. The AI module never reaches
into `editor.js` internals directly — no shared closures, no shared
mutable module.

```js
{
  getState()              // read-only snapshot: selection, current slide,
                           // active proposals
  actions: {
    applyProposal(...), applyAllProposals(...), discardProposals(...),
    pushUndo(...), writeField(...), ...
    // exact method set = whatever editor.js's current AI-facing state
    // mutators are, renamed/wrapped as needed but not behaviorally changed
  },
  api,                     // existing product/ui/lib/api.js client, passed
                           // through unchanged
  onProposalsChanged(cb)   // subscribe hook so the canvas (owned by
                           // editor.js) can react when proposal preview
                           // state changes
}
```

This is a thin wrapper around state/actions `editor.js` already owns —
not a new global store. `editor.js` keeps owning canvas, selection, and
undo/redo; the AI module only gets what it needs through the interface.

## Explicitly out of scope for Phase 1

- Any visual or interaction redesign (that's Phase 2).
- Fixing known bugs surfaced in the audit doc (e.g. review-bar desync
  after undo) — noted for Phase 2/5, not touched here.
- New backend endpoints or persistence (memory panel is Phase 3).
- Changing the proposal data shape, thread storage mechanism, or any
  wire format.

## Testing / verification

No automated test suite exists for this app (`product/` has no `.test.js`
files). Verification is manual, before/after comparison in the browser:
send a message → accept a proposal → reject a proposal → discard all →
trigger a structural proposal (layout swap / new slide) → run a deck
review → accept a review-issue fix. Each flow should produce identical DOM
output and behavior pre- and post-split.

## Success criteria

- `editor.js` no longer contains AI panel rendering/logic — only the
  `aiInterface` construction and a `createAiPanel()` call.
- All AI panel code lives under `product/ui/editor-ai/`.
- No behavior change: every manual flow above matches pre-split behavior.
- No dead code left behind in `editor.js` from the moved sections.

## Implementation addendum

The built boundary differs slightly from the sketch above:

- `createAiPanel(iface)` returns an object with 10 named methods:
  `renderPanel`, `renderScope`, `stateFor`, `sendAi`, `runDeckReview`,
  `applyCanvasPreview`, `clearCanvasPreview`, `hasPreview`, `focusComposer`,
  `syncSendState`.
- The `iface` passed in by `editor.js` is a flat bag of getters (e.g.
  `getSlides`, `getSelection`) plus host actions (`writeField`, `pushHistory`,
  `renderCanvas`, …) — not a class or a narrower per-concern interface.
- `api` (`./lib/api.js`) is imported directly by the `editor-ai` module; it is
  not threaded through `iface`.
- There is no `onProposalsChanged` hook. The host (`editor.js`) polls
  `ai.hasPreview()` where it needs to know proposal state, instead of
  subscribing to a change event.

Phase 2 should code against this actual boundary, not the original sketch.
