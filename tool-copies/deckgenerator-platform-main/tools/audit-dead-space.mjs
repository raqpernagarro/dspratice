#!/usr/bin/env node
// tools/audit-dead-space.mjs
// =============================================================================
// Which templates leave a hole under their content?
//
// "Avoid those visual gaps" was the report, and the assumption was that the
// engine was under-filling layouts — writing three points into a nine-slot
// grid. Scoring already penalises that in both directions, so this measures
// whether the gap is really the ENGINE's or the TEMPLATE's: it renders each
// module with its OWN example, the content its author intended, and looks for
// large empty vertical runs inside the slide's content area.
//
// A hole that appears with the template's own example is a property of the
// master, not of generation. That distinction decides who can fix it — a
// master slide originates in Figma, and CLAUDE.md forbids changing one without
// explicit approval, so this tool reports and never edits.
//
//   node tools/audit-dead-space.mjs            # summary
//   node tools/audit-dead-space.mjs --verbose  # every offender, with its gap
// =============================================================================
import { chromium } from "playwright";
import { allTemplates } from "../js/templates/index.js";

const ORIGIN = process.env.NPS_ORIGIN || "http://localhost:4600";
const CAPTURE = `${ORIGIN}/product/export-runtime/capture.html`;
const VERBOSE = process.argv.includes("--verbose");

/** A gap has to be big to count. Below this it is deliberate breathing room. */
const MIN_GAP_PX = 220;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
try {
  await page.goto(CAPTURE, { waitUntil: "load" });
} catch {
  console.error(`Could not reach ${CAPTURE}. Start the studio first (npm start).`);
  process.exit(1);
}

const measure = (minGap) => page.evaluate((min) => {
  const stage = document.querySelector(".stage");
  if (!stage) return null;

  /* Containers worth checking: a box with a visible fill or outline, big
   * enough to read as a panel. A gap only looks like a mistake when there is
   * a drawn edge around it — empty space on the open page is just layout. */
  const boxes = [];
  for (const el of stage.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    const filled = (cs.backgroundColor && !/rgba?\([^)]*,\s*0\)/.test(cs.backgroundColor)) ||
                   (cs.borderTopWidth !== "0px" && cs.borderTopStyle !== "none");
    if (!filled) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 200 || r.height < 260) continue;
    if (el.querySelector("img")) continue;         // a photo fills its own box
    boxes.push({ el, r });
  }

  const worst = [];
  for (const { el, r } of boxes) {
    // Top and bottom edges of what is actually drawn inside this box.
    let lowest = r.top;
    let highest = r.bottom;
    for (const child of el.querySelectorAll("*")) {
      const t = (child.textContent || "").trim();
      /* Lower-cased on purpose: an inline <svg> reports tagName "svg", not
       * "SVG", so an upper-case comparison makes every hand-built chart
       * invisible and reports a full donut panel as 96% empty. */
      const tag = child.tagName.toLowerCase();
      /* A mark can be drawn purely by its background — the waffle chart's dots
       * are empty <i> elements with a fill. Counting only text and <img>/<svg>
       * made a centred waffle look like 429px of nothing under its label. */
      const ccs = getComputedStyle(child);
      const painted = (ccs.backgroundColor && !/rgba?\([^)]*,\s*0\)/.test(ccs.backgroundColor)) ||
                      (ccs.backgroundImage && ccs.backgroundImage !== "none");
      const drawn = tag === "img" || tag === "svg" || tag === "canvas" || painted;
      if (!t && !drawn && !child.querySelector("img, svg, canvas")) continue;
      const cr = child.getBoundingClientRect();
      if (cr.height === 0 || cr.width === 0) continue;
      if (cr.bottom > lowest) lowest = cr.bottom;
      if (cr.top < highest) highest = cr.top;
    }
    const cs = getComputedStyle(el);
    const gap = r.bottom - (parseFloat(cs.paddingBottom) || 0) - lowest;
    const above = highest - (r.top + (parseFloat(cs.paddingTop) || 0));

    /* A hole is space at the BOTTOM that is not matched at the top.
     *
     * portfolio/grid-05 centres a label in each tile, so half the tile sits
     * below the words and half above — and measuring only downwards called it
     * 91% empty, the worst offender in the library, when it is simply centred
     * and looks right. Comparing the two ends tells a void from a centred
     * block, which is the difference between a bug and a design. */
    const centred = above >= gap * 0.6;
    if (gap >= min && !centred) {
      worst.push({ gap: Math.round(gap), height: Math.round(r.height), cls: el.className || el.tagName });
    }
  }
  worst.sort((a, b) => b.gap - a.gap);
  // Nested boxes report the same hole; the outermost is enough.
  return worst.slice(0, 3);
}, minGap);

const offenders = [];
for (const t of allTemplates) {
  const res = await page.evaluate((s) => window.__mountSlide(s, {}), { template: t.name, theme: "light", ...t.example });
  if (!res?.ok) continue;
  const gaps = await measure(MIN_GAP_PX);
  if (gaps?.length) {
    const worst = gaps[0];
    offenders.push({ name: t.name, role: t.role, ...worst, share: worst.gap / worst.height });
  }
}
await browser.close();

offenders.sort((a, b) => b.share - a.share);

console.log(`Rendered ${allTemplates.length} templates with their own examples.`);
console.log(`${offenders.length} leave a panel more than ${MIN_GAP_PX}px empty at the bottom.\n`);

if (offenders.length) {
  const byRole = offenders.reduce((m, o) => ((m[o.role] = (m[o.role] || 0) + 1), m), {});
  console.log("by role: " + Object.entries(byRole).sort((a, b) => b[1] - a[1])
    .map(([r, n]) => `${r}:${n}`).join("  "));
  console.log("\nworst ten (share of the panel left empty):");
  for (const o of (VERBOSE ? offenders : offenders.slice(0, 10))) {
    console.log(`  ${o.name.padEnd(30)} ${String(Math.round(o.share * 100)).padStart(3)}% empty  (${o.gap}px of ${o.height}px)  .${String(o.cls).split(" ")[0]}`);
  }
  console.log(
    "\nThese are the templates' own examples, so the space is the MASTER's design,\n" +
    "not something generation caused. Changing a master needs explicit approval."
  );
}
