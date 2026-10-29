#!/usr/bin/env node
// tools/audit-header-gap.mjs
// =============================================================================
// Is the content 32px under the header on every template?
//
// Figma's rule, on every frame: the header rule at y=124, the PageHeader (or
// the first content) at y=156. A third of the library had drifted — page
// headers 8px under the rule in side columns and cover rows, 40px in the
// portfolio family — and nothing measured it. This renders every template's
// example through the capture page and reports the gap between each header's
// rule and the first painted thing beneath it in the same column.
//
// Gaps far above 32 are usually deliberate (a centred cover, a quote, a
// full-bleed photo); judge those against the Figma frame. Small drifts are
// corrected in the "Header → content" block at the end of css/primitives.css.
//
// Usage (the studio must be running: npm start):
//   node tools/audit-header-gap.mjs                       # every template
//   node tools/audit-header-gap.mjs main/chart-02,core/cover-single
//   node tools/audit-header-gap.mjs "" /tmp/gaps.json     # also write JSON
// =============================================================================
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { allTemplates } from "../js/templates/index.js";
const ORIGIN = process.env.NPS_ORIGIN || "http://localhost:4600";
const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`${ORIGIN}/product/export-runtime/capture.html`);
await p.addStyleTag({ content: ".reveal{animation:none!important;opacity:1!important;translate:none!important}" });
const rows = [];
for (const t of allTemplates.filter((t) => !t.replacedBy && (!only || only.has(t.name)))) {
  await p.evaluate((s) => window.__mountSlide(s, {}), { template: t.name, ...t.example });
  const r = await p.evaluate(() => {
    const stage = document.querySelector(".stage"); const S = stage.getBoundingClientRect();
    const tops = [...stage.querySelectorAll(".v2f-topline")];
    if (!tops.length) return null;
    const out = [];
    for (const tl of tops) {
      const hb = tl.getBoundingClientRect();
      const header = tl.closest("header") || tl;
      let best = null;
      for (const el of stage.querySelectorAll("*")) {
        if (header.contains(el) || el.closest("footer,.v2f-footer")) continue;
        const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
        // only content in the same column as this header
        if (r.right <= hb.left + 2 || r.left >= hb.right - 2) continue;
        if (r.width >= S.width - 2 && r.height >= S.height - 2) continue; // full-bleed bg
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        const painted = hasText || el.tagName === "IMG" || el.tagName === "svg" || (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && !el.contains(tl)) || cs.borderTopWidth !== "0px";
        if (!painted || el.contains(tl)) continue;
        if (r.top < hb.bottom - 1) continue;
        if (!best || r.top < best.top) best = { top: r.top, tag: el.tagName, cls: String(el.className).slice(0, 40), txt: el.textContent.trim().slice(0, 30) };
      }
      const nx = header.nextElementSibling;
      out.push({ hdrBottom: Math.round(hb.bottom - S.top), x: Math.round(hb.left - S.left), w: Math.round(hb.width), nextMT: nx ? parseFloat(getComputedStyle(nx).marginTop) : null, nextCls: nx ? String(nx.className).slice(0, 40) : null, first: best && { ...best, top: Math.round(best.top - S.top) } });
    }
    return out;
  });
  if (r) for (const h of r) rows.push({ name: t.name, ...h, gap: h.first ? h.first.top - h.hdrBottom : null });
}
await b.close();
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(rows));
const off = rows.filter((r) => r.gap != null && (r.gap < 31 || r.gap > 33));
console.error(`headers ${rows.length}, gap != 32: ${off.length}`);
for (const r of off.sort((a, b) => a.gap - b.gap)) console.error(`${String(r.gap).padStart(4)}  ${r.name.padEnd(34)} ${r.first.tag}.${r.first.cls} "${r.first.txt}"`);
