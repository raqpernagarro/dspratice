// =============================================================================
// This test writes multi-MB synthetic images through storeImportedImage — it
// must never land them in a real install's assets/uploads/. Same pattern as
// test/pptx-import-parse.test.js: NPS_DATA_DIR is pointed at a throwaway temp
// dir BEFORE the modules that read it (media-upload-service.js, via
// product/infrastructure/user-data.js) are imported, so every write this file
// makes is confined to that temp dir and removed after.
// =============================================================================
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

let UPLOADS_DIR, storeImportedImage, isSharpAvailable;
let dataDir;

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "nps-media-import-"));
  process.env.NPS_DATA_DIR = dataDir;
  ({ UPLOADS_DIR } = await import("../product/infrastructure/user-data.js"));
  ({ storeImportedImage, isSharpAvailable } = await import("../product/domain/media-upload-service.js"));
});

after(() => rmSync(dataDir, { recursive: true, force: true }));

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

// Recompression tests — skip if sharp is unavailable. Checked independently
// of the before() hook above (a plain `import("sharp")` probe, same test
// sharp itself uses to detect availability) so this stays a synchronous,
// test-registration-time value — test() options are read before any hook
// runs, so they cannot depend on isSharpAvailable() from the dynamically
// imported media-upload-service.
const sharpAvailable = await import("sharp").then(() => true).catch(() => false);
void isSharpAvailable; // imported dynamically in before() for API parity; unused here

test("an oversized image is downscaled to 1920px", { skip: !sharpAvailable }, async () => {
  const sharp = (await import("sharp")).default;
  // Create a 2500x1000 image with a simple pattern that compresses well
  // (so it stays as PNG and isn't converted to JPEG for size)
  const width = 2500;
  const height = 1000;
  const channels = 3;
  const pixels = Buffer.alloc(width * height * channels);
  // Fill with a simple gradient pattern that compresses well
  for (let i = 0; i < pixels.length; i += 3) {
    const val = Math.floor((i / 3) / (width * height) * 255);
    pixels[i] = val;     // R
    pixels[i + 1] = val; // G
    pixels[i + 2] = val; // B
  }
  const big = await sharp(pixels, { raw: { width, height, channels } }).png().toBuffer();

  const stored = await storeImportedImage(big);
  assert.ok(stored, "oversized png must be stored");

  // Read back and check metadata
  const filename = stored.path.split("/").pop();
  const storedBytes = await readFile(join(UPLOADS_DIR, filename));
  const meta = await sharp(storedBytes).metadata();
  assert.ok(meta.width <= 1920, `downscaled width (${meta.width}) should be ≤ 1920px`);
});

test("a heavy opaque PNG is converted to JPEG", { skip: !sharpAvailable }, async () => {
  const sharp = (await import("sharp")).default;
  // Create a 1500x1500 opaque image with random pixels (>2MB as PNG)
  const width = 1500;
  const height = 1500;
  const channels = 3; // RGB, no alpha = opaque
  const randomPixels = Buffer.alloc(width * height * channels);
  for (let i = 0; i < randomPixels.length; i++) {
    randomPixels[i] = Math.floor(Math.random() * 256);
  }
  const heavyPng = await sharp(randomPixels, { raw: { width, height, channels } }).png().toBuffer();

  assert.ok(heavyPng.length > 2 * 1024 * 1024, `test image should be >2MB (got ${heavyPng.length})`);

  const stored = await storeImportedImage(heavyPng);
  assert.ok(stored, "heavy png must be stored");
  assert.equal(stored.mime, "image/jpeg", "heavy opaque PNG should be converted to JPEG");
  assert.match(stored.path, /\.jpg$/, "stored path should have .jpg extension");
});

test("an opaque PNG with a declared alpha channel is still converted to JPEG", { skip: !sharpAvailable }, async () => {
  const sharp = (await import("sharp")).default;
  // 1500x1500 RGBA, random RGB, alpha always 255 (fully opaque despite the
  // declared alpha channel) — this is what real screenshots look like.
  const width = 1500;
  const height = 1500;
  const channels = 4;
  const pixels = Buffer.alloc(width * height * channels);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = Math.floor(Math.random() * 256);
    pixels[i + 1] = Math.floor(Math.random() * 256);
    pixels[i + 2] = Math.floor(Math.random() * 256);
    pixels[i + 3] = 255;
  }
  const heavyOpaqueAlphaPng = await sharp(pixels, { raw: { width, height, channels } }).png().toBuffer();

  assert.ok(heavyOpaqueAlphaPng.length > 2 * 1024 * 1024, `test image should be >2MB (got ${heavyOpaqueAlphaPng.length})`);

  const meta = await sharp(heavyOpaqueAlphaPng).metadata();
  assert.ok(meta.hasAlpha, "test image must declare an alpha channel");

  const stored = await storeImportedImage(heavyOpaqueAlphaPng);
  assert.ok(stored, "heavy opaque-alpha png must be stored");
  assert.equal(stored.mime, "image/jpeg", "opaque PNG with declared alpha should still be converted to JPEG");
  assert.match(stored.path, /\.jpg$/, "stored path should have .jpg extension");
});

test("a PNG with genuinely transparent pixels stays a PNG", { skip: !sharpAvailable }, async () => {
  const sharp = (await import("sharp")).default;
  // 1500x1500 RGBA, random RGB, alpha genuinely varies (some pixels < 255).
  const width = 1500;
  const height = 1500;
  const channels = 4;
  const pixels = Buffer.alloc(width * height * channels);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = Math.floor(Math.random() * 256);
    pixels[i + 1] = Math.floor(Math.random() * 256);
    pixels[i + 2] = Math.floor(Math.random() * 256);
    pixels[i + 3] = Math.floor(Math.random() * 255); // 0-254, never fully opaque
  }
  const heavyTransparentPng = await sharp(pixels, { raw: { width, height, channels } }).png().toBuffer();

  assert.ok(heavyTransparentPng.length > 2 * 1024 * 1024, `test image should be >2MB (got ${heavyTransparentPng.length})`);

  const stored = await storeImportedImage(heavyTransparentPng);
  assert.ok(stored, "heavy transparent png must be stored");
  assert.equal(stored.mime, "image/png", "genuinely transparent PNG should remain a PNG");
  assert.match(stored.path, /\.png$/, "stored path should have .png extension");
});

test("deduplication holds for transformed images", { skip: !sharpAvailable }, async () => {
  const sharp = (await import("sharp")).default;
  // Create a 2500x1000 oversized image
  const width = 2500;
  const height = 1000;
  const channels = 3;
  const randomPixels = Buffer.alloc(width * height * channels);
  for (let i = 0; i < randomPixels.length; i++) {
    randomPixels[i] = Math.floor(Math.random() * 256);
  }
  const big = await sharp(randomPixels, { raw: { width, height, channels } }).png().toBuffer();

  const first = await storeImportedImage(big);
  const second = await storeImportedImage(big);
  assert.equal(first.path, second.path, "same input should yield same stored path");
});

test("a stale heavy PNG stored before recompression existed is fixed on re-import", { skip: !sharpAvailable }, async () => {
  // Simulate the pre-recompression era: a >2MB opaque PNG was written to the
  // uploads dir verbatim, under the same dedupe name storeImportedImage would
  // compute today (sha256-prefix-40 of the ORIGINAL bytes + ".png"). Reimporting
  // that same source image must not just hand back the stale oversized file —
  // it must recompress it now that sharp is available.
  const width = 1500;
  const height = 1500;
  const channels = 3; // opaque
  const randomPixels = Buffer.alloc(width * height * channels);
  for (let i = 0; i < randomPixels.length; i++) {
    randomPixels[i] = Math.floor(Math.random() * 256);
  }
  const sharp = (await import("sharp")).default;
  const original = await sharp(randomPixels, { raw: { width, height, channels } }).png().toBuffer();
  assert.ok(original.length > 2 * 1024 * 1024, `test image should be >2MB (got ${original.length})`);

  const hash = createHash("sha256").update(original).digest("hex").slice(0, 40);
  await mkdir(UPLOADS_DIR, { recursive: true });
  const stalePath = join(UPLOADS_DIR, `${hash}.png`);
  await writeFile(stalePath, original); // stale: full-size, never recompressed

  const stored = await storeImportedImage(original);
  assert.ok(stored, "must still return a stored image");
  assert.equal(stored.mime, "image/jpeg", "stale heavy opaque PNG should be recompressed to JPEG on re-import");
  assert.match(stored.path, /\.jpg$/, "stored path should now have a .jpg extension");
  assert.equal(existsSync(stalePath), false, "the stale oversized .png must be removed");
});
