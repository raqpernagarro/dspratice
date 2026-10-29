#!/usr/bin/env node
// tools/generate-briefs.mjs
// =============================================================================
// Runs a spread of briefs through the real generation path.
//
// Everything else in tools/ measures templates or decks that already exist.
// This exercises the part that was still only ever sampled: the engine reading
// a brief and choosing layouts for it. One deck told us the closing slide lost
// five decisions and a quote lost its speaker; ten decks across different
// sectors, tones and content shapes is the first honest look at whether that
// was two bugs or a pattern.
//
// The briefs are chosen to pull in different directions — figures against
// prose, a roster against a paragraph that merely mentions a job title, a
// celebratory subject against a grave one, a three-slide summary against a
// sixteen-slide review. Anything the engine only gets right on business-as-
// usual copy should break on at least one of them.
//
// Slow and real: each brief is a model call, then an approval that composes
// every slide. Budget roughly three to five minutes each.
//
//   node tools/generate-briefs.mjs                 # all ten, two at a time
//   node tools/generate-briefs.mjs --only 3        # just brief 3 (or --only 1,4)
//   node tools/generate-briefs.mjs --concurrency 1
//   node tools/generate-briefs.mjs --weak          # the four short prompts
//   node tools/generate-briefs.mjs --weak --no-hook
//   node tools/generate-briefs.mjs --refs <dir>    # REF_BRIEFS, every file in
//                                                  # <dir> attached as a reference
//   … --out run.json                               # tag → generation/deck ids
//
// Every brief asks for the hook (wantsHook: true) unless --no-hook is given.
// Drafting runs in the background (202 + polling), as the home page does: the
// understand → story → outline steps can outlast a held-open request.
// =============================================================================
const ORIGIN = process.env.NPS_ORIGIN || "http://localhost:4600";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
};
const CONCURRENCY = Number(arg("--concurrency", 2));
const ONLY = arg("--only", null);
const WEAK = process.argv.includes("--weak");
const WANTS_HOOK = !process.argv.includes("--no-hook");
const REFS_DIR = arg("--refs", null);
const OUT = arg("--out", null);

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { BRIEFS, WEAK_BRIEFS, REF_BRIEFS } from "./briefs.mjs";

/* Refuse to run against a server older than the code being tested.
 *
 * The first run of this file produced ten decks and a page of conclusions, all
 * of them void: the server process had been up since before six waves of engine
 * fixes, so it composed with the old modules while serving the new CSS. The
 * output looked current. Nothing in it was. */
async function assertServerIsCurrent() {
  const { execSync } = await import("node:child_process");
  let head = null;
  try { head = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(); } catch { /* not a checkout */ }
  if (!head) return;

  let meta = null;
  try { meta = await (await fetch(`${ORIGIN}/api/meta`)).json(); } catch { /* older server */ }
  if (!meta?.commit) {
    console.error(
      `The server at ${ORIGIN} does not report its commit, which means it booted\n` +
      `before this check existed. Restart it (npm start) and run this again.`);
    process.exit(1);
  }
  if (meta.commit !== head) {
    console.error(
      `The server is running ${meta.commit.slice(0, 8)}; this checkout is ${head.slice(0, 8)}.\n` +
      `Node loads a module once per process, so every change under product/domain\n` +
      `since then is absent from it. Restart the server before generating.`);
    process.exit(1);
  }
}
await assertServerIsCurrent();

const post = async (path, body) => {
  const res = await fetch(`${ORIGIN}${path}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const get = async (path) => (await fetch(`${ORIGIN}${path}`)).json();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Uploads every file in `dir` as a reference; their ids, in name order. */
async function uploadReferences(dir) {
  if (!existsSync(dir)) {
    console.error(`--refs: ${dir} does not exist.`);
    process.exit(1);
  }
  const ids = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (name.startsWith(".") || !statSync(path).isFile()) continue;
    const res = await fetch(`${ORIGIN}/api/references?filename=${encodeURIComponent(basename(name))}`, {
      method: "POST", headers: { "content-type": "application/octet-stream" }, body: readFileSync(path),
    });
    const json = await res.json().catch(() => null);
    if (res.status !== 201 || !json?.id) {
      console.error(`--refs: ${name} was not accepted: ${res.status} ${JSON.stringify(json).slice(0, 160)}`);
      process.exit(1);
    }
    console.log(`reference ${name} → ${json.id} (${json.kind})`);
    ids.push(json.id);
  }
  if (!ids.length) {
    console.error(`--refs: ${dir} holds no files.`);
    process.exit(1);
  }
  return ids;
}
const referenceIds = REFS_DIR ? await uploadReferences(REFS_DIR) : [];

async function runBrief(brief, index) {
  const label = `${String(index + 1).padStart(2)} ${brief.tag.padEnd(18)}`;
  const startedAt = Date.now();
  const started = await post("/api/generations", {
    prompt: brief.prompt, wantsHook: WANTS_HOOK, referenceIds, background: true,
  });
  if (started.status !== 202 || !started.json?.id) {
    console.log(`${label} FAILED to start: ${started.status} ${JSON.stringify(started.json).slice(0, 120)}`);
    return null;
  }
  // Drafting continues after the 202; poll until the outline is ready.
  let gen = { json: started.json };
  for (let i = 0; i < 180 && gen.json?.status === "pending"; i++) {
    await wait(5000);
    gen = { json: await get(`/api/generations/${started.json.id}`) };
  }
  if (gen.json?.status === "pending") {
    console.log(`${label} timed out while drafting`);
    return null;
  }
  if (gen.json.status === "failed") {
    console.log(`${label} generation failed: ${gen.json.error}`);
    return null;
  }
  const slides = (gen.json.proposedMapping || []).length;
  console.log(`${label} outlined ${slides} slides in ${Math.round((Date.now() - startedAt) / 1000)}s`);

  const approved = await post(`/api/generations/${gen.json.id}/approve`, {});
  if (approved.status !== 202 && approved.status !== 201) {
    console.log(`${label} FAILED to approve: ${approved.status}`);
    return null;
  }
  for (let i = 0; i < 120; i++) {
    await wait(5000);
    const rec = await get(`/api/generations/${gen.json.id}`);
    if (rec.status === "approved" && rec.presentationId) {
      const warned = rec.composeWarnings?.length ? `  ⚠ ${rec.composeWarnings.length} compose warning(s)` : "";
      console.log(`${label} composed in ${Math.round((Date.now() - startedAt) / 1000)}s${warned}`);
      for (const w of rec.composeWarnings || []) console.log(`${" ".repeat(22)}${w}`);
      return { tag: brief.tag, generationId: rec.id, presentationId: rec.presentationId, wantsHook: WANTS_HOOK, referenceIds };
    }
    if (rec.status === "completed" || rec.status === "failed") {
      console.log(`${label} composition failed: ${rec.error}`);
      return null;
    }
  }
  console.log(`${label} timed out waiting for composition`);
  return null;
}

const SET = WEAK ? WEAK_BRIEFS : REFS_DIR ? REF_BRIEFS : BRIEFS;
const briefs = ONLY
  ? ONLY.split(",").map((n) => SET[Number(n) - 1]).filter(Boolean)
  : SET;
console.log(`Running ${briefs.length} brief(s), ${CONCURRENCY} at a time` +
  `${WANTS_HOOK ? ", with the hook" : ", no hook"}${referenceIds.length ? `, ${referenceIds.length} reference(s)` : ""}.\n`);

const ids = [];
const queue = briefs.map((b, i) => [b, i]);
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
  while (queue.length) {
    const [brief, i] = queue.shift();
    const run = await runBrief(brief, i);
    if (run) ids.push(run);
  }
}));

console.log(`\n${ids.length}/${briefs.length} decks built.`);
if (OUT) {
  const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
  writeFileSync(OUT, JSON.stringify([...previous, ...ids], null, 2) + "\n");
  console.log(`Run log appended to ${OUT}.`);
}
console.log("Now sweep them:\n  node tools/audit-decks.mjs\n  node tools/audit-slide-layout.mjs");
