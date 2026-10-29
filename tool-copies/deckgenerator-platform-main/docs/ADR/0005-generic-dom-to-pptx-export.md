# 0005 — Generic DOM-walking exporter instead of per-template export functions

## Status
Accepted (introduced in v1.4). Actively maintained — `tools/EXPORT-NOTES.md`
documents 15 distinct issues found and fixed against this approach, implying
meaningful iteration since it was first built.

## Context
Decks need to leave the browser as an **editable** PowerPoint file (real text
boxes, not flattened images) plus a pixel-exact PDF, so that non-technical
users can tweak wording without touching code. With 91+ templates already
built as arbitrary HTML/CSS (§ ADR 0003), the exporter needed a way to produce
PPTX output without requiring every template author to *also* write and
maintain a second, export-specific rendering path.

## Decision
Build one generic DOM walker (`js/export.js`'s `__extractSlide`) that mounts a
template's normal rendered output at native scale and classifies every element
purely from its **computed CSS** and DOM structure: text-only inline flow →
`text` op; a painted box (background/border/shadow) → `shape` op (or a
rasterized "plate" if it can't be represented natively, e.g. non-uniform
border-radius); an image/SVG/canvas or anything with a CSS transform/mask →
`image` op (screenshotted). `tools/export-pptx.mjs` turns those ops into native
`pptxgenjs` calls. No template ever writes export-specific code — the same
`render()`/`css` used for the live viewer is what gets walked.

## Consequences
- A template author's job is unchanged by the exporter's existence — write
  `render()` + `css` once, per `_CONTRACT.md`, and export "just works" for
  free, or fails in a way that's fixable in the shared walker rather than in
  91+ individual template files.
- The walker has to correctly reverse-engineer intent from computed style
  (is this box actually a circle? is this flex container centering its child?
  is this pseudo-element painting something?) — a fundamentally harder and more
  fragile problem than a template author stating its intent directly. This is
  the direct cause of `tools/EXPORT-NOTES.md`'s issue catalog: circles
  rendering as rounded squares (had to special-case `border-radius: 50%`),
  masked logos rendering as solid black bars (had to detect `mask-image` and
  rasterize), translucent icons exporting fully opaque (had to fold element
  `opacity` into fill alpha), and eleven more.
- A handful of templates are deliberately exempted via `exportAsImage: true`
  (dense rotated-connector diagrams, e.g. slides 38, 78, 79) — an escape hatch
  for content judged not worth teaching the walker to reconstruct as editable
  shapes.

## Benefits
- Single source of truth for "what a slide looks like": the live viewer, the
  dashboard thumbnail, and the exported PPTX/PDF are all derived from the same
  `buildStage()` output (see `docs/ARCHITECTURE.md` §3) — there is no second
  content model that could drift from the first.
- New templates automatically gain export support with zero additional work in
  the common case (plain text, simple boxes, images).

## Trade-offs
- The walker is intricate and its correctness depends on computed-style
  heuristics that don't generalize to every possible CSS feature — any new CSS
  technique used in a future template (a new clip-path, a new blend mode) risks
  silently mis-exporting rather than failing loudly, until someone adds a
  special case (see `docs/ARCHITECTURE.md` §6, known limitations).
- Every element requiring rasterization is captured via an **isolated
  screenshot** (hide the whole stage, show only the target) to prevent
  overlapping siblings from bleeding into the image — this is why export of a
  91-slide deck takes ~2 minutes and produces ~779 image captures; the
  approach trades export speed for template-author simplicity.

## Confidence
**High** for the decision itself and its consequences — extensively documented
first-hand in `tools/EXPORT-NOTES.md`, including the explicit statement that
each entry "cost real debugging time on the 91-slide master stress test." The
framing of this as a deliberate **trade-off** (walker complexity in exchange
for zero per-template export code) is **inferred** from the shape of the
solution — no single document states "we chose this over per-template
exporters, and here's why" — but the alternative (each of 91+ templates writing
its own PPTX-assembly code) is a plausible rejected alternative given how much
the codebase otherwise avoids per-template special-casing (ADR 0001, ADR 0003).
