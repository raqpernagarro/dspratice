// Merges hand-written captions into assets/photography/manifest.json.
//
//   node tools/merge-captions.mjs <batch.json>
//
// This is the no-API-spend counterpart to caption-photos.mjs. Instead of calling
// the API, a person (or a Claude Code session that has actually LOOKED at each
// photo) writes the caption fields by hand; this script supplies everything that
// must be derived from the file itself — id, content hash, pixel dimensions and
// orientation — validates every entry, and merges them in.
//
// <batch.json> is an array of objects. Each has a "file" key naming a photo in
// assets/photography/, plus exactly the caption fields validateEntry expects:
//
//   [
//     {
//       "file": "_H7A5073.jpg",
//       "description": "A woman in a navy Nagarro polo holds the mint-green loop ...",
//       "tags": ["portrait", "loop-mark", "outdoor", "single-person"],
//       "people": { "count": 1, "framing": "portrait" },
//       "tone": "friendly-brand-portrait",
//       "brightness": "bright",
//       "busyness": "clean",
//       "text_safe": false,
//       "focal_point": { "x": 0.42, "y": 0.38 }
//     }
//   ]
//
// Do NOT put id/hash/w/h/orientation in the batch file — they are derived here,
// and a batch that supplies them is rejected. Nothing is written unless EVERY
// entry validates, so a typo in one caption can't leave a half-merged manifest.
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import { readDimensions } from "./lib/downscale.mjs";
import { validateEntry } from "./lib/manifest-schema.mjs";
import { idFor } from "./caption-photos.mjs";

const PHOTO_DIR = new URL("../assets/photography/", import.meta.url).pathname;
const MANIFEST = join(PHOTO_DIR, "manifest.json");

// Fields the merge derives from the photo itself. A batch file that sets any of
// them is a mistake worth failing on: a hand-typed hash or dimension would
// silently disagree with the file and break the incremental re-caption check.
const DERIVED = ["id", "hash", "w", "h", "orientation"];

const batchPath = process.argv[2];
if (!batchPath) {
  console.error("Usage: node tools/merge-captions.mjs <batch.json>");
  process.exit(1);
}

const batch = JSON.parse(readFileSync(batchPath, "utf8"));
if (!Array.isArray(batch) || batch.length === 0) {
  console.error(`${batchPath} must be a non-empty array of caption objects.`);
  process.exit(1);
}

const browser = await chromium.launch();
let entries;
try {
  const page = await browser.newPage();
  const problems = [];
  entries = [];

  for (const raw of batch) {
    const { file, ...caption } = raw;
    if (!file) {
      problems.push(`entry without a "file" key: ${JSON.stringify(raw).slice(0, 80)}`);
      continue;
    }
    const abs = join(PHOTO_DIR, file);
    if (!existsSync(abs)) {
      problems.push(`${file}: no such photo in assets/photography/`);
      continue;
    }
    const supplied = DERIVED.filter((k) => k in caption);
    if (supplied.length) {
      problems.push(`${file}: remove derived field(s) ${supplied.join(", ")} — they are computed here`);
      continue;
    }
    const found = validateEntry(caption);
    if (found.length) {
      problems.push(`${file}: ${found.join("; ")}`);
      continue;
    }

    const hash = createHash("sha256").update(readFileSync(abs)).digest("hex").slice(0, 16);
    const dims = await readDimensions(page, abs);
    entries.push({
      id: idFor(file),
      file,
      hash,
      w: dims.w,
      h: dims.h,
      orientation: dims.w === dims.h ? "square" : dims.w > dims.h ? "landscape" : "portrait",
      ...caption,
    });
  }

  // All-or-nothing: report every problem at once so a batch can be fixed in one
  // pass, and write nothing until the whole batch is clean.
  if (problems.length) {
    console.error(`Rejected ${problems.length} of ${batch.length} entries. Nothing written.\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exitCode = 1;
    entries = null;
  }
} finally {
  await browser.close();
}

if (!entries) process.exit(1);

const existing = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, "utf8")).photos
  : [];
const byId = new Map(existing.map((p) => [p.id, p]));
let added = 0;
let replaced = 0;
for (const entry of entries) {
  if (byId.has(entry.id)) replaced++;
  else added++;
  byId.set(entry.id, entry);
}

const photos = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
const contents =
  JSON.stringify({ version: 1, generated: new Date().toISOString(), photos }, null, 2) + "\n";
const tmpPath = join(PHOTO_DIR, `.manifest.json.tmp-${process.pid}`);
writeFileSync(tmpPath, contents);
renameSync(tmpPath, MANIFEST);

console.log(`Merged ${entries.length} caption(s): ${added} added, ${replaced} replaced.`);
console.log(`Manifest now holds ${photos.length} entries.`);
console.log(`  text_safe: ${photos.filter((p) => p.text_safe).length}`);
console.log(`  single-person: ${photos.filter((p) => p.people.count === 1).length}`);
