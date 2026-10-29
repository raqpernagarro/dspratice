# PPTX Import Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Imported .pptx decks up to 200 MB preserve their content, images, and structural intent — the LLM edits and maps onto brand templates, it does not rewrite.

**Architecture:** Extend the existing single pipeline (`import → Generation record → composeSlides`). The parser (`pptx-import-service.js`) gains image/table/group extraction and a per-slide element inventory; a new provider method `composeImportDeck` does a combined choose+fill pass with full content and may split dense slides; `composeSlides` branches on `origin: "import"` and feeds source images into the existing photo-substitution machinery. Spec: `docs/superpowers/specs/2026-08-08-pptx-import-fidelity-design.md`.

**Tech Stack:** Node 20+ ES modules, Express, JSZip, `sharp` (new dependency), `node --test`, Claude CLI provider.

## Global Constraints

- **Restart `npm start` after any change under `product/domain/`** — Node caches modules; `GET /api/meta` must report the current HEAD before trusting any generation result (CLAUDE.md gotcha).
- The Claude CLI prompt hard cap is `MAX_PROMPT_CHARS = 32_000` (`product/infrastructure/ai/claude-cli-provider.js:809`). No prompt may be built that can exceed it; import batches use a 26 000-char budget.
- Templates come ONLY from the registry (`js/templates/index.js`). No new templates, no generic layouts.
- Prompt-generation mode behavior must not change (except one added `console.warn` in an existing silent catch).
- All tests run with `node --test test/*.test.js` (`npm test`).
- Copy rule for the import prompt: preserve every content point, light polish only, splitting allowed (max 3 output slides per source slide), never invent or reinterpret.
- `imageSource` values are exactly `"source" | "brand"`, default `"source"`.

---

### Task 1: Raise upload limit to 200 MB + client-side pre-check

**Files:**
- Modify: `product/application/routes/presentations.js:92`
- Modify: `product/ui/home.js:229-238`
- Modify: `product/ui/presentations.js:94-96`
- Test: `test/import-limit.test.js` (new)

**Interfaces:**
- Produces: import route accepts bodies to 200 MB; both UIs reject larger files before upload with the message `This file is <N> MB — the limit is 200 MB.`

- [ ] **Step 1: Write the failing test**

The repo already asserts source-level invariants this way (`test/prompt-budget.test.js` reads `MAX_PROMPT_CHARS` out of the provider source). Same pattern:

```js
// test/import-limit.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the import route accepts uploads to 200mb", async () => {
  const src = await readFile("product/application/routes/presentations.js", "utf8");
  const limit = src.match(/post\("\/import",\s*raw\(\{[^}]*limit:\s*"([^"]+)"/)?.[1];
  assert.equal(limit, "200mb");
});

test("both upload UIs pre-check the file size before posting", async () => {
  for (const path of ["product/ui/home.js", "product/ui/presentations.js"]) {
    const src = await readFile(path, "utf8");
    assert.match(src, /MAX_IMPORT_BYTES/, `${path} must gate on MAX_IMPORT_BYTES`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/import-limit.test.js`
Expected: FAIL — limit is `"30mb"`, and neither UI file mentions `MAX_IMPORT_BYTES`.

- [ ] **Step 3: Implement**

`product/application/routes/presentations.js:92` — change the one string:

```js
presentationsRouter.post("/import", raw({ type: "application/octet-stream", limit: "200mb" }), async (req, res) => {
```

Also update the stale comment at `product/domain/pptx-import-service.js:213` ("the 30 MB route limit" → "the 200 MB route limit").

`product/ui/home.js` — in the `uploadInput` change handler (line 229), reject oversized files before staging:

```js
const MAX_IMPORT_BYTES = 200 * 1024 * 1024;

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    showError(`This file is ${Math.round(file.size / 1024 / 1024)} MB — the limit is 200 MB.`);
    return;
  }
  attachedFile = file;
  // ... rest unchanged
```

(`MAX_IMPORT_BYTES` goes at module scope near the other top-level constants; `showError` already exists in home.js.)

`product/ui/presentations.js` — same gate at the top of the `uploadPptxInput` change handler (line 94):

```js
const MAX_IMPORT_BYTES = 200 * 1024 * 1024;
// inside the change handler, right after `if (!file) return;`:
if (file.size > MAX_IMPORT_BYTES) {
  showImportToast(`This file is ${Math.round(file.size / 1024 / 1024)} MB — the limit is 200 MB.`, "error");
  return;
}
```

- [ ] **Step 4: Run tests**

Run: `node --test test/import-limit.test.js` → PASS. Then `npm test` → no regressions.

- [ ] **Step 5: Commit**

```bash
git add product/application/routes/presentations.js product/domain/pptx-import-service.js product/ui/home.js product/ui/presentations.js test/import-limit.test.js
git commit -m "feat: raise pptx import limit to 200MB with client-side pre-check"
```

---

### Task 2: Imported-image storage (dedupe + sharp recompression)

**Files:**
- Modify: `product/domain/media-upload-service.js`
- Modify: `package.json` (add `sharp`)
- Test: `test/media-import-store.test.js` (new)

**Interfaces:**
- Produces: `storeImportedImage(buffer) → Promise<{path: string, mime: string} | null>` exported from `media-upload-service.js`. `null` means unsupported format (EMF/WMF/etc.) — callers skip, never throw. Paths are `assets/uploads/<sha256-prefix>.<ext>`, deterministic per source buffer (dedupe for free). Also exports `isSharpAvailable() → Promise<boolean>` so the parser can emit one warning when recompression is off.

- [ ] **Step 1: Install sharp**

```bash
npm install sharp
```

- [ ] **Step 2: Write the failing test**

```js
// test/media-import-store.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { storeImportedImage } from "../product/domain/media-upload-service.js";

// Smallest valid 1x1 transparent PNG.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

test("stores a png and returns an assets/uploads path", async () => {
  const stored = await storeImportedImage(PNG_1PX);
  assert.ok(stored, "png must be accepted");
  assert.match(stored.path, /^assets\/uploads\/[0-9a-f]{40}\.(png|jpg)$/);
});

test("the same buffer stores to the same path (dedupe)", async () => {
  const a = await storeImportedImage(PNG_1PX);
  const b = await storeImportedImage(PNG_1PX);
  assert.equal(a.path, b.path);
});

test("an unsupported format returns null, not an error", async () => {
  const emfish = Buffer.from("0100000058000000", "hex"); // not a sniffable raster
  assert.equal(await storeImportedImage(emfish), null);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/media-import-store.test.js`
Expected: FAIL — `storeImportedImage` is not exported.

- [ ] **Step 4: Implement**

In `product/domain/media-upload-service.js`, add imports and the new function (below the existing `mediaUploadService`):

```js
import { createHash } from "node:crypto";   // add to existing node:crypto import line
import { access } from "node:fs/promises";  // add to existing node:fs/promises import line

/* sharp is a native module; a machine where its install failed must still be
 * able to import — the deck just keeps its original image bytes. Loaded
 * lazily so a broken install costs nothing until an import happens. */
let sharpPromise;
function loadSharp() {
  if (!sharpPromise) {
    sharpPromise = import("sharp").then((m) => m.default).catch(() => null);
  }
  return sharpPromise;
}

export async function isSharpAvailable() {
  return (await loadSharp()) !== null;
}

const MAX_IMPORT_IMAGE_PX = 1920;
const HEAVY_PNG_BYTES = 2 * 1024 * 1024;

/**
 * Stores one image extracted from an imported .pptx.
 *
 * Deterministic name from the ORIGINAL bytes' sha256, so the same source image
 * — reused across slides, or the deck re-imported — is stored exactly once.
 * Oversized images are downscaled to 1920px wide and heavy opaque PNGs
 * re-encoded as JPEG (decks carry 5-7MB full-res screenshots); when sharp is
 * unavailable the original bytes are stored as-is.
 *
 * @returns {Promise<{path: string, mime: string} | null>} null = unsupported
 *          format (EMF/WMF/TIFF…) — the caller skips this image.
 */
export async function storeImportedImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  const detected = detectImageType(buffer);
  if (!detected) return null;

  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 40);
  await mkdir(UPLOADS_DIR, { recursive: true });

  // Already stored under any extension a previous transform chose?
  for (const ext of ["jpg", "png", "gif", "webp"]) {
    const existing = join(UPLOADS_DIR, `${hash}.${ext}`);
    try {
      await access(existing);
      return { path: `${REPO_RELATIVE_PREFIX}/${hash}.${ext}`, mime: `image/${ext === "jpg" ? "jpeg" : ext}` };
    } catch { /* not stored yet */ }
  }

  let out = buffer;
  let { ext, mime } = detected;
  const sharp = await loadSharp();
  if (sharp && (ext === "png" || ext === "jpg" || ext === "webp")) {
    try {
      const meta = await sharp(buffer).metadata();
      const needsResize = (meta.width || 0) > MAX_IMPORT_IMAGE_PX;
      const heavyPng = ext === "png" && buffer.length > HEAVY_PNG_BYTES;
      if (needsResize || heavyPng) {
        const pipeline = sharp(buffer).resize({ width: MAX_IMPORT_IMAGE_PX, withoutEnlargement: true });
        if (heavyPng && !meta.hasAlpha) {
          out = await pipeline.jpeg({ quality: 85 }).toBuffer();
          ext = "jpg"; mime = "image/jpeg";
        } else if (ext === "png") {
          out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
        } else {
          out = await pipeline.toBuffer();
        }
      }
    } catch { /* a corrupt-but-sniffable image keeps its original bytes */ }
  }

  const filename = `${hash}.${ext}`;
  await writeFile(join(UPLOADS_DIR, filename), out);
  return { path: `${REPO_RELATIVE_PREFIX}/${filename}`, mime };
}
```

- [ ] **Step 5: Run tests**

Run: `node --test test/media-import-store.test.js` → PASS. `npm test` → no regressions.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json product/domain/media-upload-service.js test/media-import-store.test.js
git commit -m "feat: content-hashed storage with sharp recompression for imported images"
```

---

### Task 3: Parser — images, tables, charts, element inventory

**Files:**
- Modify: `product/domain/pptx-import-service.js`
- Modify: `product/domain/generation-service.js:194-223` (`updateOutline`)
- Create: `test/helpers/fixture-pptx.js`
- Test: `test/pptx-import-parse.test.js` (new)

**Interfaces:**
- Consumes: `storeImportedImage`, `isSharpAvailable` (Task 2).
- Produces: each `proposedMapping` slide becomes
  `{ slideNumber, title, content: { title, body, notes, images: string[], tables: string[][][] }, elements: { images: number, tables: number, charts: number, bullets: number } }`
  where `images` holds stored `assets/uploads/...` paths in slide order and each table is `rows → cells` of plain text. `importPptx` also gains a `parseWarnings: string[]` merged into the record's `output.warnings` (surfaced later by compose). `updateOutline` preserves `images`/`tables`/`elements` from the SERVER's own record (never from the client).

- [ ] **Step 1: Write the fixture builder**

```js
// test/helpers/fixture-pptx.js
// Builds a minimal-but-valid .pptx in memory: 2 slides; slide 1 has a title,
// a picture, a 2x2 table, and a grouped shape with text; slide 2 is plain.
import JSZip from "jszip";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const para = (text) => `<a:p><a:r><a:t>${text}</a:t></a:r></a:p>`;
const sp = (phType, text) =>
  `<p:sp><p:nvSpPr><p:nvPr>${phType ? `<p:ph type="${phType}"/>` : ""}</p:nvPr></p:nvSpPr>` +
  `<p:txBody>${para(text)}</p:txBody></p:sp>`;

const SLIDE1 = `<p:sld xmlns:p="p" xmlns:a="a" xmlns:r="r"><p:cSld><p:spTree>
${sp("title", "Deck title")}
${sp(null, "First bullet")}
<p:grpSp>${sp(null, "Grouped text")}</p:grpSp>
<p:pic><p:blipFill><a:blip r:embed="rId2"/></p:blipFill>
  <p:spPr><a:xfrm><a:ext cx="9144000" cy="5144000"/></a:xfrm></p:spPr></p:pic>
<p:graphicFrame><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
<a:tbl><a:tr><a:tc><a:txBody>${para("H1")}</a:txBody></a:tc><a:tc><a:txBody>${para("H2")}</a:txBody></a:tc></a:tr>
<a:tr><a:tc><a:txBody>${para("C1")}</a:txBody></a:tc><a:tc><a:txBody>${para("C2")}</a:txBody></a:tc></a:tr>
</a:tbl></a:graphicData></a:graphic></p:graphicFrame>
</p:spTree></p:cSld></p:sld>`;

const SLIDE2 = `<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree>
${sp("title", "Second slide")}${sp(null, "Only text here")}
</p:spTree></p:cSld></p:sld>`;

export async function buildFixturePptx() {
  const zip = new JSZip();
  zip.file("ppt/presentation.xml",
    `<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst>` +
    `<p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst></p:presentation>`);
  zip.file("ppt/_rels/presentation.xml.rels",
    `<Relationships><Relationship Id="rId1" Type="http://schemas/slide" Target="slides/slide1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas/slide" Target="slides/slide2.xml"/></Relationships>`);
  zip.file("ppt/slides/slide1.xml", SLIDE1);
  zip.file("ppt/slides/slide2.xml", SLIDE2);
  zip.file("ppt/slides/_rels/slide1.xml.rels",
    `<Relationships><Relationship Id="rId2" Type="http://schemas/image" Target="../media/image1.png"/></Relationships>`);
  zip.file("ppt/media/image1.png", PNG_1PX);
  return zip.generateAsync({ type: "nodebuffer" });
}
```

- [ ] **Step 2: Write the failing test**

```js
// test/pptx-import-parse.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { buildFixturePptx } from "./helpers/fixture-pptx.js";
import { pptxImportService } from "../product/domain/pptx-import-service.js";

const context = { userId: "u-test", workspaceId: "w-test", role: "editor" };

test("parser extracts images, tables, grouped text, and an element inventory", async () => {
  const buffer = await buildFixturePptx();
  const record = await pptxImportService.importPptx(context, { buffer, filename: "fixture.pptx" });
  const [s1, s2] = record.proposedMapping;

  assert.equal(s1.elements.images, 1);
  assert.equal(s1.elements.tables, 1);
  assert.equal(s1.content.images.length, 1);
  assert.match(s1.content.images[0], /^assets\/uploads\//);
  assert.deepEqual(s1.content.tables[0], [["H1", "H2"], ["C1", "C2"]]);
  assert.ok(
    [s1.content.body].flat().some((b) => String(b).includes("Grouped text")),
    "text inside <p:grpSp> must not be lost"
  );
  assert.equal(s2.elements.images, 0);
  assert.equal(s2.content.tables.length, 0);
});
```

Caution: `importPptx` inserts a real Generation record via `generationRepository` and stores images via `storeImportedImage`. Before running, check how existing tests isolate storage (look for an env override in `product/storage/generation-repository.js` and `product/infrastructure/user-data.js` — `OVERRIDE`/user-data dir). If a test-data override env var exists, set it in the test file's first lines (`process.env.<VAR> = "<scratch dir>"` before the imports that read it); if none exists, add the smallest possible one to `user-data.js`/the repository rather than letting tests write into the real `product/data`.

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/pptx-import-parse.test.js`
Expected: FAIL — `elements` is undefined on the mapping slides.

Note: if the "Grouped text" assertion already passes (the existing `<p:sp>` regex matches shapes nested inside `<p:grpSp>` too), keep the assertion as a regression guard and skip writing new group-handling code — do not add code the test doesn't demand.

- [ ] **Step 4: Implement in `pptx-import-service.js`**

Add imports at the top:

```js
import { storeImportedImage, isSharpAvailable } from "./media-upload-service.js";
```

Add extraction helpers (near the other parse helpers):

```js
/** Tables on a slide → array of tables, each rows × cells of plain text. */
function extractTables(slideXml) {
  const tables = [];
  for (const tbl of slideXml.match(/<a:tbl>[\s\S]*?<\/a:tbl>/g) || []) {
    const rows = [];
    for (const tr of tbl.match(/<a:tr\b[\s\S]*?<\/a:tr>/g) || []) {
      const cells = (tr.match(/<a:tc\b[\s\S]*?<\/a:tc>/g) || [])
        .map((tc) => extractParagraphs(tc).join(" "));
      if (cells.some((c) => c.trim())) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

function countCharts(slideXml) {
  return (slideXml.match(/<a:graphicData[^>]*uri="[^"]*\/chart"/g) || []).length;
}

/** The r:embed ids of every picture on a slide, in document order. */
function extractImageRefs(slideXml) {
  const refs = [];
  for (const pic of slideXml.match(/<p:pic>[\s\S]*?<\/p:pic>/g) || []) {
    const rId = pic.match(/<a:blip[^>]*r:embed="([^"]*)"/)?.[1];
    if (rId) refs.push(rId);
  }
  return refs;
}

/**
 * Resolves a slide's pictures to stored asset paths.
 * `mediaCache` maps a zip media path to its stored result (or null), so an
 * image reused on five slides is read and stored once per import.
 */
async function storeSlideImages(zip, slidePath, slideXml, mediaCache, warnings) {
  const slideFileName = slidePath.split("/").pop();
  const relsFile = zip.file(`ppt/slides/_rels/${slideFileName}.rels`);
  if (!relsFile) return [];
  const rels = parseRelationships(await relsFile.async("string"));

  const paths = [];
  for (const rId of extractImageRefs(slideXml)) {
    const target = rels[rId]?.target;
    if (!target) continue;
    const mediaPath = normalizePath(`ppt/slides/${target}`);
    if (!(mediaPath in mediaCache)) {
      const file = zip.file(mediaPath);
      const buffer = file ? await file.async("nodebuffer") : null;
      mediaCache[mediaPath] = buffer ? await storeImportedImage(buffer) : null;
      if (buffer && !mediaCache[mediaPath]) {
        warnings.push(`An image on this deck uses a format that can't be imported (${mediaPath.split("/").pop()}).`);
      }
    }
    if (mediaCache[mediaPath]) paths.push(mediaCache[mediaPath].path);
  }
  return paths;
}
```

In `importPptx`, extend the parse loop (lines 235-244) — collect media and tables alongside text:

```js
    const parsed = [];
    const mediaCache = {};
    const parseWarnings = [];
    if (!(await isSharpAvailable())) {
      parseWarnings.push("Image recompression is unavailable on this machine — imported images are stored at original size.");
    }
    for (let i = 0; i < slidePaths.length; i++) {
      const file = zip.file(`ppt/${slidePaths[i]}`);
      if (!file) continue;
      const slideXml = await file.async("string");
      parsed.push({
        index: i,
        ...parseSlideXml(slideXml),
        notes: await getNotesForSlide(zip, slidePaths[i]),
        images: await storeSlideImages(zip, slidePaths[i], slideXml, mediaCache, parseWarnings),
        tables: extractTables(slideXml),
        charts: countCharts(slideXml),
      });
    }
```

And extend the mapping build (lines 260-268):

```js
      proposedMapping.push({
        slideNumber: slide.index + 1,
        title: resolvedTitle,
        content: {
          title: resolvedTitle,
          body: slide.index === 0 ? (strip(slide.subtitle) ? slide.subtitle : "") || bullets[0] || "" : bullets,
          notes: slide.notes,
          images: slide.images,
          tables: slide.tables,
        },
        elements: {
          images: slide.images.length,
          tables: slide.tables.length,
          charts: slide.charts,
          bullets: bullets.length,
        },
      });
```

Carry the warnings on the record (final `updateStatus` call):

```js
    return generationRepository.updateStatus(record.id, {
      status: "completed",
      proposedMapping,
      output: { title, slides: proposedMapping, warnings: parseWarnings },
    });
```

- [ ] **Step 5: Preserve the new fields through `updateOutline`**

`product/domain/generation-service.js:206-215` rebuilds each slide from the client's values, which would strip `images`/`tables`/`elements`. Merge them back from the record's own mapping (the server's data, never the client's — a client-supplied path would otherwise become an `img src`):

```js
    const cleaned = proposedMapping.map((slide, i) => {
      const body = Array.isArray(slide?.content?.body)
        ? slide.content.body.map((b) => String(b ?? "")).filter((b) => b.trim())
        : slide?.content?.body ? [String(slide.content.body)] : [];
      /* Imported media and structure survive an outline edit, but only from
       * the record's own mapping — a client-sent image path is never trusted. */
      const own = record.proposedMapping?.[i] || {};
      return {
        slideNumber: i + 1,
        title: String(slide?.title ?? "").slice(0, 300),
        content: {
          body,
          notes: String(slide?.content?.notes ?? ""),
          ...(own.content?.images?.length ? { images: own.content.images } : {}),
          ...(own.content?.tables?.length ? { tables: own.content.tables } : {}),
        },
        ...(own.elements ? { elements: own.elements } : {}),
      };
    }).filter((s) => s.title.trim() || s.content.body.length);
```

- [ ] **Step 6: Run tests**

Run: `node --test test/pptx-import-parse.test.js` → PASS. `npm test` → no regressions.

- [ ] **Step 7: Commit**

```bash
git add product/domain/pptx-import-service.js product/domain/generation-service.js test/helpers/fixture-pptx.js test/pptx-import-parse.test.js
git commit -m "feat: extract images, tables, and element inventory from imported pptx"
```

---

### Task 4: Provider — `composeImportDeck` (combined choose+fill, batched, no silent failure)

**Files:**
- Modify: `product/infrastructure/ai/claude-cli-provider.js`
- Test: `test/import-compose-prompt.test.js` (new)

**Interfaces:**
- Consumes: `runClaude`, `readEnvelope`, `sizeGuidance`, `MAX_PROMPT_CHARS`, `COMPOSE_TIMEOUT_MS`, `clampText` is NOT here (it lives in generation-service) — truncation uses plain slicing at a word boundary, code below.
- Produces: `composeImportDeck({ title, outline, shortlists, templates }) → Promise<{ rows: Array<{source: number, templateName: string, theme: "light"|"dark", content: object}>, warnings: string[] }>` where `source` is the 1-based source-slide number, rows are in deck order, and at most 3 rows share one `source`. `outline` slides here are `{ title, bullets, tables, notes, elements }`. Exports `buildImportComposePrompt` for the budget test.

- [ ] **Step 1: Write the failing test**

```js
// test/import-compose-prompt.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildImportComposePrompt } from "../product/infrastructure/ai/claude-cli-provider.js";

const slide = (i, bulletLen = 120) => ({
  index: i,
  slide: {
    title: `Slide ${i + 1}`,
    bullets: Array.from({ length: 6 }, (_, b) => `Point ${b} — ${"x".repeat(bulletLen)}`),
    tables: [[["A", "B"], ["1", "2"]]],
    notes: "Speaker notes here.",
    elements: { images: 1, tables: 1, charts: 0, bullets: 6 },
  },
  candidates: Array.from({ length: 6 }, (_, c) => ({
    name: `core/fake-${c}`, role: "content", shape: "grid", media: "",
    capacity: { items: 4 }, darkSafe: true, why: [],
    schema: { title: "string", items: "array of 4 strings" },
    example: { title: "Example", items: ["a", "b", "c", "d"] },
  })),
});

test("import prompt carries full content — no 260-char clipping", () => {
  const prompt = buildImportComposePrompt({ title: "Deck", slides: [slide(0)] });
  assert.match(prompt, /Point 5/);
  assert.match(prompt, /A \| B/);          // table rendered
  assert.match(prompt, /never invent/i);   // the fidelity contract is stated
  assert.match(prompt, /split/i);          // splitting is offered
});

test("a 4-slide import batch stays under the CLI cap", async () => {
  const src = await readFile("product/infrastructure/ai/claude-cli-provider.js", "utf8");
  const cap = Number(src.match(/MAX_PROMPT_CHARS\s*=\s*([\d_]+)/)[1].replace(/_/g, ""));
  const prompt = buildImportComposePrompt({ title: "Deck", slides: [0, 1, 2, 3].map((i) => slide(i)) });
  assert.ok(prompt.length < cap, `prompt is ${prompt.length}, cap ${cap}`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/import-compose-prompt.test.js`
Expected: FAIL — `buildImportComposePrompt` is not exported.

- [ ] **Step 3: Implement the prompt + schema**

In `claude-cli-provider.js`, near the other compose prompts:

```js
const IMPORT_COMPOSE_SCHEMA = {
  type: "object",
  required: ["slides"],
  properties: {
    slides: {
      type: "array",
      items: {
        type: "object",
        required: ["source", "templateName", "content"],
        properties: {
          source: { type: "integer" },
          templateName: { type: "string" },
          theme: { type: "string", enum: ["light", "dark"] },
          content: { type: "object" },
        },
      },
    },
  },
};

function renderTable(rows) {
  return rows.map((cells) => cells.join(" | ")).join(" // ");
}

/* Import composition — one combined pass: the model sees a source slide's FULL
 * content and chooses a template AND maps the content onto it in the same
 * breath. Import is transplantation, not authorship: choosing a layout apart
 * from the content it must hold is how content got rewritten to fit. */
export function buildImportComposePrompt({ title, slides, alreadyChosen = [] }) {
  const blocks = slides.map(({ index, slide, candidates }) => {
    const bullets = Array.isArray(slide.bullets) ? slide.bullets : slide.bullets ? [slide.bullets] : [];
    const el = slide.elements || {};
    const structure = [
      el.images ? `${el.images} image(s) — already handled, do not describe them` : "",
      el.tables ? `${el.tables} table(s)` : "",
      el.charts ? `${el.charts} chart(s), available only as text` : "",
    ].filter(Boolean).join(", ");
    return [
      `--- source slide ${index + 1}: ${String(slide.title || "").replace(/\s+/g, " ")}`,
      ...bullets.map((b) => `    • ${String(b).replace(/\s+/g, " ")}`),
      ...(slide.tables || []).map((t) => `    table: ${renderTable(t)}`),
      structure ? `    structure: ${structure}` : "",
      "    candidates:",
      ...candidates.map((c) => [
        `      ${c.name} [${c.role}|${c.shape}|holds ${c.capacity?.items ?? "?"}${c.darkSafe ? "" : "|no-dark"}]`,
        `        fields: ${JSON.stringify(c.schema || {})}`,
        `        shape to copy: ${JSON.stringify(c.example || {})}`,
      ].join("\n")),
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  return [
    `You are transplanting an existing presentation ("${title}") onto a brand`,
    "template library, slide by slide. This deck was written by its author —",
    "your job is layout and fidelity, not authorship.",
    "",
    blocks,
    "",
    alreadyChosen.length
      ? `Templates already used earlier in this deck — avoid repeating them unless nothing else fits:\n  ${[...new Set(alreadyChosen)].join(", ")}\n`
      : "",
    "For each source slide return one or more output slides:",
    "- Choose templates ONLY from that slide's own candidate list, by exact name.",
    "- Transplant the author's content. Light polish is allowed — fix grammar,",
    "  tighten a phrase — but never add a point, drop a point, or reinterpret",
    "  what the author said. Never invent content.",
    "- When the content genuinely exceeds what one candidate holds, SPLIT it",
    "  across up to 3 output slides (same source number, consecutive entries,",
    "  each with its own template choice). Prefer splitting over cutting.",
    "- A table maps onto a table/comparison candidate with its cells verbatim.",
    "- Match each candidate's example shape EXACTLY: same keys, same types.",
    "  Return every declared field. Omit `meta` and `footer` entirely.",
    "- Never invent an image, photo or logo path. Where the example has one,",
    "  repeat its value exactly — the real images are placed by the system.",
    '- Theme: "dark" only for a single strong assertion; everything else "light".',
    "- NEVER the same template on two consecutive output slides.",
    "",
    "Respond with JSON only, in deck order:",
    '{"slides": [{"source": number, "templateName": string, "theme": "light"|"dark", "content": {}}]}',
  ].filter(Boolean).join("\n");
}
```

- [ ] **Step 4: Implement `composeImportDeck` on the class**

Add to `ClaudeCliProvider` (next to `composeDeck`):

```js
  /**
   * Import composition: combined choose+fill over FULL source content.
   * Never throws for a batch — failures land in `warnings` and the affected
   * source slides simply have no rows, so the caller keeps their plain
   * mapping. See composeDeck for the batching rationale; the budget is lower
   * because candidate examples travel in the prompt.
   *
   * @returns {Promise<{rows: Array<{source, templateName, theme, content}>, warnings: string[]}>}
   */
  async composeImportDeck({ title, outline = [], shortlists = [] } = {}) {
    if (!outline.length) return { rows: [], warnings: [] };
    const warnings = [];
    const IMPORT_BUDGET = 26_000;

    /** A slide so large it alone busts the budget gets its bullets shortened
     * for the PROMPT only — the stored mapping keeps the full text — and says
     * so out loud instead of silently vanishing. */
    const shrink = (row) => {
      const bullets = (row.slide.bullets || []).map((b) => {
        const s = String(b);
        if (s.length <= 400) return s;
        const cut = s.slice(0, 400);
        return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 300))}…`;
      });
      warnings.push(`Slide ${row.index + 1} is very long — its text was shortened for layout selection.`);
      return { ...row, slide: { ...row.slide, bullets } };
    };

    const rows = outline.map((slide, index) => ({ index, slide, candidates: shortlists[index] || [] }));
    const batches = [];
    let pending = [];
    for (let row of rows) {
      if (buildImportComposePrompt({ title, slides: [row] }).length > IMPORT_BUDGET) row = shrink(row);
      const next = [...pending, row];
      if (pending.length && buildImportComposePrompt({ title, slides: next }).length > IMPORT_BUDGET) {
        batches.push(pending);
        pending = [row];
      } else {
        pending = next;
      }
    }
    if (pending.length) batches.push(pending);

    const out = [];
    const chosenSoFar = [];
    for (const group of batches) {
      let parsed;
      try {
        parsed = readEnvelope(await runClaude(
          buildImportComposePrompt({ title, slides: group, alreadyChosen: chosenSoFar }),
          IMPORT_COMPOSE_SCHEMA,
          { timeoutMs: COMPOSE_TIMEOUT_MS }
        ));
      } catch (err) {
        const nums = group.map((r) => r.index + 1).join(", ");
        console.warn(`[compose:import] batch failed for slides ${nums}: ${err.message}`);
        warnings.push(`Slides ${nums} kept their default layout: ${err.message}`);
        continue;
      }
      const perSource = new Map();
      for (const row of Array.isArray(parsed?.slides) ? parsed.slides : []) {
        const source = Number.isInteger(row?.source) ? row.source : NaN;
        const inBatch = group.find((r) => r.index === source - 1);
        const allowed = inBatch?.candidates?.some((c) => c.name === row?.templateName);
        const count = perSource.get(source) || 0;
        if (!inBatch || !allowed || count >= 3 || !row?.content || typeof row.content !== "object") continue;
        perSource.set(source, count + 1);
        out.push({
          source,
          templateName: row.templateName,
          theme: row.theme === "dark" ? "dark" : "light",
          content: row.content,
        });
        chosenSoFar.push(row.templateName);
      }
      for (const r of group) {
        if (!perSource.has(r.index + 1)) warnings.push(`Slide ${r.index + 1} kept its default layout — the engine returned nothing usable for it.`);
      }
    }
    out.sort((a, b) => a.source - b.source);
    return { rows: out, warnings };
  }
```

- [ ] **Step 5: Fix the existing silent catch (small collateral)**

`claude-cli-provider.js:1238-1239` — pass 2 of the prompt path swallows batch failures bare. Replace:

```js
      } catch {
        continue; // this batch keeps its plain mapping; the other batches stand
      }
```

with:

```js
      } catch (err) {
        // This batch keeps its plain mapping; the other batches stand — but
        // never silently: an invisible fallback here cost days once already.
        console.warn(`[compose] fill batch failed for slides ${group.map((a) => a.index + 1).join(", ")}: ${err.message}`);
        continue;
      }
```

- [ ] **Step 6: Run tests**

Run: `node --test test/import-compose-prompt.test.js` → PASS. `npm test` → no regressions (especially `test/prompt-budget.test.js`).

- [ ] **Step 7: Commit**

```bash
git add product/infrastructure/ai/claude-cli-provider.js test/import-compose-prompt.test.js
git commit -m "feat: combined choose+fill import composition with loud batch failures"
```

---

### Task 5: `composeSlides` import branch — splitting, source images, warnings

**Files:**
- Modify: `product/domain/generation-service.js`
- Test: `test/import-compose.test.js` (new)

**Interfaces:**
- Consumes: `composeImportDeck` (Task 4 shape), mapping slides with `content.images`/`content.tables`/`elements` (Task 3).
- Produces: `composeSlides(provider, proposedMapping, { title, subtitle, warnings, origin, imageSource })` — two new options. When `origin === "import"` and the provider implements `composeImportDeck`, the import branch runs; otherwise behavior is exactly today's. `#composeInBackground` passes `origin: record.origin, imageSource: record.imageSource`. Exports `composeImportedSlides` for tests.

- [ ] **Step 1: Write the failing test**

Uses a stub provider — no CLI involved:

```js
// test/import-compose.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { composeSlides } from "../product/domain/generation-service.js";
import { allTemplates } from "../js/templates/index.js";

// A real registered content template to build against.
const REAL = allTemplates.find((t) => t.name === "core/content-twocol");

const mapping = [
  { slideNumber: 1, title: "Cover", content: { title: "Cover", body: "Sub", notes: "", images: [], tables: [] },
    elements: { images: 0, tables: 0, charts: 0, bullets: 0 } },
  { slideNumber: 2, title: "Dense", content: { title: "Dense", body: ["a", "b", "c"], notes: "n",
    images: ["assets/uploads/deadbeef.png"], tables: [] },
    elements: { images: 1, tables: 0, charts: 0, bullets: 3 } },
];

function stubProvider(rows, warnings = []) {
  return { composeImportDeck: async () => ({ rows, warnings }) };
}

test("a split source slide becomes two output slides, in order", async () => {
  const rows = [
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
    { source: 2, templateName: REAL.name, theme: "light", content: { ...REAL.example } },
  ];
  const warnings = [];
  const slides = await composeSlides(stubProvider(rows), mapping,
    { title: "T", warnings, origin: "import", imageSource: "source" });
  assert.equal(slides.length, 3); // cover fallback + 2 splits of slide 2
  assert.equal(slides[0].order, 0);
  assert.equal(slides[2].order, 2);
});

test("provider warnings reach the caller's sink", async () => {
  const warnings = [];
  await composeSlides(stubProvider([], ["Slide 2 kept its default layout."]), mapping,
    { title: "T", warnings, origin: "import" });
  assert.ok(warnings.some((w) => w.includes("Slide 2")));
});

test("without origin=import the prompt path is untouched", async () => {
  const provider = { composeDeck: async () => ({ slides: [] }) };
  const slides = await composeSlides(provider, mapping, { title: "T" });
  assert.equal(slides.length, 2); // plain fallback, one per mapping slide
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/import-compose.test.js`
Expected: FAIL — `composeSlides` ignores `origin` and returns 2 fallback slides in the first test.

- [ ] **Step 3: Widen `isPhoto` and thread the options**

`generation-service.js:862-864`:

```js
/** A photograph — from the library OR extracted from an imported deck — as
 *  opposed to a logo, icon or scribble. Only photographs are chosen per
 *  slide; brand assets stay where they are. */
function isPhoto(value) {
  return /^assets\/(photography|uploads)\//i.test(String(value));
}
```

`#composeInBackground` (line 279): pass the new options:

```js
      const slides = await composeSlides(this.provider, record.proposedMapping, {
        title: record.output?.title || record.prompt,
        subtitle: record.output?.subtitle,
        warnings,
        origin: record.origin,
        imageSource: record.imageSource || "source",
      });
      if (Array.isArray(record.output?.warnings)) warnings.push(...record.output.warnings);
```

`composeSlides` signature and branch (line 368):

```js
export async function composeSlides(provider, proposedMapping, { title, subtitle, warnings, origin, imageSource } = {}) {
  const note = (message) => { if (Array.isArray(warnings)) warnings.push(message); };
  const mapping = proposedMapping || [];
  const fallback = buildSlidesFromMapping(mapping, { title });
  if (!mapping.length) return fallback;
  if (origin === "import" && typeof provider?.composeImportDeck === "function") {
    return composeImportedSlides(provider, mapping, { title, note, fallback, imageSource });
  }
  if (typeof provider?.composeDeck !== "function") return fallback;
  // ... existing prompt path unchanged from here
```

- [ ] **Step 4: Implement `composeImportedSlides`**

New exported function in `generation-service.js` (place before `buildSlidesFromMapping`). It reuses the module's existing helpers: `outlineSignatures`, `shortlistFor`, `DARK_SAFE`, `findTemplate`, `prepareContentUpdate`, `clampToCapacity`, `coerceToExample`, `keepAssetPaths`, `withSpeakerNotes`, `choosePhotos`, `deckChrome`, `themeFor`. (`clampToCapacity` and `coerceToExample` are module-scope functions in this file — check their exact names around lines 520-780 before writing, and use whatever the prompt path's `build()` at line 502 calls.)

```js
/**
 * The import twin of the prompt path below: combined choose+fill rows from
 * the provider, splitting allowed, the author's images placed before any
 * brand photograph. A source slide with no usable rows keeps its plain
 * fallback slide — degradation is per-slide and always announced.
 */
export async function composeImportedSlides(provider, mapping, { title, note, fallback, imageSource } = {}) {
  const outline = mapping.map((s) => ({
    title: s.title,
    bullets: Array.isArray(s.content?.body) ? s.content.body : s.content?.body ? [s.content.body] : [],
    tables: s.content?.tables || [],
    notes: s.content?.notes || "",
    elements: s.elements || {},
  }));

  /* Signatures see the source's structure, not just its text: a slide that
   * carried an image wants a visual layout; one that carried a table wants a
   * comparison; a table's rows count as items for capacity fit. */
  const signatures = outlineSignatures(outline).map((sig, i) => {
    const el = mapping[i]?.elements || {};
    const tableRows = (mapping[i]?.content?.tables || []).reduce((n, t) => Math.max(n, t.length), 0);
    return {
      ...sig,
      wantsVisual: sig.wantsVisual || el.images > 0,
      isComparison: sig.isComparison || el.tables > 0,
      itemCount: Math.max(sig.itemCount, tableRows),
    };
  });

  const leading = new Set();
  const shortlists = signatures.map((sig) => {
    /* Six candidates, not twelve: each import candidate travels WITH its
     * schema and example (the combined pass fills content too), so the same
     * budget holds fewer, richer entries. */
    const list = shortlistFor(sig, { limit: 6, deckLength: outline.length, avoid: leading });
    if (list[0]) leading.add(list[0].name);
    return list.map((c) => {
      const t = findTemplate(c.name);
      return { ...c, darkSafe: DARK_SAFE.has(c.name), schema: t?.schema || {}, example: t?.example || {} };
    });
  });

  let result;
  try {
    result = await provider.composeImportDeck({ title, outline, shortlists });
  } catch (err) {
    console.warn(`[generation] import composition failed, using the plain mapping: ${err.message}`);
    note(`Layouts were not chosen for this deck: ${err.message}`);
    return fallback;
  }
  for (const w of result?.warnings || []) note(w);

  const bySource = new Map();
  for (const row of result?.rows || []) {
    const list = bySource.get(row.source) || [];
    if (list.length < 3) list.push(row);
    bySource.set(row.source, list);
  }

  const total = mapping.reduce((n, s) => n + Math.max(1, (bySource.get(s.slideNumber) || []).length), 0);
  const usedPhotos = new Set();
  const slides = [];

  mapping.forEach((src, i) => {
    const rows = bySource.get(src.slideNumber) || [];
    if (!rows.length) {
      const plain = { ...fallback[i], order: slides.length };
      plain.content = { ...plain.content, ...deckChrome(slides.length, { title }) };
      slides.push(plain);
      return;
    }

    /* The author's own images first; the brand library only fills slides that
     * had none (or when the user chose brand photography for the deck). */
    const ownImages = imageSource === "brand" ? [] : [...(src.content?.images || [])];
    const slideText = [src.title, ...(Array.isArray(src.content?.body) ? src.content.body : [src.content?.body])]
      .filter(Boolean).join(" ");

    for (const row of rows) {
      const template = findTemplate(row.templateName);
      if (!template) {
        note(`Slide ${src.slideNumber} kept its default layout — "${row.templateName}" is not a registered template.`);
        const plain = { ...fallback[i], order: slides.length };
        plain.content = { ...plain.content, ...deckChrome(slides.length, { title }) };
        slides.push(plain);
        continue;
      }
      const index = slides.length;
      const picks = choosePhotos({
        template, signature: signatures[i], text: slideText, used: usedPhotos,
        textSafe: template.shape === "fullbleed" || template.role === "cover",
      });
      let nextPhoto = 0;
      const takePhoto = () => {
        if (ownImages.length) return ownImages.shift();
        const chosen = picks[nextPhoto++] ?? picks[picks.length - 1] ?? null;
        if (chosen) usedPhotos.add(chosen);
        return chosen;
      };
      const chrome = deckChrome(index, { title });
      const proposed = { ...(row.content || {}) };
      for (const key of ["meta", "footer"]) {
        if (key in (template.schema || {})) proposed[key] = chrome[key];
        else delete proposed[key];
      }
      try {
        const { content } = prepareContentUpdate(
          template.name,
          template.example || {},
          clampToCapacity(template, coerceToExample(template.example || {},
            keepAssetPaths(template.example || {}, proposed, (ownImages.length || picks.length) ? takePhoto : null)))
        );
        slides.push({
          order: index,
          templateReference: { templateName: template.name, templateVersion: 1, templatePackId: "main-template" },
          themeOverride: themeFor(index, total, { templateName: template.name, theme: row.theme }),
          content: withSpeakerNotes(content, template, src.content?.notes),
        });
      } catch (err) {
        note(`Slide ${src.slideNumber} kept its default layout — its content did not fit "${template.name}".`);
        const plain = { ...fallback[i], order: index };
        plain.content = { ...plain.content, ...deckChrome(index, { title }) };
        slides.push(plain);
      }
    }
  });

  return slides;
}
```

Note on `fallback[i]` reuse when a source slide splits or shifts position: the fallback slide's `order` and chrome page number are rewritten at push time (code above), so page numbers stay sequential after splits.

- [ ] **Step 5: Run tests**

Run: `node --test test/import-compose.test.js` → PASS. `npm test` → no regressions.

- [ ] **Step 6: Restart the dev server and smoke-test**

`npm start`, confirm `GET /api/meta` reports the current commit, import `test/helpers` fixture via the library page, confirm a deck arrives.

- [ ] **Step 7: Commit**

```bash
git add product/domain/generation-service.js test/import-compose.test.js
git commit -m "feat: import compose branch — splitting, source-image placement, loud warnings"
```

---

### Task 6: `imageSource` choice — plumbing + UI

**Files:**
- Modify: `product/application/routes/presentations.js:92-107`
- Modify: `product/domain/pptx-import-service.js` (`importPptx` signature + record insert)
- Modify: `product/storage/generation-repository.js` (insert shape, ~line 91-113)
- Modify: `product/ui/lib/api.js:131-147`
- Modify: `product/ui/lib/deck-build.js:108-114`
- Modify: `product/ui/home.js` + `product/ui/home.html` (or `index.html` — wherever the attachment chip markup lives; find `attachmentChip`)
- Modify: `product/ui/presentations.js`
- Test: extend `test/pptx-import-parse.test.js`

**Interfaces:**
- Produces: `POST /api/presentations/import?filename=...&images=source|brand`; generation records carry `imageSource: "source"|"brand"` (default `"source"`); `api.importPresentation(file, { imageSource })`; `importAndWait(file, { imageSource, onProgress })`.

- [ ] **Step 1: Write the failing test**

Add to `test/pptx-import-parse.test.js`:

```js
test("imageSource is stored on the generation record, defaulting to source", async () => {
  const buffer = await buildFixturePptx();
  const a = await pptxImportService.importPptx(context, { buffer, filename: "f.pptx" });
  assert.equal(a.imageSource, "source");
  const b = await pptxImportService.importPptx(context, { buffer, filename: "f.pptx", imageSource: "brand" });
  assert.equal(b.imageSource, "brand");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/pptx-import-parse.test.js`
Expected: FAIL — `imageSource` is undefined on the record.

- [ ] **Step 3: Implement server side**

`generation-repository.js` insert shape: add one line alongside `origin`:

```js
      imageSource: spec.imageSource === "brand" ? "brand" : "source",
```

`pptx-import-service.js`: signature `async importPptx(context, { buffer, filename, imageSource })`, and the insert:

```js
    const record = await generationRepository.insert({
      workspaceId: context.workspaceId,
      userId: context.userId,
      prompt: `Imported from ${filename || "a PowerPoint file"}`,
      origin: "import",
      imageSource,
    });
```

`routes/presentations.js` import handler:

```js
  const imageSource = req.query.images === "brand" ? "brand" : "source";
  // ...
    const generation = await pptxImportService.importPptx(req.context, { buffer: req.body, filename, imageSource });
```

- [ ] **Step 4: Implement client side**

`api.js`:

```js
  importPresentation: async (file, { imageSource = "source" } = {}) => {
    // ...unchanged except the URL:
      res = await fetch(
        `${API_BASE}/api/presentations/import?filename=${encodeURIComponent(file.name)}&images=${imageSource}`,
```

`deck-build.js`:

```js
export async function importAndWait(file, { imageSource, onProgress } = {}) {
  const result = await api.importPresentation(file, { imageSource });
  // ...rest unchanged
```

`home.js` + the home page markup: inside the attachment chip (next to `attachmentName` / `attachmentRemove` — locate the chip markup by grepping for `attachmentChip` in `product/ui/*.html`), add:

```html
<label class="attachment-images-toggle">
  <input type="checkbox" id="attachment-brand-images" />
  Use brand photography instead of the file's images
</label>
```

In `home.js`, read it at submit (the checkbox element fetched at module top like the other controls):

```js
const brandImagesToggle = document.getElementById("attachment-brand-images");
// in the submit handler:
presentation = await importAndWait(attachedFile, {
  imageSource: brandImagesToggle?.checked ? "brand" : "source",
});
```

Style the label with existing utility classes/tokens from the page's stylesheet — small muted text (navy-500), no new colors; check how the chip is styled and match it.

`presentations.js`: the library page has no staging step, so present the choice inline after file pick, before upload — a native, minimal approach consistent with the page (no new modal system):

```js
  uploadPptxInput.addEventListener("change", async () => {
    const file = uploadPptxInput.files[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { /* Task 1 gate, unchanged */ }
    // The one per-deck choice worth interrupting for: whose images the deck uses.
    const useSource = window.confirm(
      "Use the images from this file?\n\nOK — keep the file's own images.\nCancel — use Nagarro brand photography instead."
    );
    uploadPptxBtn.disabled = true;
    try {
      showImportToast("Importing… laying the slides out takes a moment.", "info");
      const presentation = await importAndWait(file, { imageSource: useSource ? "source" : "brand" });
      // ...rest unchanged
```

- [ ] **Step 5: Run tests + manual check**

`npm test` → PASS. Restart `npm start`; on the home page attach a .pptx, confirm the toggle renders inside the chip and an import round-trips; on the library page confirm the dialog appears.

- [ ] **Step 6: Commit**

```bash
git add product/application/routes/presentations.js product/domain/pptx-import-service.js product/storage/generation-repository.js product/ui/lib/api.js product/ui/lib/deck-build.js product/ui/home.js product/ui/presentations.js test/pptx-import-parse.test.js
git add product/ui/*.html
git commit -m "feat: per-deck source-vs-brand image choice on import"
```

---

### Task 7: Compose warnings on the library page

**Files:**
- Modify: `product/ui/presentations.js:94-110`

**Interfaces:**
- Consumes: `presentation.composeWarnings` (already attached by `deck-build.js:81`).

- [ ] **Step 1: Implement**

In the import handler's success path, after `showImportToast(...success...)`:

```js
      const presentation = await importAndWait(file, { imageSource: useSource ? "source" : "brand" });
      showImportToast(`Imported “${presentation.title}”.`, "success");
      /* Composition can degrade without failing — same notice the home page
       * shows, so a flat imported deck is never a silent mystery here either. */
      if (presentation.composeWarnings?.length) {
        showImportToast(
          presentation.composeWarnings.length === 1
            ? presentation.composeWarnings[0]
            : `${presentation.composeWarnings.length} notes about this import. ${presentation.composeWarnings[0]}`,
          "info"
        );
      }
      fetchList({ reset: true });
```

(If `showImportToast` replaces rather than queues toasts, delay the second call: `setTimeout(() => showImportToast(...), 3500)` — check its implementation in `presentation-card.js` first.)

- [ ] **Step 2: Manual check + commit**

Restart server, import the fixture on the library page with the Claude CLI absent or a slide that degrades — confirm the notice shows.

```bash
git add product/ui/presentations.js
git commit -m "feat: surface compose warnings on the library page"
```

---

### Task 8: Acceptance — the real 70 MB deck, plus docs

**Files:**
- Modify: `docs/CHANGELOG.md`
- Modify: `CLAUDE.md` (one line in the import workflow section)

- [ ] **Step 1: Full test suite**

Run: `npm test` → all green.

- [ ] **Step 2: End-to-end with the motivating deck**

1. Restart `npm start`; verify `curl -s localhost:4600/api/meta` reports HEAD.
2. Import `/Users/hugojsfranca/Downloads/AI-Native  Technology Due Diligence for CXOs.pptx` (70 MB, 19 slides, 43 images) through the home composer with source images selected.
3. Verify: upload accepted (no 413); deck arrives; slide count ≥ 19; source images appear on slides (paths under `assets/uploads/` in `product/data/presentations.json` for the new deck); `assets/uploads/` (or the user-data override dir) holds ≤ 43 deduped files, none over ~2 MB (sharp recompressed the 5-7 MB PNGs); templates vary across the deck; every degraded slide has a matching visible warning; server log shows no bare swallowed batch.
4. Read 3-4 slides against the source deck: content transplanted, not rewritten; any split slides carry all original points.

- [ ] **Step 3: Documentation**

- `docs/CHANGELOG.md`: dated entry — 200 MB import limit; imports preserve images (deduped, recompressed), tables and grouped text; import-mode composition transplants content and may split dense slides; per-deck source-vs-brand image choice; compose warnings on the library page.
- `CLAUDE.md`: in "How to generate a deck from a reference", note that .pptx import now preserves source images and content (import compose mode), and the per-deck image-source choice.

- [ ] **Step 4: Commit**

```bash
git add docs/CHANGELOG.md CLAUDE.md
git commit -m "docs: changelog + working notes for faithful pptx import"
```
