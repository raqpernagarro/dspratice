#!/usr/bin/env node
// =============================================================================
// Builds the "Nagarro Master Slides" design system (a Claude Design System
// artifact) from this repository: tokens, fonts, the template engine bundle,
// one card per slide category, the brand book, media and the publish plan.
//
//   node tools/design-system/build.mjs              full build
//   node tools/design-system/build.mjs --skip-media reuse .build/out/project/media
//
// Output: tools/design-system/.build/out/project/  (git-ignored)
// Publishing is done with Claude's Artifact tool; see README.md here.
// =============================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const BUILD = path.join(HERE, ".build");
const OUT = path.join(BUILD, "out/project");
const skipMedia = process.argv.includes("--skip-media");
const ESBUILD_VERSION = "0.28.1";

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: BUILD, stdio: "inherit", ...opts });
const step = (s) => console.log(`\n▸ ${s}`);

fs.mkdirSync(BUILD, { recursive: true });
// Start clean, but keep re-encoded media when asked to (it takes a few minutes).
if (fs.existsSync(OUT)) {
  for (const e of fs.readdirSync(OUT, { withFileTypes: true })) {
    if (skipMedia && e.name === "media") continue;
    fs.rmSync(path.join(OUT, e.name), { recursive: true, force: true });
  }
}
fs.mkdirSync(OUT, { recursive: true });

const ref = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT }).toString().trim();
const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT }).toString().trim();
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(BUILD, "source.json"), JSON.stringify({ ref: `${branch}@${ref}`, date: today }));

step("Role categories (product/domain/template-service.js)");
const svc = fs.readFileSync(path.join(ROOT, "product/domain/template-service.js"), "utf8");
const block = svc.match(/export const ROLE_CATEGORY = \{[\s\S]*?\n\};/);
if (!block) throw new Error("ROLE_CATEGORY not found in template-service.js");
fs.writeFileSync(path.join(BUILD, "role-category.js"), block[0] + "\n");

step("Template inventory");
run("node", [path.join(HERE, "inventory.mjs")]);

step(`Engine bundle (esbuild ${ESBUILD_VERSION})`);
const local = path.join(ROOT, "node_modules/.bin/esbuild");
const esArgs = [path.join(HERE, "entry.js"), "--bundle", "--format=iife", "--minify", "--legal-comments=none", "--log-level=error", `--outfile=${path.join(BUILD, "bundle.raw.js")}`];
if (fs.existsSync(local)) run(local, esArgs);
else run("npx", ["--yes", `esbuild@${ESBUILD_VERSION}`, ...esArgs]);
// The bundle is inlined into preview frames: no literal "</script" or "<!--" may survive.
let js = fs.readFileSync(path.join(BUILD, "bundle.raw.js"), "utf8").replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "\\x3C!--");
fs.writeFileSync(path.join(BUILD, "bundle.js"), '/* @ds-bundle: {"format":4,"namespace":"NagarroSlides","components":[]} */\n' + js);

step("Smoke test: render every template");
{
  globalThis.window = {};
  const warn = console.warn; console.warn = () => {};
  new Function(fs.readFileSync(path.join(BUILD, "bundle.js"), "utf8"))();
  console.warn = warn;
  const N = globalThis.window.NagarroSlides;
  const bad = [];
  for (const t of N.templates) {
    try { const h = N.render(t.name); if (/src="assets\//.test(h)) bad.push(`${t.name}: unrewritten asset path`); }
    catch (e) { bad.push(`${t.name}: ${e.message}`); }
  }
  console.log(`  ${N.templates.length} templates, ${bad.length} failures`);
  if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
  delete globalThis.window;
}

if (skipMedia && fs.existsSync(path.join(OUT, "media"))) step("Media: reusing .build/out/project/media");
else { step("Media (sips)"); run("python3", [path.join(HERE, "media.py")]); }

step("Tokens, stylesheet, slide library cards, catalog");
run("node", [path.join(HERE, "make-tokens-and-library.mjs")]);
step("Frame, brand, block and deck cards");
run("node", [path.join(HERE, "make-cards.mjs")]);

step("Brand book and static files");
const copyStatic = (dir, rel = "") => {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (e.isDirectory()) { copyStatic(dir, r); continue; }
    const dst = path.join(OUT, r);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    let s = fs.readFileSync(path.join(dir, r), "utf8");
    s = s.replaceAll("{{SOURCE_REF}}", `${branch}@${ref}`).replaceAll("{{SOURCE_DATE}}", today);
    s = s.replaceAll("{{FIGMA_VS_CODE}}", fs.readFileSync(path.join(BUILD, "figma-vs-code.md"), "utf8").trim());
    fs.writeFileSync(dst, s);
  }
};
copyStatic(path.join(HERE, "static"));

step("Brand asset uploads and index");
// Logos, caring icons and scribbles are asset UPLOADS in the artifact (Assets view).
// Their blob ids live in assets-blobs.txt; a file with no id must be uploaded first.
const UP = path.join(BUILD, "upload");
const slug = (s) => s.toLowerCase().replace(/ /g, "-");
const stage = [
  ["Logos", "assets/logos", (f) => !f.includes("(1)")], ["Logos", "assets/logo"], ["Logos", "assets/app-icon", null, (f) => `app-icon-${slug(f)}`],
  ["Caring", "assets/caring-icons"], ["Caring", "assets/caring-logo"], ["Scribbles", "assets/scribbles"],
];
fs.rmSync(UP, { recursive: true, force: true });
for (const [g, dir, keep, rename] of stage) {
  fs.mkdirSync(path.join(UP, g), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".svg") && (!keep || keep(f)))) {
    fs.copyFileSync(path.join(ROOT, dir, f), path.join(UP, g, rename ? rename(f) : slug(f)));
  }
}
const blobs = Object.fromEntries(fs.readFileSync(path.join(HERE, "assets-blobs.txt"), "utf8").trim().split("\n").map((l) => { const [g, n, b] = l.split(/\s+/); return [`${g}/${n}`, b]; }));
const groups = {}, missing = [];
const tiles = { Logos: "m", Caring: "s", Scribbles: "m" };
for (const g of ["Logos", "Caring", "Scribbles"]) {
  groups[g] = { name: g, tile: tiles[g], order: [], files: {} };
  const names = fs.readdirSync(path.join(UP, g)).sort((a, b) => {
    const rank = (n) => (/^nagarro-horizontal/.test(n) ? 0 : /^nagarro-vertical/.test(n) ? 1 : /tagline/.test(n) ? 2 : /^nagarro-logo/.test(n) ? 3 : 4);
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  for (const n of names) {
    const id = blobs[`${g}/${n}`];
    if (!id) { missing.push(`${g}/${n}`); continue; }
    groups[g].order.push(n);
    groups[g].files[n] = { name: n, blob: id, size: fs.statSync(path.join(UP, g, n)).size, type: "image/svg+xml" };
  }
}
const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
// The artifact this builds into. Its createdOnFiles marker must never change after the first publish.
const artifact = JSON.parse(fs.readFileSync(path.join(HERE, "artifact.json"), "utf8"));
const index = {
  v: 3, layout: "files", createdOnFiles: artifact.createdOnFiles, title: artifact.title, namespace: "NagarroSlides",
  libraries: [], sections: {}, groups: ["Logos", "Caring", "Scribbles"], assetGroups: groups, blobs: {}, docs: { sections: [] },
  lastChange: { by: process.env.DS_AUTHOR || "Claude", at: now, via: "tools/design-system", note: `Built from Presentation_v1 ${branch}@${ref}.` },
};
fs.writeFileSync(path.join(OUT, "design-system.json"), JSON.stringify(index, null, 2));
if (missing.length) console.warn(`  ${missing.length} brand assets have no upload id yet (upload them, add to assets-blobs.txt):\n  ` + missing.join("\n  "));

step("Publish plan");
// The Artifact tool takes at most 255 files and 16 MiB per call; the index goes last.
const all = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : all.push(p); } };
walk(OUT);
const rel = (p) => path.relative(path.join(BUILD, "out"), p);
const media = all.filter((p) => rel(p).startsWith("project/media/")).sort();
const rest = all.filter((p) => !rel(p).startsWith("project/media/") && !p.endsWith("design-system.json") && !path.basename(p).startsWith("_test")).sort();
const batches = []; let cur = [], size = 0;
for (const p of media) {
  const s = fs.statSync(p).size;
  if (cur.length >= 250 || size + s > 14_500_000) { batches.push(cur); cur = []; size = 0; }
  cur.push(rel(p)); size += s;
}
if (cur.length) batches.push(cur);
batches.push(rest.map(rel));
const plan = batches.map((b, i) => ({ call: i + 1, files: b.length, mb: +(b.reduce((a, r) => a + fs.statSync(path.join(BUILD, "out", r)).size, 0) / 1e6).toFixed(1), last: i === batches.length - 1 }));
fs.writeFileSync(path.join(BUILD, "publish-plan.json"), JSON.stringify({ root: path.join(BUILD, "out"), index: "project/design-system.json", batches }, null, 1));
console.table(plan);
console.log(`\nDone: ${all.length} files in ${OUT}\nPublish: see tools/design-system/README.md`);
