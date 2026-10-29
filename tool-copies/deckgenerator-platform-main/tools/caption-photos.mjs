// Captions every photo in assets/photography/ into manifest.json.
// Incremental: only files whose content hash changed are re-captioned.
//
//   ANTHROPIC_API_KEY=... node tools/caption-photos.mjs [--limit N] [--force]
//
// --limit N  stop once N photos have been SUCCESSFULLY captioned and stored
//            (accepts "--limit N" or "--limit=N"). Rejected/errored photos do
//            NOT count toward N — they are skipped but the run continues, so
//            this caps successful captions, not attempts. Use for the review
//            checkpoint before committing to the full run. An invalid or
//            missing value is a hard error (exits 1); it never falls back to
//            an unlimited run.
// --force    re-caption everything, ignoring hashes
import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { openDownscaler, readDimensions } from "./lib/downscale.mjs";
import { CAPTION_SCHEMA, validateEntry } from "./lib/manifest-schema.mjs";

const PHOTO_DIR = new URL("../assets/photography/", import.meta.url).pathname;
const MANIFEST = join(PHOTO_DIR, "manifest.json");

const SYSTEM = `You are cataloguing a corporate photography library so that a
presentation generator can choose the right photograph for a given slide.

Describe what makes THIS photograph different from the ~200 others in the same
library. Nearly all of them show people in offices, so "people working in an
office" is useless. Name the specific activity, the framing, the light, the
setting, and the number of people.

Judge text_safe strictly. It is true only when a large, calm, evenly-lit region
exists where overlaid white or dark type would remain readable. A photograph can
be beautiful and still not be text_safe.

focal_point is where a viewer's eye lands — the main subject's face or the centre
of the group — expressed as fractions of the frame. It is used to crop the image
without cutting people's heads off.`;

// Stable id derived from the filename: strip the extension, collapse runs of
// non-alphanumerics to one hyphen, trim leading/trailing hyphens (several source
// files start with "_", which would otherwise yield "nagarro--h7a4835"), then
// prefix. The filename is the join key back to the original photograph, so this
// must stay deterministic — changing it invalidates every existing manifest id.
export const idFor = (file) =>
  "nagarro-" +
  file
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

function loadManifest() {
  if (!existsSync(MANIFEST)) return { version: 1, generated: null, photos: [] };
  return JSON.parse(readFileSync(MANIFEST, "utf8"));
}

// Single writer for manifest.json. Sorts by id and writes the exact
// { version, generated, photos } shape the rest of the system depends on.
// Writes atomically: the full JSON lands in a temp file in the same
// directory first, then a renameSync swaps it into place. A process killed
// mid-write leaves the old manifest.json untouched (the temp file is the
// only thing that can be half-written) instead of a truncated, unparseable
// manifest.
function saveManifest(byId) {
  const photos = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const contents =
    JSON.stringify({ version: 1, generated: new Date().toISOString(), photos }, null, 2) + "\n";
  const tmpPath = join(PHOTO_DIR, `.manifest.json.tmp-${process.pid}`);
  writeFileSync(tmpPath, contents);
  renameSync(tmpPath, MANIFEST);
  return photos;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");

  // Accept both "--limit N" and "--limit=N". A --limit flag with a missing,
  // non-numeric, non-integer, or sub-1 value is a hard error — this must
  // never silently fall through to an unlimited (full 209-photo, paid) run.
  const eqArg = args.find((a) => a.startsWith("--limit="));
  const spaceIdx = args.indexOf("--limit");
  const limitFlagPresent = eqArg !== undefined || spaceIdx !== -1;

  let limit = Infinity;
  if (limitFlagPresent) {
    const raw = eqArg !== undefined ? eqArg.slice("--limit=".length) : args[spaceIdx + 1];
    const parsed = Number(raw);
    if (raw === undefined || raw === "" || !Number.isInteger(parsed) || parsed < 1) {
      console.error(
        `Invalid --limit value: ${raw === undefined || raw === "" ? "(missing)" : JSON.stringify(raw)}. ` +
          `--limit requires a positive integer.`
      );
      process.exit(1);
    }
    limit = parsed;
  }

  console.log(
    limitFlagPresent ? `Captioning at most ${limit} photo(s).` : "Captioning all remaining photos."
  );

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    process.exit(1);
  }

  const client = new Anthropic();
  const manifest = loadManifest();
  const byId = new Map(manifest.photos.map((p) => [p.id, p]));

  const files = readdirSync(PHOTO_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort();

  // Ctrl-C (SIGINT), a `kill` (SIGTERM), or any other interrupt must not
  // lose captions already paid for and held only in `byId`. Both signals
  // save whatever is in `byId` right now and exit non-zero. `shuttingDown`
  // guards against a second signal (or SIGINT followed by SIGTERM) racing
  // a save already in flight — saveManifest is synchronous, so the guard
  // is enough to make re-entry a no-op rather than a corrupt double-write.
  //
  // Both Chromium instances (the downscaler's and the dimension reader's)
  // are also closed here, best-effort, before exiting — otherwise repeated
  // Ctrl-C during a long run orphans browser processes, since exiting via
  // process.exit(1) skips the `finally` block below. The save happens FIRST
  // (it is the irreplaceable work); closing the browsers is attempted after,
  // and a close failure must never prevent the process from exiting.
  let downscaler = null;
  let dimBrowser = null;
  let shuttingDown = false;
  async function handleShutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nReceived ${signal}. Saving manifest before exit...`);
    try {
      const photos = saveManifest(byId);
      console.log(`Manifest saved with ${photos.length} entries.`);
    } catch (err) {
      console.error(`Failed to save manifest: ${err.message}`);
    }
    if (downscaler) {
      try {
        await downscaler.close();
      } catch (err) {
        console.error(`Failed to close downscaler: ${err.message}`);
      }
    }
    if (dimBrowser) {
      try {
        await dimBrowser.close();
      } catch (err) {
        console.error(`Failed to close dimBrowser: ${err.message}`);
      }
    }
    process.exit(1);
  }
  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));

  downscaler = await openDownscaler();
  dimBrowser = await chromium.launch();
  const dimPage = await dimBrowser.newPage();

  let done = 0;
  const failures = [];
  let fatalError = null;

  try {
    for (const file of files) {
      const id = idFor(file);
      const abs = join(PHOTO_DIR, file);
      const hash = createHash("sha256").update(readFileSync(abs)).digest("hex").slice(0, 16);

      if (!force && byId.get(id)?.hash === hash) continue;
      if (done >= limit) break;

      process.stdout.write(`[${done + 1}] ${file} ... `);
      try {
        const [b64, dims] = await Promise.all([
          downscaler.toBase64Jpeg(abs),
          readDimensions(dimPage, abs),
        ]);

        const res = await client.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 2000,
          system: SYSTEM,
          output_config: { format: { type: "json_schema", schema: CAPTION_SCHEMA } },
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
              { type: "text", text: "Catalogue this photograph." },
            ],
          }],
        });

        const textBlock = res.content.find((b) => b.type === "text");
        if (!textBlock) {
          throw new Error(
            `no text block in response (stop_reason: ${res.stop_reason ?? "unknown"})`
          );
        }

        let caption;
        try {
          caption = JSON.parse(textBlock.text);
        } catch (parseErr) {
          throw new Error(`could not parse JSON response: ${parseErr.message}`);
        }

        const problems = validateEntry(caption);
        if (problems.length) {
          failures.push({ file, problems });
          console.log(`REJECTED (${problems.join("; ")})`);
          continue;
        }

        byId.set(id, {
          id, file, hash,
          w: dims.w, h: dims.h,
          orientation: dims.w === dims.h ? "square" : dims.w > dims.h ? "landscape" : "portrait",
          ...caption,
        });
        saveManifest(byId);
        console.log("ok");
        done++;
      } catch (err) {
        failures.push({ file, problems: [err.message] });
        console.log(`ERROR ${err.message}`);
      }
    }
  } catch (err) {
    // Something escaped the per-photo try (e.g. the hash read above throwing
    // on an unreadable/removed file). Save whatever is captioned so far
    // before this propagates, then still let `finally` close the browsers.
    fatalError = err;
    console.error(`\nUnexpected error: ${err.message}`);
    try {
      const photos = saveManifest(byId);
      console.log(`Manifest saved with ${photos.length} entries before exit.`);
    } catch (saveErr) {
      console.error(`Failed to save manifest: ${saveErr.message}`);
    }
  } finally {
    // Both browser processes must close on every path — success, per-photo
    // errors (caught above), or a fatal error that broke out of the loop.
    // Each close is independent so one failing doesn't strand the other.
    try {
      await downscaler.close();
    } catch (closeErr) {
      console.error(`Failed to close downscaler: ${closeErr.message}`);
    }
    try {
      await dimBrowser.close();
    } catch (closeErr) {
      console.error(`Failed to close dimBrowser: ${closeErr.message}`);
    }
  }

  if (fatalError) {
    process.exitCode = 1;
    return;
  }

  const photos = saveManifest(byId);
  console.log(`\nCaptioned ${done}. Manifest holds ${photos.length}. Failures: ${failures.length}`);
  for (const f of failures) console.log(`  ${f.file}: ${f.problems.join("; ")}`);
}

// Only run when this file is executed directly (e.g. `node tools/caption-photos.mjs`
// or `npm run caption`) — not when it's imported (as tests do, to exercise `idFor`
// without spending API calls or touching the manifest).
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
