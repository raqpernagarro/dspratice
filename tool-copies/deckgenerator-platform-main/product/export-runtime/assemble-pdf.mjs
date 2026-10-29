// =============================================================================
// Export Runtime — PDF assembly (Milestone M10, ADR-0008/ADR-0009).
//
// A verbatim port of tools/export-pptx.mjs's PDF-assembly logic: one
// full-slide, browser-rendered PNG per page, embedded at exact 16:9 size —
// per ADR-0009's sanctioned exception. This path never touches the ops
// walker at all, matching the original tool's own behavior (the PDF was
// always built from the full-slide screenshots, independent of the
// PPTX-only ops/text-run extraction).
// =============================================================================
import { PDFDocument } from "pdf-lib";
import { IN_W, IN_H } from "./assemble-pptx.mjs";

/** @param {string[]} pageImages - "image/png;base64,..." data URLs, one per slide */
export async function assemblePdf(pageImages) {
  const pdf = await PDFDocument.create();
  for (const dataUrl of pageImages) {
    const b64 = dataUrl.split(";base64,")[1];
    const png = await pdf.embedPng(Buffer.from(b64, "base64"));
    const page = pdf.addPage([IN_W * 72, IN_H * 72]); // PDF points = 1/72in
    page.drawImage(png, { x: 0, y: 0, width: IN_W * 72, height: IN_H * 72 });
  }
  return pdf.save();
}
