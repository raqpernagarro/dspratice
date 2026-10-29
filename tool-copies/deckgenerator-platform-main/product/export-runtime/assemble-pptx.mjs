// =============================================================================
// Export Runtime — PPTX assembly (Milestone M10, ADR-0008/ADR-0009).
//
// A verbatim port of tools/export-pptx.mjs's unit-conversion constants and
// addSlide() function (its per-slide ops → pptxgenjs translation), per
// ADR-0009's sanctioned exception. Unchanged from the original beyond
// removing the CLI's own --images flag handling (the Export Gateway always
// renders the requested single format — approved M10 Decision 3 — so the
// "images mode" branch, only ever reachable via a CLI flag no Product Layer
// caller sets, is not carried over; everything else is identical).
// =============================================================================

export const SLIDE_W = 1920, SLIDE_H = 1080;
export const IN_W = 13.333, IN_H = 7.5; // exact 16:9 at 144 dpi
export const inX = (pxv) => +(pxv / 144).toFixed(4);
export const ptOf = (pxv) => +(pxv * 0.5).toFixed(2);

function clampRadius(radiusPx, hPx) { return Math.min(radiusPx, hPx / 2); }

/** @param {import("pptxgenjs")} pptx */
export function addSlide(pptx, data, shots, notes) {
  const slide = pptx.addSlide();

  /* Speaker notes. They have been captured on every slide since generation and
   * import existed, and consumed by nothing — invisible in the editor, the
   * presenter and the export alike. PowerPoint has a notes pane; this is where
   * they belong. */
  if (typeof notes === "string" && notes.trim()) slide.addNotes(notes.trim());
  if (data.bg && data.bg.color && !data.bg.image) slide.background = { color: data.bg.color };

  // Full-bleed background image (gradient/photo on the stage itself)
  if (data.bg && data.bg.image && shots.full)
    slide.addImage({ data: shots.full, x: 0, y: 0, w: IN_W, h: IN_H });

  let texts = 0, shapes = 0, images = 0;
  for (const op of data.ops) {
    const r = op.rect;
    const geo = { x: inX(r.x), y: inX(r.y), w: inX(Math.max(r.w, 1)), h: inX(Math.max(r.h, 1)) };
    if (op.kind === "image") {
      const dat = shots.byXid[op.xid];
      if (!dat) continue;
      slide.addImage({ data: dat, ...geo });
      images++;
    } else if (op.kind === "shape") {
      const useRound = !op.oval && (op.radiusPx || 0) > 0.5;
      const shp = op.oval ? pptx.shapes.OVAL : (useRound ? pptx.shapes.ROUNDED_RECTANGLE : pptx.shapes.RECTANGLE);
      const o = { ...geo };
      if (op.fill) o.fill = { color: op.fill, transparency: Math.round((1 - (op.fillAlpha ?? 1)) * 100) };
      else o.fill = { type: "none" };
      if (op.line) o.line = { color: op.line.color, width: op.line.widthPt };
      if (useRound) o.rectRadius = inX(clampRadius(op.radiusPx, r.h));
      slide.addShape(shp, o);
      shapes++;
    } else if (op.kind === "text") {
      const runs = op.runs.map((run, i) => ({
        text: run.text,
        options: {
          fontFace: run.fontFace,
          fontSize: run.sizePt,
          color: run.color,
          bold: run.bold,
          italic: run.italic,
          charSpacing: run.charSpacingPt || undefined,
          breakLine: !!run.breakLine,
          // bullet only on the first run (= the paragraph's start); force a round
          // dot (•, U+2022) so it isn't rendered as a dash by the viewer.
          ...(op.bullet && i === 0 ? { bullet: { code: "2022", indent: 14 } } : {}),
        },
      }));
      // Bullet boxes shift left so the disc sits in the list's marker gutter.
      const bulletPad = op.bullet ? inX(22) : 0;
      slide.addText(runs, {
        ...geo,
        x: geo.x - bulletPad,
        w: geo.w + bulletPad,
        align: op.align,
        valign: op.valign || "top",
        margin: 0,
        wrap: false, // exact line breaks are pre-baked as breakLine runs
        lineSpacing: op.lineHeightPx ? ptOf(op.lineHeightPx) : undefined,
        fit: "none",
      });
      texts++;
    }
  }
  return { texts, shapes, images };
}
