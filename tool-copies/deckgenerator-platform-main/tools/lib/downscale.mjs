// Downscales source photos for the Claude API using the Chromium already
// installed for tools/export-pptx.mjs. Avoids a native image dependency.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const MAX_EDGE = 1568;   // well inside per-image limits; ample for captioning
const QUALITY = 0.82;
const ATTEMPTS = 3;

// Chromium intermittently fails to decode a perfectly valid source photo with
// "EncodingError: The source image cannot be decoded". It is not corruption —
// the same file decodes fine on a fresh page — it is memory pressure from
// decoding a run of 20-30 MP images in one renderer. Retrying on a blank page
// clears the decoded-image cache and succeeds.
//
// This must be handled here rather than by the callers: a caption run walks
// 209 photos through one page, so without the retry a mid-run failure looks
// like a broken file, and merge-captions aborts an entire validated batch.
export async function decodeWithRetry(page, run, absPath, verb) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      // Only a decode failure is worth retrying; a closed page or a bad path
      // will fail identically every time, so fail fast on those.
      if (!/cannot be decoded|EncodingError/i.test(error.message)) break;
      if (attempt < ATTEMPTS) await page.goto("about:blank");
    }
  }
  throw new Error(`Failed to ${verb} image ${absPath}: ${lastError.message}`);
}

export async function openDownscaler() {
  const browser = await chromium.launch();
  let page;
  try {
    page = await browser.newPage();
  } catch (error) {
    await browser.close();
    throw error;
  }

  async function toBase64Jpeg(absPath) {
    const srcB64 = readFileSync(absPath).toString("base64");
    return decodeWithRetry(
      page,
      () =>
        page.evaluate(
          async ({ srcB64, maxEdge, quality }) => {
            const img = new Image();
            img.src = `data:image/jpeg;base64,${srcB64}`;
            await img.decode();
            const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL("image/jpeg", quality).split(",")[1];
          },
          { srcB64, maxEdge: MAX_EDGE, quality: QUALITY },
        ),
      absPath,
      "downscale",
    );
  }

  return { toBase64Jpeg, close: () => browser.close() };
}

/** Natural pixel dimensions, needed for the manifest's orientation field. */
export async function readDimensions(page, absPath) {
  const srcB64 = readFileSync(absPath).toString("base64");
  return decodeWithRetry(
    page,
    () =>
      page.evaluate(async (b64) => {
        const img = new Image();
        img.src = `data:image/jpeg;base64,${b64}`;
        await img.decode();
        return { w: img.naturalWidth, h: img.naturalHeight };
      }, srcB64),
    absPath,
    "read dimensions from",
  );
}
