# PPTX Import Fidelity — Design

**Date:** 2026-08-08
**Status:** Approved by Hugo (approach A; sharp dependency and source-images-by-default both confirmed)

## Problem

Importing a .pptx today produces a deck that barely resembles the source:

1. **Uploads over 30 MB fail** with "File is too large." Real decks are image-heavy
   (the motivating deck: 19 slides, 43 media files, 66.5 MB of images, 70 MB total).
2. **Images are discarded.** `pptx-import-service.js` never reads `ppt/media/*`; the
   engine substitutes brand stock photography for the user's own visuals.
3. **Text extraction is lossy.** Regex over slide XML misses grouped shapes
   (`<p:grpSp>`), tables (`<a:tbl>`), and charts entirely — silently.
4. **Content is rewritten.** Imports go through the same two-pass LLM composition as
   prompt-generated decks; the fill pass regenerates copy from 140/260-char clippings
   instead of transplanting the source text.
5. **Failures are silent.** Batches that exceed the 32k CLI prompt cap (or fail for any
   reason) are swallowed — pass 2 has a bare `catch { continue }` — leaving slides on a
   generic two-column fallback with no notice.

## Goal

An imported deck preserves the source's content, images, and structural intent. The LLM
acts as an *editor*, not an author: it analyzes each slide's content, chooses the best
registered template(s), may lightly polish copy (grammar, tightening), and may split a
dense source slide across 2–3 output slides — but never invents, drops, or reinterprets
content. The user chooses per deck whether to keep the source's images or use brand
photography.

## Design

### 1. Upload limit & guards

- Import route body limit 30 MB → **200 MB**
  (`product/application/routes/presentations.js:92`).
- **Client-side pre-check** in both entry points (home composer `product/ui/home.js`,
  library page `product/ui/presentations.js`): files over 200 MB are rejected before
  upload with a message stating the file's size and the limit — no more streaming the
  whole file into a 413.
- Zip-bomb guards unchanged (5,000 entries / 100 MB per entry / 500 MB total
  uncompressed, `pptx-import-service.js:216-228`).

### 2. Extraction (`product/domain/pptx-import-service.js`)

- **Images:** parse `<p:pic>` → `<a:blip r:embed>`, resolve through each slide's
  `.rels` into `ppt/media/*`. Store via the same conventions as editor uploads
  (magic-byte validation from `media-upload-service.js`, `assets/uploads/<uuid>.<ext>`),
  plus **dedupe by content hash** (decks reuse logos/images across slides).
- **Recompression:** add **`sharp`** as a dependency. Downscale images wider than
  1920 px and re-encode oversized PNGs so slides and exports don't carry full-res
  screenshots. If sharp is unavailable at runtime (failed native install), store
  originals and emit a warning — import must not hard-fail on this.
- **Tables:** extract `<a:tbl>` as rows × cells of text.
- **Grouped shapes:** recurse into `<p:grpSp>` so grouped text is no longer lost.
- **Charts:** detect presence (a signal for template choice); chart data extraction is
  out of scope.
- **Element inventory** per slide: image count + stored refs, table dimensions,
  has-chart, bullet count, dominant-image size hint. This is the machine-readable
  "intended structure" signal for scoring and the LLM.
- The per-slide mapping shape gains `content.tables`, `content.images`, and `elements`;
  the `updateOutline` whitelist (`generation-service.js:206-215`), which rebuilds
  mappings from scratch, is extended to carry these fields through instead of
  stripping them.

### 3. Import compose mode

- `composeSlides` branches on the generation record's existing `origin: "import"`.
  Prompt-generation mode is untouched.
- Import mode replaces two-pass choose-then-fill with a **single combined pass per
  small batch (2–4 slides)**: the model sees each slide's full content (no clipping),
  its element inventory, and its template shortlist; it returns template choice +
  filled content together. Each output slide records its source slide number.
- Prompt instructions: preserve every content point; light polish only; split a dense
  source slide into 2–3 output slides when it exceeds the chosen template's declared
  capacity; never invent or reinterpret; tables map to table/comparison templates with
  cells transplanted verbatim.
- **Batching against the 32k CLI cap** (`claude-cli-provider.js` `MAX_PROMPT_CHARS`):
  batches sized by measured content length. A single slide that alone exceeds the
  budget gets its body truncated *for the prompt only* — and emits a user-visible
  warning. No batch is ever admitted over-budget.
- **No silent fallbacks:** every failure path (including pass 2's current bare
  `catch { continue }`) logs and emits a `composeWarnings` entry naming the affected
  slides. Failed slides keep the verbatim two-column fallback
  (`buildSlidesFromMapping`) — source text intact, plain layout, user informed.

### 4. Source images: hybrid choice + placement

- **Choice UI:** home composer's staged-file chip gains a toggle — "Use images from the
  file" (**default**) vs "Use brand photography". The library page presents the same
  choice on file pick. The choice travels on the import request and is stored on the
  generation record (new field `imageSource: "source" | "brand"`).
- **Placement:** the photo substitution point (`keepAssetPaths` /
  `takePhoto` closure, `generation-service.js:478-507, 833-864`) is fed a per-slide
  queue of that slide's own extracted images first; brand photography
  (`choosePhotos`) fills only slides that had no source image. The `isPhoto()`
  predicate that hard-codes the `assets/photography/` prefix is widened so
  `assets/uploads/` paths substitute correctly.
- **Scoring:** the element inventory steers `shortlistFor` wants — a dominant image
  scores toward photo/full-bleed layouts, a table toward comparison-table roles — so
  structure follows the source's intent.

### 5. Warnings visibility

`composeWarnings` are currently shown only in the home flow. The library page
(`presentations.js`) will surface them too — "3 slides kept a default layout" or
"1 slide's content was truncated" must never be invisible.

### 6. Testing

- Parser unit tests against a small fixture .pptx: grouped shapes, tables, images,
  notes, image dedupe.
- Recompression tests (sharp path + graceful degradation without sharp).
- Batching tests against the 32k cap, extending `test/prompt-budget.test.js`.
- Acceptance: the motivating 70 MB deck imports end-to-end — 19 slides' content
  present, source images placed, varied templates, zero silent fallbacks.

## Out of scope

- Chart data extraction (presence detection only).
- Pixel-faithful layout reconstruction — the goal is mapping onto registered brand
  templates, not cloning source geometry (per CLAUDE.md's prime directive).
- Changes to prompt-generation mode.
