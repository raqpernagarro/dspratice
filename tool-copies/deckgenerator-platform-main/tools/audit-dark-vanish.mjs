#!/usr/bin/env node
// tools/audit-dark-vanish.mjs
// =============================================================================
// What disappears when a slide goes dark?
//
// audit-dark-mode.mjs measures TEXT contrast. It cannot see a connector line,
// a chart bar, a logo or a tile that turns the same colour as the dark page —
// and those were most of the dark-mode bugs reported on 2026-10-14 (grid-13/15
// connectors, case-study stat tiles, black brand swatches). This audit catches
// them by comparing pictures instead of measuring text:
//
//   1. Render every template light and dark through the real capture page,
//      with photos and background images HIDDEN (a photo's dark areas would
//      otherwise "vanish" on a dark ground and drown the report in noise).
//   2. Light "ink" = pixels that differ STRONGLY from the light page colour
//      (> LIGHT_T on the max channel).
//   3. Dark "ink"  = pixels that differ even FAINTLY from the dark page colour
//      (> DARK_T), dilated by 2px so a 1px shift never counts as a loss.
//   4. Vanished = light ink with no dark ink at the same spot. A template whose
//      vanished share is above --threshold is reported.
//
// Everything runs in Node + the browser (canvas) — no Python, no sharp — so it
// works on any machine that can run the other audits.
//
// Usage (the studio must be running: npm start):
//   node tools/audit-dark-vanish.mjs                 # all live templates
//   node tools/audit-dark-vanish.mjs --only=main/grid-13,pitch/text-11
//   node tools/audit-dark-vanish.mjs --threshold=0.02
//   node tools/audit-dark-vanish.mjs --out=/tmp/vanish   # also write light/dark/mask PNGs
//
// Exit code 1 when any template that is not in KNOWN exceeds the threshold.
// =============================================================================
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { allTemplates } from "../js/templates/index.js";

const ORIGIN = process.env.NPS_ORIGIN || "http://localhost:4600";
const CAPTURE = `${ORIGIN}/product/export-runtime/capture.html`;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const THRESHOLD = Number(arg("threshold") ?? 0.01);
const OUT = arg("out");
const ONLY = arg("only") ? new Set(arg("only").split(",")) : null;
const LIGHT_T = 70, DARK_T = 16, DILATE = 2;

/* Reviewed and accepted: they read as intended in dark, but the metric still
   flags them. Listed with the reason so a reader can re-judge them. */
const KNOWN = {
  "main/text-06": "full-bleed photo slide; blank only because the audit hides photos",
  "strategy/grid-08": "nested rings are faint tints in both themes (white 9% in dark)",
  "brand-guidelines/grid-02": "black brand swatch on black; the edge is kept by a dark-mode hairline",
  "brand-guidelines/grid-08": "black brand dot on black; hairline",
  "brand-guidelines/grid-09": "black brand swatch on black; hairline",
  "brand-guidelines/grid-10": "black pairing circle on black; hairline",
  "brand-guidelines/grid-11": "black hierarchy bars on black; hairline",
  "brand-guidelines/text-04": "black brand swatch on black; hairline",
  "brand-guidelines/gallery-02": "black logo tile on black; logo + hairline",
  "brand-guidelines/gallery-03": "black logo tiles on black; the logo and a dark-mode hairline keep them",
  "brand-guidelines/gallery-04": "black logo tile on black; logo + hairline",
  "brand-guidelines/gallery-06": "black logo tile on black; logo + hairline",
  "brand-guidelines/gallery-07": "black logo panel on black; logo + hairline",
  "brand-guidelines/gallery-08": "black app-icon tile on the dark pill; the mint mark keeps it",
};

if (OUT) mkdirSync(OUT, { recursive: true });
const pool = allTemplates.filter((t) => !t.replacedBy && (!ONLY || ONLY.has(t.name)));
if (ONLY && pool.length !== ONLY.size) {
  const found = new Set(pool.map((t) => t.name));
  console.error(`--only name(s) not found: ${[...ONLY].filter((n) => !found.has(n)).join(", ")}`);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 0.5 });
try {
  await page.goto(CAPTURE, { waitUntil: "load" });
} catch {
  console.error(`Could not reach ${CAPTURE}. Start the studio first (npm start).`);
  process.exit(1);
}
await page.addStyleTag({
  content: `.stage img, .stage video, .stage image { visibility: hidden !important; }
            .stage * { background-image: none !important; }`,
});

const shot = async (t, theme) => {
  const r = await page.evaluate((s) => window.__mountSlide(s, {}), { template: t.name, theme, ...t.example });
  if (!r?.ok) return null;
  await page.waitForTimeout(40);
  return (await (await page.$(".stage")).screenshot({ animations: "disabled" })).toString("base64");
};

/* Runs in the page: decode both PNGs onto a canvas and compare ink masks. */
const compare = (light, dark, opts) => (async () => {
  const load = async (b64) => {
    const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const g = c.getContext("2d"); g.drawImage(bmp, 0, 0);
    return { w: bmp.width, h: bmp.height, d: g.getImageData(0, 0, bmp.width, bmp.height).data };
  };
  const L = await load(light), D = await load(dark);
  const { w, h } = L;
  // Page colour = a pixel at the right edge, mid-height (outside any chrome).
  const at = (img, x, y) => { const i = (y * w + x) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2]]; };
  const lbg = at(L, w - 3, h >> 1), dbg = at(D, w - 3, h >> 1);
  const diff = (img, bg, x) => Math.max(Math.abs(img.d[x] - bg[0]), Math.abs(img.d[x + 1] - bg[1]), Math.abs(img.d[x + 2] - bg[2]));
  const darkInk = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) darkInk[p] = diff(D, dbg, p * 4) > opts.DARK_T ? 1 : 0;
  // Dilate dark ink (separable max filter) so tiny offsets don't count.
  const tmp = new Uint8Array(w * h), dil = new Uint8Array(w * h), r = opts.DILATE;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let m = 0; for (let k = -r; k <= r && !m; k++) { const xx = x + k; if (xx >= 0 && xx < w) m = darkInk[y * w + xx]; } tmp[y * w + x] = m;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let m = 0; for (let k = -r; k <= r && !m; k++) { const yy = y + k; if (yy >= 0 && yy < h) m = tmp[yy * w + x]; } dil[y * w + x] = m;
  }
  let lightInk = 0, vanished = 0;
  const mask = opts.WANT_MASK ? new OffscreenCanvas(w, h) : null;
  const mctx = mask?.getContext("2d"), mdata = mctx?.createImageData(w, h);
  for (let p = 0; p < w * h; p++) {
    if (diff(L, lbg, p * 4) <= opts.LIGHT_T) continue;
    lightInk++;
    if (!dil[p]) { vanished++; if (mdata) { const i = p * 4; mdata.data[i] = 255; mdata.data[i + 1] = 60; mdata.data[i + 2] = 60; } }
  }
  let maskB64 = null;
  if (mask) {
    for (let p = 3; p < mdata.data.length; p += 4) mdata.data[p] = 255;
    mctx.putImageData(mdata, 0, 0);
    const blob = await mask.convertToBlob({ type: "image/png" });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    maskB64 = btoa(bin);
  }
  return { lightInk, vanished, maskB64 };
})();

const rows = [];
for (const t of pool) {
  const light = await shot(t, "light"), dark = await shot(t, "dark");
  if (!light || !dark) { rows.push({ name: t.name, share: 1, vanished: 0, lightInk: 0, error: "does not mount" }); continue; }
  const res = await page.evaluate(
    ([l, d, o]) => (window.__vanish ||= eval(`(${o.fn})`))(l, d, o),
    [light, dark, { fn: compare.toString(), LIGHT_T, DARK_T, DILATE, WANT_MASK: !!OUT }]
  );
  const share = res.lightInk ? res.vanished / res.lightInk : 0;
  rows.push({ name: t.name, share, vanished: res.vanished, lightInk: res.lightInk });
  if (OUT && share > THRESHOLD) {
    const base = `${OUT}/${t.name.replace("/", "__")}`;
    writeFileSync(`${base}--light.png`, Buffer.from(light, "base64"));
    writeFileSync(`${base}--dark.png`, Buffer.from(dark, "base64"));
    if (res.maskB64) writeFileSync(`${base}--vanished.png`, Buffer.from(res.maskB64, "base64"));
  }
}
await browser.close();

rows.sort((a, b) => b.share - a.share);
const over = rows.filter((r) => r.share > THRESHOLD);
const fresh = over.filter((r) => !KNOWN[r.name]);
console.log(`dark-vanish: ${rows.length - over.length}/${rows.length} keep their content in dark (threshold ${(THRESHOLD * 100).toFixed(1)}% of light ink)`);
if (over.length) {
  console.log(`\nflagged (${over.length}, ${fresh.length} new):`);
  for (const r of over) {
    const tag = r.error ? r.error : KNOWN[r.name] ? `known — ${KNOWN[r.name]}` : "NEW";
    console.log(`  ${(r.share * 100).toFixed(1).padStart(5)}%  ${r.name.padEnd(32)} ${tag}`);
  }
}
if (OUT && over.length) console.log(`\nlight / dark / vanished PNGs for flagged templates written to ${OUT}`);
if (fresh.length) process.exit(1);
