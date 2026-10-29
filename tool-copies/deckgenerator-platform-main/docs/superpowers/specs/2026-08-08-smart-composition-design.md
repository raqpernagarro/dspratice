# Smart Composition + Live Build View — Design

**Date:** 2026-08-08
**Status:** Approved (user pre-authorized execution; priorities confirmed: art direction >
content understanding > visual self-review > copy fitting, plus live progress instead of
the spinner)

## Problem

Composition treats each slide mostly in isolation: regex "signatures"
(`content-signature.js`) approximate what a slide is, `shortlistFor` scores templates
per-slide, and the model chooses within batches. There is no deck-level story planning,
no verification that the rendered result actually looks right, and while the 2-10 minute
build runs the user sees only a spinner.

## Goal

Decks read as designed narratives (opening, sections, emphasis, rhythm), templates are
chosen from real understanding of the content, rendered slides are checked and the worst
repaired — within ~10 minutes for a 15-slide deck — and the user watches the build
happen: stages, per-slide status, and what's being decided.

## Design

### 1. Live build progress (foundation — lands first, wraps every pass)

- `generationRepository` gains a mutable `progress` field:
  `{ stage, detail, done, total, slides: [{n, title, state}], updatedAt }` where `state`
  ∈ `pending | analyzing | choosing | writing | reviewing | done | fallback`.
- Compose pipeline threads a `tick(progressPatch)` sink (same pattern as the existing
  `note()` warnings sink) through `composeSlides` / `composeImportedSlides` /
  `composeDeck` / `composeImportDeck`. Writes are throttled (≥1s apart) and never fail
  the build (fire-and-forget repository update).
- Stages: `analyzing content → planning the deck → choosing layouts (batch i/j) →
  writing slides (i/j) → reviewing the result → assembling`.
- UI: `approveAndWait`'s `onProgress` callback now also receives the polled record's
  `progress`. The home composer replaces the spinner with a **build timeline**: stage
  list with the active stage highlighted, a per-slide status strip (one cell per slide,
  colored by state, title on hover), and the current detail line ("Choosing layouts for
  slides 7–12 of 19"). The library page shows `stage — detail` in its import toast line.
- Backward compatible: records without `progress` render the old spinner text.

### 2. Content understanding pass (replaces regex signatures as the primary signal)

- New provider method `analyzeOutline({ title, outline })` → per-slide
  `{ kind, keyClaim, dataPoints, tone, visualNeed, weight }`, where `kind` is one of the
  signature vocabulary the scorer already understands (numeric, sequence, comparison,
  people, quote, agenda, awards, visual, assertion, content), `visualNeed` 0-2, `weight`
  = how central the slide is to the deck's argument (0-2). Batched under the prompt
  budget; JSON-schema'd like the other calls.
- Analysis **augments** `contentSignature` output: `sig.kind` maps onto the existing
  boolean wants (isNumeric, isSequence, …) before `shortlistFor`; regex signals remain
  as fallback when the pass fails (warning, not error). No scoring-table changes.
- Cached on the generation record (`analysis` field) so retries/re-approvals reuse it.
- Runs for both prompt and import paths (import already has element inventories; the
  analysis sees them).

### 3. Deck-level art direction pass

- New provider method `planDeck({ title, outline, analysis })` → one call returning
  `{ sections: [{ from, to, title }], emphasis: [n…], dark: [n…], pace: { n: "dense" |
  "breather" }, dividers: [{ after, title }] }`.
- The plan drives:
  - **Dividers:** up to `floor(slides/6)` chapter-divider slides may be inserted at
    section boundaries (divider/toc-role templates; titles from the plan). Import mode
    included — dividers add structure, never content. Each inserted divider is marked in
    warnings-free progress detail ("Added a section divider: 'The Approach'").
  - **Dark placement:** plan's `dark` list replaces the model's per-batch theme
    judgement for middle slides (bookends stay forced dark; `DARK_SAFE` still gates).
  - **Shortlist steering:** `emphasis` slides get statement/fullbleed roles boosted in
    their wants; `pace` hints ride into the choice prompt ("this slide is a breather —
    prefer airy layouts").
  - **Choice-pass context:** each batch prompt gets a 3-4 line deck brief (sections +
    where this batch sits in the story) so batches stop being story-blind.
- Failure → warning + compose exactly as today.

### 4. Visual self-review loop (render, measure, repair the worst)

- After slides are built but before `createPresentation`, render each slide headlessly
  via the existing export-runtime machinery (Playwright + `capture.html` against the
  running server's own origin — reuse the exporter's launch/mount path, screenshots not
  needed: DOM measurement only).
- **Hard defects only** (per the CLAUDE.md verify-your-detector rule, thresholds match
  the proven audit tools): text overflowing its box (scroll > client), content off the
  1920×1080 canvas, and >300px dead vertical bands. No aesthetic scoring.
- Up to 4 worst slides get one repair round each: refill with tightened budgets
  (existing gap-fill machinery) or fall back to the slide's next shortlist candidate;
  re-measure; keep whichever of old/new measures better. Every repair (or failed
  repair) → `composeWarnings` entry + progress `reviewing` state.
- Time-boxed: the whole loop aborts (warning) at 3 minutes. If Playwright/capture is
  unavailable, skip with a warning — never fail the deck.

### 5. Copy fitting

- Fill/import prompts gain: parallel-structure instruction for card grids and column
  lists ("sibling entries share grammatical shape and length"), and the plan's pace
  hint per slide.
- The repair path (from §4 overflow cases) re-asks with explicit per-field char budgets
  derived from the template example (reuse `sizeGuidance`).

## Sequencing & degradation

Passes run: analyze → plan → choose+write (existing, enriched) → visual review →
assemble. Every new pass is individually optional: any failure emits a warning and the
pipeline continues with today's behavior. Prompt-generation and import paths share the
analyze/plan/review passes; import keeps its fidelity contract (analysis informs layout,
never rewrites content).

## Out of scope

- Streaming partial slides/thumbnails to the UI during compose (slides persist only at
  the end; the timeline + per-slide states cover the visibility need).
- Vision-model critique of screenshots (DOM measurement is deterministic and proven).
- Scoring-table redesign (KNOWN_SHAPES etc. is Project A).

## Acceptance

- A 12+ slide prompt-generated deck and the 19-slide motivating import both compose
  with: visible staged progress in the UI (no bare spinner), a plan-driven structure
  (≥1 section divider when sections exist, dark emphasis within DARK_SAFE), zero
  hard-defect slides after review (or a warning naming each), within 10 minutes.
- Suite green; every new pass has failure-path tests (stub provider) proving the deck
  still ships when a pass dies.
