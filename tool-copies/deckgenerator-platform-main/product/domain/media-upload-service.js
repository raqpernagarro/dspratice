// =============================================================================
// Media Upload Service — Domain Layer.
//
// The Editor's "Replace image" popover previously only accepted a pasted
// URL or repo asset path (product/ui/editor.js). This adds the other half:
// uploading a file from disk. It reuses the SAME write path the URL field
// already uses — this service only turns an uploaded file into a repo-
// relative asset path (e.g. "assets/uploads/<uuid>.jpg"); the popover's
// existing Apply flow (writeField → PATCH .../slides/:slideId) is what
// actually stores that path onto the slide, unchanged.
//
// Files land in assets/uploads/ at the repo root — the same directory tree
// serve.py already serves statically (see assets/photography, assets/figma
// etc. referenced verbatim as content-field values today), so a returned
// path is servable immediately with no new serving convention.
//
// Type is verified by sniffing magic bytes, never trusted from the
// Content-Type header or the client-supplied filename — either can claim
// anything. The size cap is enforced twice: once by the route's raw()
// body-parser limit (fails fast, before the whole body is buffered) and
// again here (defense in depth if a future caller wires this service up
// without that limit).
// =============================================================================
import { createHash, randomUUID } from "node:crypto";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { UPLOADS_DIR as USER_UPLOADS_DIR } from "../infrastructure/user-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Written outside the app folder so an update never deletes someone's
// images, but still SERVED at /assets/uploads/ (server.js mounts the user
// uploads dir at that path first) so stored content paths stay valid.
const UPLOADS_DIR = USER_UPLOADS_DIR;
const REPO_RELATIVE_PREFIX = "assets/uploads";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export class MediaUploadError extends Error {
  constructor(message) {
    super(message);
    this.name = "MediaUploadError";
  }
}

/** Sniffs the handful of raster formats the Editor's image fields ever hold.
 * SVG is deliberately not included — it's XML text, not a magic-byte
 * format, and the brand icon set already ships as hand-authored SVG rather
 * than user uploads. */
function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
  ) {
    return { ext: "gif", mime: "image/gif" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

export const mediaUploadService = {
  /** @returns {Promise<{path: string, mime: string}>} */
  async uploadImage({ buffer }) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new MediaUploadError("No file uploaded.");
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new MediaUploadError("Image exceeds the 15MB limit.");
    }
    const detected = detectImageType(buffer);
    if (!detected) {
      throw new MediaUploadError("File is not a supported image type (JPEG, PNG, GIF, or WEBP).");
    }
    await mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${randomUUID()}.${detected.ext}`;
    await writeFile(join(UPLOADS_DIR, filename), buffer);
    return { path: `${REPO_RELATIVE_PREFIX}/${filename}`, mime: detected.mime };
  },
};

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

  const sharp = await loadSharp();

  // Already stored under any extension a previous transform chose? A stale
  // heavy PNG — stored back when sharp was unavailable, or before
  // recompression existed at all — never shrinks on its own; re-importing
  // the same source is the only chance to fix it, so that one case falls
  // through to the transform pipeline below instead of returning early.
  let staleHeavyPngPath;
  for (const ext of ["jpg", "png", "gif", "webp"]) {
    const existing = join(UPLOADS_DIR, `${hash}.${ext}`);
    try {
      const info = await stat(existing);
      if (ext === "png" && sharp && info.size > HEAVY_PNG_BYTES) {
        staleHeavyPngPath = existing;
        break;
      }
      return { path: `${REPO_RELATIVE_PREFIX}/${hash}.${ext}`, mime: `image/${ext === "jpg" ? "jpeg" : ext}` };
    } catch { /* not stored yet */ }
  }

  let out = buffer;
  let { ext, mime } = detected;
  // GIF is excluded: sharp flattens animated GIFs to a single frame by default,
  // destroying animation. GIFs are stored as-is to preserve any animation.
  if (sharp && (ext === "png" || ext === "jpg" || ext === "webp")) {
    try {
      const meta = await sharp(buffer).metadata();
      const needsResize = (meta.width || 0) > MAX_IMPORT_IMAGE_PX;
      const heavyPng = ext === "png" && buffer.length > HEAVY_PNG_BYTES;
      // A declared alpha channel doesn't mean any pixel is actually
      // transparent — real screenshots almost always carry one while being
      // fully opaque. Only pay for the extra stats() pass when the alpha
      // flag would otherwise block JPEG recompression of a heavy PNG.
      let jpegEligible = heavyPng && !meta.hasAlpha;
      if (heavyPng && meta.hasAlpha) {
        const stats = await sharp(buffer).stats();
        jpegEligible = stats.isOpaque === true;
      }
      if (needsResize || heavyPng) {
        const pipeline = sharp(buffer).resize({ width: MAX_IMPORT_IMAGE_PX, withoutEnlargement: true });
        if (jpegEligible) {
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
  if (staleHeavyPngPath && filename !== `${hash}.png`) {
    await unlink(staleHeavyPngPath).catch(() => {});
  }
  return { path: `${REPO_RELATIVE_PREFIX}/${filename}`, mime };
}
