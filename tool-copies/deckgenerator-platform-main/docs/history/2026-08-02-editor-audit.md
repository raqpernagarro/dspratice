# Editor Audit — 2026-08-02

Deep audit of the Editor (editor.js/.html, editable-canvas, slide-fields, editor AI
backend). Prioritized backlog; ✔ = fixed in the 2026-08-02 batches.

## Critical — data integrity
- ✔ E4/E5 fieldKind blind spots (`array<…>`, `string[][]`, `{a,b}`, bare object/array)
  misclassified 19 templates' structured fields as text → AI could blank slides or 422
  every request. Fixed in BOTH copies; verified 318/318 fields agree.
- ✔ E2 asset/color fields were sent to the AI as plain strings (rewritten URL/hex passes
  every render check). Now excluded via key/value heuristics.
- ✔ C4 item duplicate/delete persisted un-accepted AI preview text (reads live DOM).
- ✔ A3 failed Accept dropped the proposal and logged "updated".
- ✔ C6 edits within the 900 ms debounce were lost on Done/Back/close; now flushed
  (awaited on deliberate exits).
- ✔ E12 committed values are trimmed (indented template interpolation shipped to PPTX).
- ✔ E11 content decoration excludes .footer/.logo (chrome/content text collisions).
- ✔ E13 footer commit persists only the edited cell.

## High — editability reach (REMAINING, biggest next win)
- E1 ~15% of schema targets never bind on canvas (media fields rendered as `src=`/`style=`
  across 21 templates): needs an image/color affordance (click img → replace URL; color
  swatch for accent/color fields) + an "unbound fields" inspector using decorateSlide's
  already-returned matched/total (E6/D9).
- E3 multi-node values (headline with `\n` → `<br>`, body split into `<p>`s) never bind —
  fall back to wrapping the ELEMENT whose textContent equals the value.
- E7 speaker notes exist in the data, have no UI anywhere.
- E8 nesting >1 level invisible (cost-table cells, bars[].front).
- E9/E10 duplicate default text can bind to the wrong node; editor and exporter can
  disagree (schema-order vs content-order competition sets) — pre-sort targets by first
  document-order occurrence in BOTH editable-canvas.js and js/style-overrides.js.

## High — direct manipulation
- ✔ C1 duplicate double-bound sibling listeners (compounding commits/history).
- ✔ C5/U2 selection now survives canvas rebuilds (re-selected or honestly dropped).
- ✔ U1 undo/redo navigate to the affected slide first.
- ✔ C7 Escape reverts only (no longer also clears selection).
- C2 duplicate keeps stale data-ed-index → style keys collide; length changes drop all
  `field[i]` overrides. C3 findItemRoot can duplicate wrapper containing OTHER fields'
  spans (phantom items committed later). C10/C11 drag: no clamping/guides, no pointer
  capture. C14 Tab-focus on a span is not a selection. C15 dblclick loses word-selection.
- C8 no multi-select / element copy-paste / cut. C9 no resize handles; italic/900/petrol
  styles exist but have no controls.

## High — AI workspace (REMAINING, next batch)
- A1 no conversation memory (each send is a stateless CLI call; no thread, no --resume).
- A2 1 of 18 assist actions reachable (advice actions incl. speakerNotes have no UI;
  ADVICE_ACTIONS + half of stepsFor are dead code, D8).
- A4 send captures slide at send time; user typing during the 5–120 s request is clobbered
  by Accept (diff shows their text as "before").
- A5 review bar desyncs after ⌘Z with proposals pending (preview not re-applied on rebuild).
- A7 no cancel/retry; whole editor busy up to 120 s. A8 scope is prose (whole slide still
  sent; item-level scope impossible). A10 steps are theatre (fixed 1100 ms interval).
- A11 diffs noisy (positional word-marking); A12 list preview doesn't show added/removed
  items; A16 proposal editor bare (no ⌘Enter/Escape/label).
- ✔ A3, ✔ A6 (composer ate messages while busy), ✔ A13 (status mislabeled as Notes).

## Medium — undo/redo
- U3 whole-map style snapshots resurrect stale state on interleaved undo/redo.
- U4 every debounce burst = separate undo entry (no coalescing; style path has the
  pattern to copy). U5 ⌘Z can race an in-flight text commit. U6–U10 smaller.

## Medium — performance
- P1 footer keystroke repaints every thumbnail (60-slide deck = 60 buildStage per pause).
- P2 every structural op re-renders the whole rail; P3 N forced layouts per rail render.
- P4 drag does 2×structuredClone + up to 4×getComputedStyle per unthrottled mousemove.
- P5 duplicated scroll listeners; P7 aiStates/rowRegistry growth; P8 palette rebuilds per
  keystroke.

## Medium — accessibility
- ✔ X1 focus-visible on all editor controls (CSS pass).
- X2 style panel is a fake dialog (no aria-modal/trap/return; .is-on has no aria-pressed).
- X3 floating toolbar keyboard-unreachable; X4 rail reorder is drag-only (needs ⌥↑/↓);
- X5 menus lack arrow-key nav/focus return; X6 spans lack roles/labels; X7 palette listbox
  malformed; X8 no focus restore on modal close; X9 contrast failures (hint/label/del-line
  under 4.5:1); X10 busy state mouse-only; X11 hard-coded ⌘ labels.

## Code quality
- ✔ D1 toast duplicate. D4 fieldKind duplication remains (now in sync; needs a shared
  test). D5 three write() closures; D6 four modal keydown blocks; D13 2600-line module →
  split (editor-rail / editor-canvas / editor-style / editor-ai / editor-palette);
  D8 dead advice actions; D11 commitDeckFieldNow forward path skips the undo path's
  renderCanvas; D14 spacePanning dual ownership (C12 stuck pan on window blur).

## Roadmap (remaining, by impact/effort)
1. Editability reach: E3 element-level binding, E1 image/color affordances, E7 notes UI.
2. AI: A2 expose advice actions as chips, A4 stale-content guard, A7 cancel/retry,
   A1 conversation thread (client-side transcript first, --resume later).
3. Manipulation: C2/C3 index refresh + strict item roots, C8 copy/paste, C14 focus=selection.
4. Perf P1–P4; A11y X2–X5; then D13 module split.
