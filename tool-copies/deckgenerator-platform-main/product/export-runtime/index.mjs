// =============================================================================
// Export Runtime — orchestration entry point (Milestone M10, ADR-0008/ADR-0009).
//
// renderExport(deckDefinition, format, onSlideProgress?) drives Playwright
// against capture.html exactly as tools/export-pptx.mjs's main() loop drives
// export.html — mount each slide, screenshot it, walk its DOM (PPTX only —
// the PDF path never touches the walker, matching the original tool's own
// behavior of building the PDF purely from full-slide screenshots),
// screenshot each tagged graphic/plate element, and assemble the requested
// single format (approved M10 Decision 3: requested-format-only, never
// both). The mount step hands the deck definition to the page directly via
// page.evaluate() — never a URL id param, never getDeck().
//
// This file has no import, reference, or dependency anywhere on
// ExportRepository, ExportService, the Export Gateway's Mounting Stage,
// any route, any UI code, or a queue. It takes a plain {meta, slides}
// object in and returns a file reference out — a pure rendering subsystem,
// per ADR-0009.
//
// resolveOrigin() below finds the studio's own already-running server rather
// than starting a second one — included so this Runtime is self-sufficient to
// invoke and verify in isolation, exactly as the original CLI is.
// =============================================================================
// Playwright is imported lazily, inside the one function that launches a
// browser — NOT at module load. It is a devDependency, and this module is
// reached from export-gateway.js at server start, so a top-level import made
// the whole server fail to boot on any install done with `--omit=dev`
// (which is exactly what the launcher and the updater do). Exporting is an
// optional capability; needing it should not stop the studio from starting.
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { EXPORTS_DIR } from "../infrastructure/user-data.js";
// assemble-pptx.mjs is pure local code (constants + a DOM->shape mapper), so
// it stays a normal import. pptxgenjs, pdf-lib and playwright do NOT: they are
// devDependencies pulled in only when an export actually runs. Importing them
// at module load made the entire server fail to start on any `--omit=dev`
// install, which is what the launcher and updater both do.
import { SLIDE_W, SLIDE_H, IN_W, IN_H, addSlide } from "./assemble-pptx.mjs";

/** Loads an export-only dependency, turning "module not found" into an
 *  instruction rather than a stack trace. */
async function loadExportDep(name, load) {
  try {
    return await load();
  } catch (err) {
    if (err?.code === "ERR_MODULE_NOT_FOUND") {
      throw new Error(
        `Exporting needs ${name}, which isn't installed. Run \`npm run setup\` once ` +
        `(it installs the export tools and their browser), then try again.`
      );
    }
    throw err;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const DEFAULT_PORT = 4599;
const CAPTURE_PATH = "/product/export-runtime/capture.html";

/**
 * Finds a running server that can serve the capture page.
 *
 * This used to `spawn("python3", ["serve.py", 4599])` for every export. Three
 * things were wrong with that: python3 is a runtime dependency no user-facing
 * document mentions (the README asks only for Node), the port was hardcoded so
 * anything else on 4599 killed the export, and a SIGKILL of this process left
 * the Python server orphaned because the `finally` never ran.
 *
 * None of it was needed. The app's own Node server already serves
 * /product/export-runtime/capture.html, on whatever port it is running on, and
 * an export only ever happens while that server is up — it is the thing
 * handling the request.
 */
async function resolveOrigin(preferredPort) {
  const candidates = [
    preferredPort,
    Number(process.env.PORT) || null,
    ...Array.from({ length: 51 }, (_, i) => 4600 + i),
    DEFAULT_PORT,
  ].filter(Boolean);

  const seen = new Set();
  for (const port of candidates) {
    if (seen.has(port)) continue;
    seen.add(port);
    const origin = `http://127.0.0.1:${port}`;
    try {
      const res = await fetch(`${origin}${CAPTURE_PATH}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return origin;
    } catch {
      // not this one
    }
  }
  throw new Error(
    "Could not reach the studio's own server to render slides. " +
    "Exporting needs the app to be running — start it and try again."
  );
}

/**
 * @param {{meta: object, slides: object[]}} deckDefinition - the exact
 *   {meta, slides} shape presentationService.buildDeckDefinition() already
 *   produces (the same Engine Gateway contract render-gateway.js consumes).
 * @param {"pdf"|"pptx"} format
 * @param {(slidesComplete: number, slidesTotal: number) => void} [onSlideProgress]
 * @param {{port?: number, scale?: number}} [opts] - not part of the approved
 *   three-argument public signature; a caller-invisible default (port 4599,
 *   scale 2, matching the original tool's own default) is used unless a
 *   test/verification harness overrides it.
 * @returns {Promise<{filePath: string, contentHash: string} | {error: string}>}
 */
export async function renderExport(deckDefinition, format, onSlideProgress, opts = {}) {
  if (format !== "pdf" && format !== "pptx") {
    return { error: 'format must be "pdf" or "pptx".' };
  }

  let browser = null;

  try {
    const origin = await resolveOrigin(opts.port);

    const { chromium } = await loadExportDep("Playwright", () => import("playwright"));
    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: SLIDE_W, height: SLIDE_H },
      deviceScaleFactor: opts.scale || 2,
    });
    const page = await context.newPage();
    page.on("console", (m) => { if (m.type() === "error") console.error("  [export-runtime page error]", m.text()); });

    await page.goto(`${origin}${CAPTURE_PATH}`, { waitUntil: "load" });

    const slides = deckDefinition.slides;
    const total = slides.length;
    const pageImages = [];
    const PptxGenJS = format === "pptx"
      ? (await loadExportDep("pptxgenjs", () => import("pptxgenjs"))).default
      : null;
    const pptx = format === "pptx" ? new PptxGenJS() : null;
    if (pptx) {
      pptx.defineLayout({ name: "NAGARRO", width: IN_W, height: IN_H });
      pptx.layout = "NAGARRO";
      pptx.author = "Nagarro Presentation System";
      pptx.title = deckDefinition.meta?.title || "Export";
    }

    for (let n = 0; n < total; n++) {
      const res = await page.evaluate(
        ({ slide, meta }) => window.__mountSlide(slide, meta),
        { slide: slides[n], meta: deckDefinition.meta }
      );
      if (!res || !res.ok) return { error: `Slide ${n + 1} failed to render: ${res && res.error}` };

      const full = "image/png;base64," + (
        await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H } })
      ).toString("base64");

      if (format === "pdf") {
        // The PDF path never walks the DOM — identical to the original
        // tool's own behavior, which builds the PDF purely from full-slide
        // screenshots regardless of the PPTX ops extraction.
        pageImages.push(full);
      } else {
        let data = await page.evaluate(() => window.__extractSlide());
        if (data.error) return { error: `Slide ${n + 1}: ${data.error}` };
        if (data.imageOnly) data = { bg: { image: true }, ops: [] };

        const shots = { full, byXid: {} };
        for (const op of data.ops) {
          if (op.kind !== "image") continue;
          const sel = `[data-xid="${op.xid}"]`;
          try {
            await page.evaluate(({ s, plate }) => {
              const el = document.querySelector(s);
              document.querySelector(".stage")?.classList.add("cap-on");
              el?.classList.add(plate ? "cap-plate" : "cap-graphic");
            }, { s: sel, plate: !!op.plate });

            let buf;
            if (op.clip) {
              const c = {
                x: Math.max(0, op.clip.x), y: Math.max(0, op.clip.y),
                width: Math.min(SLIDE_W, op.clip.w), height: Math.min(SLIDE_H, op.clip.h),
              };
              buf = await page.screenshot({ omitBackground: true, clip: c });
            } else {
              buf = await page.locator(sel).screenshot({ omitBackground: true });
            }
            shots.byXid[op.xid] = "image/png;base64," + buf.toString("base64");

            await page.evaluate(({ s, plate }) => {
              document.querySelector(".stage")?.classList.remove("cap-on");
              document.querySelector(s)?.classList.remove(plate ? "cap-plate" : "cap-graphic");
            }, { s: sel, plate: !!op.plate });
          } catch (e) {
            console.error(`  [warn] could not capture image on slide ${n + 1}: ${e.message}`);
          }
        }

        addSlide(pptx, data, shots, slides[n]?.notes);
      }

      if (onSlideProgress) onSlideProgress(n + 1, total);
    }

    await context.close();

    /* Exports live inside the app folder, not the OS temp directory.
     *
     * mkdtemp(tmpdir()) put every .pptx and .pdf under /var/folders, which
     * macOS purges on reboot and after a few days — so the exports history kept
     * offering Download on files that had already been deleted, and exported
     * work sat outside the "copy the folder and you have everything" promise
     * the rest of the product makes. EXPORTS_DIR is git-ignored like the other
     * user-data paths, so an update never touches it. */
    const outDir = await mkdtemp(join(EXPORTS_DIR, "export-"));
    let filePath, outBuffer;
    if (format === "pdf") {
      const { assemblePdf } = await loadExportDep("pdf-lib", () => import("./assemble-pdf.mjs"));
      outBuffer = Buffer.from(await assemblePdf(pageImages));
      filePath = join(outDir, "export.pdf");
      await writeFile(filePath, outBuffer);
    } else {
      filePath = join(outDir, "export.pptx");
      await pptx.writeFile({ fileName: filePath });
      outBuffer = await readFile(filePath);
    }

    const contentHash = createHash("sha256").update(outBuffer).digest("hex");
    return { filePath, contentHash };
  } catch (e) {
    return { error: String(e && e.message ? e.message : e) };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
