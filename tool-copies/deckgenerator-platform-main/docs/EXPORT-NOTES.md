# PPTX/PDF Export — Engineering Notes

**Read this before changing `js/export.js`, `export.html`, or `tools/export-pptx.mjs`.**

This file is the institutional memory for the HTML‑deck → editable‑PowerPoint exporter.
Every entry below cost real debugging time on the 91‑slide master stress test. The goal
is simple: **never re‑discover or re‑fix a known issue.** If you hit something new, add it
here with its root cause and fix.

How the exporter works in one paragraph: each slide is rendered headless (Playwright) on
`export.html` at native 1920×1080. A DOM walker (`js/export.js → __extractSlide`) classifies
every element into ops — `text` (editable text box), `shape` (rectangle / rounded‑rect /
oval), or `image` (a screenshot of a graphic/plate). The assembler (`tools/export-pptx.mjs`)
turns ops into pptxgenjs objects, screenshots the `image` ops, and writes a versioned
`.pptx` + a browser‑rendered `.pdf` to `outputs/<deck-id>/`.

---

## ⚠️ INVARIANTS — do not break these (each caused a deck‑wide failure)

1. **The capture surface MUST be transparent.** `export.html` body is
   `background: transparent`. Playwright `omitBackground` only yields transparency when no
   opaque page background is painted. An explicit white here bakes a white backing into
   every logo/plate capture → **white boxes on every dark slide.**

2. **Captures MUST be isolated.** Before screenshotting one element, hide the whole stage
   and re‑show only that element (`.cap-on` / `.cap-plate` / `.cap-graphic` classes).
   Without this, overlapping siblings bleed into the screenshot → **duplicated/ghosted
   content** (e.g. clustered stat blobs, chart labels).

3. **Text line spacing MUST be absolute points** (`lineSpacing: px × 0.5`), NOT
   `lineSpacingMultiple`. The multiple is relative to the font's natural leading (~1.2×),
   so 1.25 becomes ~1.5× → **everything too loose / shifted down.**

4. **Wrapping MUST be pre‑baked.** The walker measures the browser's real visual lines
   (`Range.getClientRects()` with a tolerance) and emits explicit `breakLine` runs;
   `addText` uses `wrap: false`. Don't turn wrap back on — PowerPoint re‑wraps differently
   (e.g. "01" → "0"/"1").

5. **Font weight is by EXACT family name, never collapsed.** `300→Equip[ Extended] Light`,
   `400→Equip[ Extended]`, `500→…Medium`, `700→…+bold`, `900→…Black`. These resolve
   correctly (verified). Don't "simplify" to the bold boolean — it loses Light/Medium/Black.

---

## Issue catalog (symptom → root cause → fix)

| # | Symptom (in the .pptx) | Root cause | Fix / where |
|---|---|---|---|
| 1 | White rectangles where the white logo / white footer text sit on **dark** slides | Explicit white page bg + `omitBackground` can't strip it | `export.html` body `background: transparent` |
| 2 | Text/graphics **duplicated or ghosted** (slide 38 blobs, slide 70 chart label) | Element screenshot captured overlapping **siblings** | Capture isolation: hide stage, show only target (`.cap-*` classes) |
| 3 | **Plate** background bakes its own text → that text appears twice | `visibility:hidden` on children doesn't hide the element's **own** text | `.cap-plate { color: transparent }` |
| 4 | **Circles render as rounded squares** (slides 40, 45, 67, 72, 74) | `getComputedStyle` returns literal `"50%"`; `parseFloat` → `50px` | `radiusInfo(cs,w,h)` resolves `%`, flags `ellipse` → assembler emits `OVAL` |
| 5 | **Logos render as solid black bars** (slides 46–48) | Logo = colored div revealed through `mask-image`; walker saw only the bg color | `hasMask(cs)` → rasterize the element whole |
| 6 | Translucent icon renders **fully opaque** (slide 74 "Multi‑device") | Element uses `opacity`, not an `rgba()` fill | `fillAlpha = fill.a × cs.opacity` |
| 7 | Text **too loose / pushed down** (cards, lists) | `lineSpacingMultiple` (see invariant 3) | absolute `lineSpacing` pt |
| 8 | A word **breaks mid‑word**, last chars float up (closing heading) | `lineSplit` used strict `top !== curTop`; sub‑pixel jitter at big sizes + neg tracking | tolerance = ½ line height |
| 9 | An **oversized image bleeds** across the slide (slide‑91 3D logo over the title) | Walker captured an inner `<img>` that overflows its `overflow:hidden` parent | `isClippedGraphic` → capture the clip box whole |
| 10 | A CSS **arrowhead is missing** (slide 5 connector) | Arrowhead is a `::after` triangle outside the box | `hasVisiblePseudo` → rasterize a padded clip (bleed) |
| 11 | Footer `space‑between` columns **merged / mis‑placed** | Flex children flattened into one text box | `inlinePieces` bails for flex/grid with element children → emit each child at its own rect |
| 12 | Centered chip label sits at **top‑left** of its box | `valign`/`align` read only `text-align` | `valignOf` / `alignOf` derive from flex `justify-content`/`align-items` |
| 13 | UPPERCASE labels exported in **original case** | DOM keeps original case; `text-transform` is visual | apply computed `text-transform` per run |
| 14 | Bullets render as **dashes** | Default bullet glyph | `bullet: { code: "2022", indent: 14 }` (• ) |
| 15 | Dense rotated‑connector diagrams / photo showcases imperfect | Not worth reconstructing as editable | template sets `exportAsImage: true` (slides 38, 78, 79) → one pixel‑exact image |

---

## Things that look like bugs but aren't

- **Medium text looks slightly lighter than the browser** in the LibreOffice QA render.
  This is a rasterization nuance — micro‑tests proved the weight families resolve and match
  the web fonts. In real PowerPoint (same OTFs) it's correct. Don't "fix" the weight map.
- **Transparent checkerboard** on team/CV/photo slides — the Figma frames themselves use
  placeholder images; identical in HTML and PPTX.
- **The PDF differs slightly from the .pptx** — intended. The PDF is browser‑rendered
  (pixel‑exact, font‑safe); the .pptx is native/editable and renders in whatever fonts the
  opener has. Never generate the PDF from the .pptx.

---

## Before you ship an exporter change — checklist

1. Re‑export **a light deck AND a dark deck** (the master has both; ASSA is mostly light).
   Dark slides are where transparency/white‑box regressions show.
2. Render the `.pptx` to images **from a /tmp copy** — `soffice --convert-to pdf` writes
   `<base>.pdf`, which will **clobber the browser‑rendered deliverable PDF of the same name**.
3. QA with **fresh‑eyes subagents** (3–4 in parallel, ~25 slides each) comparing
   `pptx-NN.jpg` vs `html-NN.jpg`. You've been staring at the code; they haven't.
4. Spot‑check: a logo wall (masks), a circle/Venn slide (ovals), a bulleted list, a
   full‑bleed photo, a dark title slide, the closing 3D‑logo slide.

## QA commands

```bash
node tools/export-pptx.mjs <deck-id>
SOFFICE=".../skills/pptx/scripts/office/soffice.py"
mkdir -p /tmp/qa
pdftoppm -jpeg -r 100 outputs/<deck-id>/<deck-id>-v01.pdf /tmp/qa/html      # HTML truth
cp outputs/<deck-id>/<deck-id>-v01.pptx /tmp/qa/deck.pptx                   # copy! (avoid clobber)
( cd /tmp/qa && python3 "$SOFFICE" --headless --convert-to pdf deck.pptx && pdftoppm -jpeg -r 100 deck.pdf pptx )
# then compare /tmp/qa/pptx-NN.jpg vs /tmp/qa/html-NN.jpg
```

## Performance notes

- 91‑slide master ≈ 2 min, ~55 MB .pptx (779 image captures @ scale 2). Real 15‑slide decks
  are ~1 MB. Per‑element screenshots dominate wall‑clock; that's expected.
