// =============================================================================
// Presentation routes — Milestone M3, Application Layer (Phase 2.5 §02/§05).
// Protected at Milestone M4. Slide-mutation routes added M9.
//
// The seven ordinary CRUD endpoints from Phase 2.5 §05's "Presentations —
// Library & Detail" table. The eighth endpoint from that table,
// GET /api/presentations/:id/deck, is deliberately kept separate in
// gateway/engine-gateway.js — Phase 2.5 §05 marks it as a different kind of
// endpoint ("internal, Engine Gateway only"), not ordinary CRUD.
//
// M9 adds two of Phase 2.5 §05's three "Slides" table endpoints:
// PATCH .../slides/:slideId and POST .../slides/:slideId/template. The
// third, POST .../slides/:slideId/regenerate, is AI regeneration — M12/13,
// not built here (approved decision B).
//
// M4 added the permission tiers Phase 2.5 §05's own table specifies:
//   GET / POST / duplicate → workspace member
//   PATCH                  → owner / editor role
//   DELETE / archive       → owner / admin
// The Slides table specifies "editor role" for both its endpoints — the
// same tier PATCH already uses, reusing the identical middleware call.
// Enforcement lives in middleware/authorization.js, never in a repository
// and never inline in a handler.
//
// Decision K: handlers pass req.context — an immutable
// { userId, workspaceId, role } — as each Service call's first argument.
// No Service ever receives the request object itself.
// =============================================================================
import { Router, raw } from "express";
import { presentationService } from "../../domain/presentation-service.js";
import { pptxImportService, PptxParseError } from "../../domain/pptx-import-service.js";
import { mediaUploadService, MediaUploadError, MAX_UPLOAD_BYTES } from "../../domain/media-upload-service.js";
import { presentationRepository } from "../../storage/presentation-repository.js";
import { requireAuth, requireOwnerOrRole } from "../middleware/authorization.js";
import { sendError, respondWithError } from "../http-errors.js";

export const presentationsRouter = Router();

/** Resource loader for the ownership checks. Reads only; the authorization
 * middleware decides what to do with the result. */
const loadPresentation = (req) => presentationRepository.findById(req.params.id);

// Every route below requires a valid session — Phase 4 §12 Rule 29.
presentationsRouter.use(requireAuth());

presentationsRouter.get("/", async (req, res) => {
  const { status, archived, search, sort, limit, offset } = req.query;
  /* An upper bound as well as a lower one. `?limit=1000000` returned the whole
   * workspace in a single response — a page-size parameter that does not bound
   * the page. 100 is well above any real page the UI asks for. */
  const MAX_PAGE = 100;
  const clamp = (v, max = Number.MAX_SAFE_INTEGER) => {
    const n = parseInt(v, 10);
    if (!Number.isInteger(n) || n < 0) return undefined;
    return Math.min(n, max);
  };
  try {
    const { items, total } = await presentationService.listPresentations(req.context, {
      status,
      archived: archived === undefined ? undefined : archived === "true" || archived === "1",
      search,
      sort,
      limit: limit !== undefined ? clamp(limit, MAX_PAGE) : undefined,
      offset: offset !== undefined ? clamp(offset) : undefined,
    });
    res.set("X-Total-Count", String(total));
    res.json(items);
  } catch {
    sendError(res, 500, "Could not list presentations.");
  }
});

presentationsRouter.post("/", async (req, res) => {
  const { title, slides } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return sendError(res, 400, "title is required.");
  }
  try {
    const created = await presentationService.createPresentation(req.context, { title, slides });
    res.status(201).json(created);
  } catch (err) {
    respondWithError(res, err, "Could not create the presentation.");
  }
});

// ---- MVP Sprint 1 — PPTX Upload/Import --------------------------------------
// Route-local raw-body parser: the global express.json() in server.js only
// parses application/json bodies, so a binary upload passes through it
// untouched — this is the one route that needs the raw bytes instead. The
// filename travels as a query param (no multipart/form-data parsing
// dependency needed for a single-file upload).
// Concurrency guard: `raw()` above has already buffered the whole body (up to
// 200MB) into memory by the time this handler runs — that part is accepted,
// not fixed here. What this bounds is the work AFTER the body is in memory:
// JSZip decompression and the regex-based slide/table/image parsing that
// follows, which is real CPU and additional allocation on top of the
// buffered bytes. Two of those running at once on a laptop is already a lot;
// a third queued request just makes every one of them slower, so it is
// rejected fast instead of buffered and left to contend.
let activeImports = 0;
const MAX_CONCURRENT_IMPORTS = 2;

presentationsRouter.post("/import", raw({ type: "application/octet-stream", limit: "200mb" }), async (req, res) => {
  const filename = typeof req.query.filename === "string" ? req.query.filename : "";
  // Whose images the imported deck uses. Anything other than "brand" is
  // "source" — the file's own images, kept by default.
  const imageSource = req.query.images === "brand" ? "brand" : "source";
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return sendError(res, 400, "No file uploaded.");
  }
  if (activeImports >= MAX_CONCURRENT_IMPORTS) {
    return sendError(res, 429, "Two imports are already running — try again in a moment.");
  }
  activeImports++;
  try {
    // 202: the file is parsed and its outline stored as a Generation. The
    // caller approves it and polls, exactly as for a prompt — composing 16
    // slides here took 260s+, well past the browser's own request timeout.
    const generation = await pptxImportService.importPptx(req.context, { buffer: req.body, filename, imageSource });
    res.status(202).json(generation);
  } catch (err) {
    if (err instanceof PptxParseError) return sendError(res, 400, err.message);
    sendError(res, 500, "Could not import this presentation.");
  } finally {
    activeImports--;
  }
});

presentationsRouter.get("/:id", async (req, res) => {
  try {
    const record = await presentationService.getPresentation(req.context, req.params.id);
    res.json(record);
  } catch (err) {
    respondWithError(res, err, "Could not read the presentation.");
  }
});

presentationsRouter.patch("/:id", requireOwnerOrRole("editor", loadPresentation), async (req, res) => {
  try {
    const updated = await presentationService.updatePresentation(req.context, req.params.id, req.body || {});
    res.json(updated);
  } catch (err) {
    respondWithError(res, err, "Could not update the presentation.");
  }
});

presentationsRouter.delete("/:id", requireOwnerOrRole("admin", loadPresentation), async (req, res) => {
  try {
    await presentationService.deletePresentation(req.context, req.params.id);
    res.status(204).end();
  } catch (err) {
    respondWithError(res, err, "Could not delete the presentation.");
  }
});

presentationsRouter.post("/:id/duplicate", async (req, res) => {
  try {
    const copy = await presentationService.duplicatePresentation(req.context, req.params.id);
    res.status(201).json(copy);
  } catch (err) {
    respondWithError(res, err, "Could not duplicate the presentation.");
  }
});

presentationsRouter.post("/:id/archive", requireOwnerOrRole("admin", loadPresentation), async (req, res) => {
  const { archived } = req.body || {};
  try {
    const updated = await presentationService.archivePresentation(req.context, req.params.id, archived !== false);
    res.json(updated);
  } catch (err) {
    respondWithError(res, err, "Could not archive the presentation.");
  }
});

// ---- Milestone M9 — Editor's slide-mutation endpoints ----------------------

presentationsRouter.patch(
  "/:id/slides/:slideId",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    /* themeOverride travels too. It was absent here AND in the service, so a
     * PATCH carrying it was answered 200 with the slide unchanged and the
     * caller had no way to tell — a slide's light/dark could not be set by any
     * route in the product. */
    const { content, manualOverrides, styleOverrides, themeOverride } = req.body || {};
    try {
      const slide = await presentationService.updateSlide(req.context, req.params.id, req.params.slideId, {
        content,
        manualOverrides,
        styleOverrides,
        themeOverride,
      });
      res.json(slide);
    } catch (err) {
      respondWithError(res, err, "Could not update the slide.");
    }
  }
);

// ---- Editor "Replace image" — upload from disk ------------------------------
// The popover previously only took a pasted URL/path. This is the other
// half: upload a file, get back a repo-relative path, and the SAME Apply
// flow (PATCH .../slides/:slideId) writes it onto the slide — no second
// write path. Scoped to a presentation (editor role, same tier as the
// slide-mutation routes) purely for authorization; the file itself isn't
// tied to any one slide or record.
//
// Route-local raw-body parser, same reasoning as /import above: the body is
// binary image bytes, not JSON. `type: "image/*"` matches whatever
// Content-Type the browser sets from the File/Blob it read (image/jpeg,
// image/png, ...); anything else falls through unparsed and is rejected
// below as "No file uploaded."
presentationsRouter.post(
  "/:id/media",
  requireOwnerOrRole("editor", loadPresentation),
  raw({ type: "image/*", limit: MAX_UPLOAD_BYTES }),
  async (req, res) => {
    try {
      const result = await mediaUploadService.uploadImage({ buffer: req.body });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof MediaUploadError) return sendError(res, 400, err.message);
      sendError(res, 500, "Could not upload the image.");
    }
  }
);

// ---- Slide structure: add / duplicate / delete ------------------------------
// The Editor could previously only change slides that already existed. These
// three give it the ability to change the slide COUNT. Same permission tier
// as the sibling slide-mutation routes above ("editor").

presentationsRouter.post(
  "/:id/slides",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    const { templateName, position, relativeToSlideId, content } = req.body || {};
    if (!templateName || typeof templateName !== "string") {
      return sendError(res, 400, "templateName is required.");
    }
    if (position && !["before", "after", "end"].includes(position)) {
      return sendError(res, 400, 'position must be "before", "after" or "end".');
    }
    if (content !== undefined && (typeof content !== "object" || content === null || Array.isArray(content))) {
      return sendError(res, 400, "content must be an object.");
    }
    try {
      // `content` is forwarded: the service supports seeding a new slide with
      // real content (its documented AI-slide landing path) — it was silently
      // dropped here, so every caller got the template's example instead.
      const result = await presentationService.addSlide(req.context, req.params.id, {
        templateName,
        position,
        relativeToSlideId,
        content,
      });
      res.status(201).json(result);
    } catch (err) {
      respondWithError(res, err, "Could not add the slide.");
    }
  }
);

presentationsRouter.post(
  "/:id/slides/:slideId/duplicate",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    try {
      const result = await presentationService.duplicateSlide(req.context, req.params.id, req.params.slideId);
      res.status(201).json(result);
    } catch (err) {
      respondWithError(res, err, "Could not duplicate the slide.");
    }
  }
);

presentationsRouter.delete(
  "/:id/slides/:slideId",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    try {
      const updated = await presentationService.deleteSlide(req.context, req.params.id, req.params.slideId);
      res.json(updated);
    } catch (err) {
      respondWithError(res, err, "Could not delete the slide.");
    }
  }
);

// Drag-to-reorder in the navigator. Body is the full ordered list of slide
// ids — a permutation of the deck's current slides, not a from/to index —
// so the request is unambiguous even if slides were added/removed elsewhere
// a moment earlier.
//
// Deliberately NOT "/:id/slides/order": that would be shadowed by the
// PATCH /:id/slides/:slideId route registered above it (Express matches
// registration order, and "order" would just bind to :slideId).
presentationsRouter.patch(
  "/:id/slides-order",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    const { slideIds } = req.body || {};
    if (!Array.isArray(slideIds) || slideIds.length === 0) {
      return sendError(res, 400, "slideIds must be a non-empty array.");
    }
    try {
      const updated = await presentationService.reorderSlides(req.context, req.params.id, slideIds);
      res.json(updated);
    } catch (err) {
      respondWithError(res, err, "Could not reorder the slides.");
    }
  }
);

presentationsRouter.post(
  "/:id/slides/:slideId/template",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    const { templateName, allowOverride } = req.body || {};
    if (!templateName || typeof templateName !== "string") {
      return sendError(res, 400, "templateName is required.");
    }
    try {
      const result = await presentationService.swapSlideTemplate(req.context, req.params.id, req.params.slideId, {
        templateName,
        allowOverride: allowOverride === true,
      });
      res.json(result);
    } catch (err) {
      respondWithError(res, err, "Could not swap the template.");
    }
  }
);
