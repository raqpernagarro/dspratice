#!/usr/bin/env node
// tools/audit-dark-mode.mjs
// =============================================================================
// Which templates are legible in dark mode?
//
// Every template CAN render dark — .stage[data-theme="dark"] redefines the
// tokens the whole library paints from. But a handful paint their own surfaces
// (chart segments, quote panels, photo collages) and end up with white text on
// a light fill, which no token override can reach.
//
// The composition engine needs that as a FACT, not a guess: it opens and closes
// decks dark, and putting a template that cannot do dark into that slot would
// ship an unreadable slide. So this renders all 229 through the real capture
// page, measures every text node against its resolved background, and writes
// the verdict to js/dark-safe.json.
//
// The LIGHT theme needs the same guard, for the same reason in reverse: the
// fixes for dark are token flips, and a flip that goes the wrong way is only
// visible if something measures both. `--theme=light` runs the identical check
// against the light ramp and reports without writing the manifest — dark-safe
// is a fact about dark, and only dark decides it.
//
// Flags:
//   --theme=light    Run against light theme (no write; dark-safe is dark-only)
//   --only=a,b,c     Audit only named templates; merge results into existing
//   --missing        Audit templates absent from both safe and unsafe lists
//   --strict         Force exit code 1 when unsafe templates are found on a
//                     FILTERED run (--only / --missing). A FULL run (neither
//                     flag given) always exits 1 on unsafe, --strict or not —
//                     that full-run behavior is unchanged from before --strict
//                     existed. --strict is a no-op on a full run.
//
// Run after any change to either theme or to a template's own colours:
//   node tools/audit-dark-mode.mjs
//   node tools/audit-dark-mode.mjs --theme=light
//   node tools/audit-dark-mode.mjs --only=core/cover-single,main/statement
//   node tools/audit-dark-mode.mjs --missing --strict
// =============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { allTemplates } from "../js/templates/index.js";
import { mergeDarkSafe } from "./lib/dark-safe-merge.mjs";

const THEME = process.argv.includes("--theme=light") ? "light" : "dark";
const ORIGIN = process.env.NPS_ORIGIN || "http://localhost:4600";
const CAPTURE = `${ORIGIN}/product/export-runtime/capture.html`;
/** Below this, text is not readable at any size. */
const FLOOR = 3;

// Parse --only=<csv> and --missing flags to build the audit pool
if (process.argv.includes("--only")) {
  console.error(`--only needs a value — use --only=family/slug-a,family/slug-b (bare --only matches nothing and silently runs every template).`);
  process.exit(1);
}
const onlyMatch = process.argv.find((a) => a.startsWith("--only="));
const onlyNames = onlyMatch ? new Set(onlyMatch.slice(7).split(",")) : null;
const auditMissing = process.argv.includes("--missing");
let auditPool = null; // null = full run (all templates); array = filtered run
if (onlyNames) {
  auditPool = allTemplates.filter((t) => onlyNames.has(t.name));
  const found = new Set(auditPool.map((t) => t.name));
  const unmatched = [...onlyNames].filter((n) => !found.has(n));
  if (unmatched.length) {
    console.error(`--only named template(s) not found in the library: ${unmatched.join(", ")}`);
    process.exit(1);
  }
} else if (auditMissing && THEME === "dark") {
  // Load existing manifest to find missing templates
  const darkSafePath = fileURLToPath(new URL("../js/dark-safe.json", import.meta.url));
  try {
    const manifest = JSON.parse(readFileSync(darkSafePath, "utf-8"));
    const listed = new Set([
      ...(manifest.safe || []),
      ...(manifest.unsafe || []).map((u) => u.name),
    ]);
    auditPool = allTemplates.filter((t) => !listed.has(t.name));
  } catch (e) {
    console.error(`Could not read ${darkSafePath}: ${e.message}`);
    process.exit(1);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
try {
  await page.goto(CAPTURE, { waitUntil: "load" });
} catch {
  console.error(`Could not reach ${CAPTURE}. Start the studio first (npm start).`);
  process.exit(1);
}

const measure = () => page.evaluate((floor) => {
  const lum = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const stage = document.querySelector(".stage");
  if (!stage) return { bad: [{ text: "(no stage)", ratio: 0 }], measured: 0, skipped: 0 };
  /* What is actually painted behind this text.
   *
   * Two things the first version got wrong, and both produced FALSE failures
   * that sent fixes at templates which were fine.
   *
   * It skipped any translucent fill and kept climbing, so a pill filled with
   * --fg-50 (58% black) was measured as white text on the white page — 1:1,
   * when the pill really renders mid-grey at 4.9:1. Translucent layers are
   * composited now instead of ignored.
   *
   * And a photo is rarely an ANCESTOR's background: the templates that put a
   * caption over an image use a full-bleed <img> plus a gradient scrim as
   * SIBLING layers under a positioned text block. Those measured against the
   * white page too. `pictureUnder` looks for such a layer covering the text,
   * and a picture is reported as unmeasurable — no single ratio describes it.
   *
   * (elementsFromPoint would give the true paint stack and was tried first;
   * inside the capture page it returns a bare overlay div and never the slide,
   * so every one of the 4227 text nodes came back unmeasurable and the audit
   * passed vacuously. Hence the explicit walk, and the node counts printed at
   * the end — an audit that measures nothing must not look like a clean one.)
   */
  const covers = (a, b) => a.left <= b.left + 1 && a.top <= b.top + 1 &&
                           a.right >= b.right - 1 && a.bottom >= b.bottom - 1;
  const pictureUnder = (container, rect, el) => {
    for (const n of container.querySelectorAll("img, [style*='background'], *")) {
      if (n === el || n.contains(el)) continue;
      const cs = getComputedStyle(n);
      if (cs.position !== "absolute" && cs.position !== "fixed") continue;
      const isPicture = n.tagName === "IMG" ||
        (cs.backgroundImage && cs.backgroundImage !== "none");
      if (!isPicture) continue;
      if (covers(n.getBoundingClientRect(), rect)) return true;
    }
    return false;
  };
  const bgOf = (el) => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    let acc = null; // [r,g,b,a] accumulated downwards from the text
    let n = el;
    while (n && n !== stage.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      if (pictureUnder(n, rect, el)) return null;
      const b = parse(cs.backgroundColor);
      const a = b.length < 3 ? 0 : (b[3] === undefined ? 1 : b[3]);
      if (a > 0) {
        // Premultiplied: the running sum is colour×coverage, so the first
        // layer must be scaled too or a translucent stack composites to >255.
        if (!acc) acc = [b[0] * a, b[1] * a, b[2] * a, a];
        else {
          const rem = 1 - acc[3];
          acc = [acc[0] + b[0] * rem * a, acc[1] + b[1] * rem * a, acc[2] + b[2] * rem * a, acc[3] + rem * a];
        }
        if (acc[3] > 0.99) break;
      }
      n = n.parentElement;
    }
    if (!acc) return null;
    // Still translucent at the slide's edge: composite onto the page itself.
    const rem = 1 - acc[3];
    const page = parse(getComputedStyle(stage).backgroundColor);
    const base = page.length >= 3 && page[3] !== 0 ? page : [255, 255, 255];
    return [
      Math.round(acc[0] + base[0] * rem),
      Math.round(acc[1] + base[1] * rem),
      Math.round(acc[2] + base[2] * rem),
    ];
  };
  const out = [];
  let measured = 0, skipped = 0;
  for (const el of stage.querySelectorAll("*")) {
    if (el.children.length || !(el.textContent || "").trim()) continue;
    const cs = getComputedStyle(el);
    const bg = bgOf(el);
    if (!bg) { skipped++; continue; }
    measured++;
    const [fr, fg, fb, fa = 1] = parse(cs.color);
    const a = fa * (parseFloat(cs.opacity) || 1);
    const c = [Math.round(fr * a + bg[0] * (1 - a)), Math.round(fg * a + bg[1] * (1 - a)), Math.round(fb * a + bg[2] * (1 - a))];
    const l1 = lum(...c), l2 = lum(...bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < floor) out.push({ text: el.textContent.trim().slice(0, 30), ratio: +ratio.toFixed(2) });
  }
  return { bad: out, measured, skipped };
}, FLOOR);

const safe = [];
const unsafe = [];
let totalMeasured = 0, totalSkipped = 0;
const toAudit = auditPool || allTemplates;
for (const t of toAudit) {
  const res = await page.evaluate((s) => window.__mountSlide(s, {}), { template: t.name, theme: THEME, ...t.example });
  if (!res?.ok) { unsafe.push({ name: t.name, reason: `does not mount in dark: ${res?.error}` }); continue; }
  const { bad, measured, skipped } = await measure();
  totalMeasured += measured; totalSkipped += skipped;
  if (bad.length) {
    unsafe.push({ name: t.name, reason: `${bad.length} illegible node(s)`, worst: bad.sort((a, b) => a.ratio - b.ratio)[0] });
  } else {
    safe.push(t.name);
  }
}
await browser.close();

/* Only the dark run writes the manifest: the engine reads it to decide which
   templates may take a dark slot, and a light run knows nothing about that. */
if (THEME === "dark") {
  const out = fileURLToPath(new URL("../js/dark-safe.json", import.meta.url));
  let manifest;
  if (auditPool) {
    // Filtered run: merge into existing. A missing or corrupt manifest (fresh
    // checkout before the first full run, or a hand-edit gone wrong) must not
    // crash a --missing/--only run with a raw ENOENT/SyntaxError — fall back
    // to an empty manifest and warn, so the merge still produces something.
    let existing;
    try {
      existing = JSON.parse(readFileSync(out, "utf-8"));
    } catch (e) {
      console.warn(`Could not read ${out} (${e.message}) — starting from an empty manifest.`);
      existing = { safe: [], unsafe: [] };
    }
    manifest = mergeDarkSafe(existing, {
      safe: safe.sort(),
      unsafe: unsafe.sort((a, b) => a.name.localeCompare(b.name)),
      audited: toAudit.map((t) => t.name),
    });
  } else {
    // Full run: write wholesale (still through mergeDarkSafe with all names audited)
    manifest = mergeDarkSafe(
      { generatedBy: "tools/audit-dark-mode.mjs", contrastFloor: FLOOR, total: 0, safe: [], unsafe: [] },
      {
        safe: safe.sort(),
        unsafe: unsafe.sort((a, b) => a.name.localeCompare(b.name)),
        audited: allTemplates.map((t) => t.name),
      }
    );
  }
  writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
}

console.log(`${THEME}-safe: ${safe.length}/${allTemplates.length}  (${totalMeasured} text nodes measured, ${totalSkipped} over a picture)`);
if (unsafe.length) {
  console.log(`\nnot safe in ${THEME} (${unsafe.length}):`);
  for (const u of unsafe) console.log(`  ${u.name.padEnd(30)} ${u.reason}${u.worst ? `  worst ${u.worst.ratio}:1` : ""}`);
}
if (THEME === "dark") console.log(`\nwritten to js/dark-safe.json`);
// Full run: exit 1 on unsafe unconditionally (original behavior, unchanged).
// Filtered run (--only / --missing): exit 0 on unsafe unless --strict is passed.
const isFullRun = auditPool === null;
if (unsafe.length && (isFullRun || process.argv.includes("--strict"))) process.exit(1);
