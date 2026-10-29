#!/usr/bin/env node
// tools/audit-slide-layout.mjs
// =============================================================================
// Does every slide of every real deck actually FIT?
//
// The companion to audit-decks.mjs, which reads stored content and can only
// answer data questions. This one renders each slide at full size and asks the
// questions that need layout:
//
//   overflow  — text clipped by, or spilling out of, the box that holds it.
//               Nothing throws when this happens; the sentence simply ends.
//   escapes   — content drawn outside the 1920×1080 frame, so it is missing
//               from the export entirely.
//   collision — text printed on top of other text. Nothing clips and nothing
//               escapes; the words are simply illegible because they are
//               stacked, and every other detector calls the slide clean.
//   blank     — a field the layout draws a labelled region for, left empty.
//               audit-decks flagged 39 blank subtitles as suspicious; whether
//               a blank one collapses harmlessly or leaves a hole is not
//               visible in the data, only here.
//
// Runs against the product's own stored decks, through the same capture page
// the exporter uses — so a finding here is a finding in the .pptx.
//
//   node tools/audit-slide-layout.mjs             # summary
//   node tools/audit-slide-layout.mjs --verbose
// =============================================================================
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { reconcile } from "./lib/baseline.mjs";

const VERBOSE = process.argv.includes("--verbose");
const RECORD = process.argv.includes("--record-baseline");
const CI = process.argv.includes("--ci");
const ORIGIN = process.env.NPS_ORIGIN || "http://localhost:4600";
const CAPTURE = `${ORIGIN}/product/export-runtime/capture.html`;

/* Defaults to the live decks; --data points at the committed corpus instead.
 * product/data/ is gitignored (it is user data), so CI has no decks of its own
 * and would otherwise sweep nothing and report clean — the same vacuous pass
 * that made the dark-mode audit look green while measuring zero nodes. */
const dataArg = process.argv.indexOf("--data");
const DATA = dataArg !== -1 && process.argv[dataArg + 1]
  ? resolve(process.argv[dataArg + 1])
  : fileURLToPath(new URL("../product/data/presentations.json", import.meta.url));

if (!existsSync(DATA)) {
  console.error(`No deck data at ${DATA}. Pass --data <file>, or start the product and make a deck.`);
  process.exit(1);
}
const raw = JSON.parse(readFileSync(DATA, "utf8"));
const decks = (Array.isArray(raw) ? raw : raw.items || Object.values(raw))
  .filter((d) => d && Array.isArray(d.slides) && d.slides.length);

// An audit that measures nothing must never look like an audit that passed.
if (!decks.length) {
  console.error(`${DATA} holds no decks with slides — nothing was checked.`);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
try {
  await page.goto(CAPTURE, { waitUntil: "load" });
} catch {
  console.error(`Could not reach ${CAPTURE}. Start the studio first (npm start).`);
  process.exit(1);
}

const inspect = () => page.evaluate(() => {
  const stage = document.querySelector(".stage");
  if (!stage) return { overflow: [], escapes: [], blank: [] };
  const frame = stage.getBoundingClientRect();
  /* className on an SVG element is an SVGAnimatedString, not a string, so the
   * first version stringified it as "[object SVGAnimatedString]" and every
   * label read "path.[object". */
  const label = (el) => {
    const cls = typeof el.className === "string" ? el.className : el.className?.baseVal || "";
    return `${el.tagName.toLowerCase()}${cls ? "." + cls.split(" ")[0] : ""}`;
  };

  const overflow = [];
  const escapes = [];
  const blank = [];
  const texts = []; // for the collision pass below

  for (const el of stage.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;

    /* Clipped text. Only where the box actually clips — a scrollable overflow
     * on a slide is still a loss, because a slide cannot be scrolled. 4px of
     * tolerance absorbs sub-pixel rounding and descenders. */
    const clips = /hidden|clip|auto|scroll/.test(cs.overflowY + cs.overflowX);
    if (clips && (el.textContent || "").trim()) {
      /* overflow-clip-margin lets ink past the clip edge on purpose — the
       * heading blocks use it so Equip's descenders, which sit about 5px below
       * the line box, are not shaved off. Overflow within that margin is
       * painted, so it is not loss; only what exceeds it is cut. */
      const margin = parseFloat(cs.overflowClipMargin) || 0;
      const overY = el.scrollHeight - el.clientHeight - margin;
      const overX = el.scrollWidth - el.clientWidth - margin;
      /* text-overflow:ellipsis is an author saying "truncate this, visibly, on
       * purpose" — the deck name in the top bar gives way so the page number
       * stays on the canvas. Reporting it made 45 of 60 findings a behaviour
       * that was deliberately built, and a detector that mostly cries wolf gets
       * skipped exactly like a permanently red build. */
      const trimsOnPurpose = cs.textOverflow === "ellipsis";
      if (!trimsOnPurpose && (overY > 4 || overX > 4)) {
        overflow.push({
          el: label(el),
          by: `${overY > 4 ? `${Math.round(overY)}px down` : ""}${overY > 4 && overX > 4 ? ", " : ""}${overX > 4 ? `${Math.round(overX)}px across` : ""}`,
          text: (el.textContent || "").trim().slice(0, 46),
        });
      }
    }

    /* Drawn outside the frame — missing from the export, not merely ugly.
     *
     * Not inside an <svg>: a chart's own viewport clips it, so nothing in
     * there can actually reach the edge of the slide, and its coordinates are
     * in user units that do not compare. A correct area chart was reported as
     * having nine labels 7708px off-canvas. */
    if ((el.textContent || "").trim() && !el.children.length && !el.closest("svg")) {
      const out = Math.max(frame.top - r.top, r.bottom - frame.bottom, frame.left - r.left, r.right - frame.right);
      if (out > 4) escapes.push({ el: label(el), by: Math.round(out), text: (el.textContent || "").trim().slice(0, 46) });
    }

    /* A hole: an element that occupies real vertical space, draws no text and
     * no picture, and is not a deliberate surface (no fill, no border). That
     * is what an unfilled field leaves behind. */
    if (!el.children.length && !(el.textContent || "").trim() && r.height >= 24) {
      /* Inside an <svg> everything is drawing. The first version counted every
       * <path> of the Nagarro logo as an empty region and reported a hole on
       * all 169 slides — a detector that fires everywhere says nothing. */
      const inDrawing = el.closest("svg") || el.tagName.toLowerCase() === "svg" ||
                        el.tagName.toLowerCase() === "img" || el.tagName.toLowerCase() === "br";
      /* ANY border, not just the top one: a vertical rule is drawn with
       * border-left and has no top border at all, so a 560px timeline spine
       * was reported as 560px of nothing. */
      const hasBorder = ["borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"]
        .some((side) => cs[side] !== "0px");
      const painted = (cs.backgroundColor && !/rgba?\([^)]*,\s*0\)/.test(cs.backgroundColor)) ||
                      (cs.backgroundImage && cs.backgroundImage !== "none") || hasBorder;
      if (!inDrawing && !painted) blank.push({ el: label(el), h: Math.round(r.height) });
    }

    if (!el.children.length && (el.textContent || "").trim()) {
      texts.push({ el, r, label: label(el), text: (el.textContent || "").trim() });
    }
  }

  /* Text printed on top of other text.
   *
   * Nothing clips, nothing leaves the frame, no ratio is wrong — the words are
   * simply illegible because they are stacked. A rolling-stock deck rendered
   * its chart's y-axis as a single black smudge, four labels at the same y,
   * because the values spanned 87.9% to 89.1% and the scale collapsed. Every
   * other detector called that slide clean.
   *
   * Positioned text only. Ordinary flow text cannot collide, and comparing
   * every pair of nodes on a dense slide is both slow and noisy. */
  const overlaps = [];
  const positioned = texts.filter((t) => {
    const pos = getComputedStyle(t.el).position;
    return pos === "absolute" || pos === "fixed" || t.el.closest("svg");
  });
  for (let i = 0; i < positioned.length; i++) {
    for (let j = i + 1; j < positioned.length; j++) {
      const a = positioned[i].r, b = positioned[j].r;
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w <= 2 || h <= 2) continue;
      // Meaningful overlap: more than a third of the smaller label is hidden.
      const share = (w * h) / Math.min(a.width * a.height, b.width * b.height);
      if (share < 0.34) continue;
      overlaps.push({
        a: positioned[i].text.slice(0, 18), b: positioned[j].text.slice(0, 18),
        el: positioned[i].label, share: Math.round(share * 100),
      });
      if (overlaps.length >= 3) break;
    }
    if (overlaps.length >= 3) break;
  }

  return { overflow, escapes, blank, overlaps };
});

const findings = [];
let rendered = 0;
let failed = 0;

for (const deck of decks) {
  for (const slide of deck.slides) {
    const flat = {
      template: slide.templateReference?.templateName,
      theme: slide.themeOverride,
      ...(slide.content || {}),
    };
    const res = await page.evaluate((s) => window.__mountSlide(s, {}), flat);
    if (!res?.ok) {
      failed += 1;
      findings.push({ deck: deck.title || deck.id, slide: (slide.order ?? 0) + 1, kind: "does-not-mount",
        detail: `${flat.template}: ${res?.error || "unknown"}` });
      continue;
    }
    rendered += 1;
    const { overflow, escapes, blank, overlaps } = await inspect();
    const where = { deck: deck.title || deck.id, slide: (slide.order ?? 0) + 1 };
    for (const o of overflow) {
      findings.push({ ...where, kind: "overflow", detail: `${flat.template} · ${o.el} clipped ${o.by} — “${o.text}…”` });
    }
    for (const e of escapes) {
      findings.push({ ...where, kind: "escapes-frame", detail: `${flat.template} · ${e.el} ${e.by}px outside — “${e.text}…”` });
    }
    for (const o of overlaps) {
      findings.push({ ...where, kind: "text-collision",
        detail: `${flat.template} · ${o.el} “${o.a}” sits ${o.share}% on top of “${o.b}”` });
    }
    // One hole per slide is enough to look at; a list of twelve says the same thing.
    const worstBlank = blank.sort((a, b) => b.h - a.h)[0];
    if (worstBlank && worstBlank.h >= 40) {
      findings.push({ ...where, kind: "blank-region", detail: `${flat.template} · ${worstBlank.el} draws ${worstBlank.h}px of nothing` });
    }
  }
}
await browser.close();

const KINDS = ["does-not-mount", "escapes-frame", "text-collision", "overflow", "blank-region"];
console.log(`Rendered ${rendered} slides from ${decks.length} decks${failed ? ` (${failed} would not mount)` : ""}.\n`);
if (!findings.length) {
  console.log("Nothing found.");
} else {
  for (const k of KINDS) {
    const n = findings.filter((f) => f.kind === k).length;
    if (n) console.log(`  ${k.padEnd(16)} ${n}`);
  }
  console.log();
  for (const kind of KINDS) {
    const rows = findings.filter((f) => f.kind === kind);
    if (!rows.length) continue;
    console.log(`--- ${kind} (${rows.length})`);
    for (const f of (VERBOSE ? rows : rows.slice(0, 10))) {
      console.log(`  ${String(f.deck).slice(0, 30).padEnd(32)} s${String(f.slide).padStart(2)}  ${f.detail}`);
    }
    if (!VERBOSE && rows.length > 10) console.log(`  … and ${rows.length - 10} more (--verbose)`);
    console.log();
  }
}
/* One baseline per data source: the committed corpus and a developer's own
 * decks are different populations, and sharing a baseline would make each
 * run report the other's findings as new. */
const BASELINE = DATA.includes("corpus") ? "slide-layout-corpus" : "slide-layout";
process.exit(reconcile(BASELINE, findings, { record: RECORD, ci: CI }));
