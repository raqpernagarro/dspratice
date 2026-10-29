// =============================================================================
// Export routes — Milestone M10, WP5, Application Layer.
//
// Thin by construction: every handler below does request parsing,
// permission tier selection, and error-class → HTTP-status mapping only.
// All business rules (duplicate-Job rejection, workspace visibility,
// cancellation eligibility, the queue itself) live in ExportService and
// ExportGateway — never here.
//
// Permission tier: "workspace member" for every route below, per the
// Product Layer Spec's own literal endpoint table (§05: both
// "POST /api/presentations/:id/exports" and "GET /api/exports/:id" are
// listed as "workspace member," not "editor role+" — the UX Specification's
// screen-level "edit/export — editor role+" note conflicts with this at a
// lower-precedence phase and does not govern). requireAuth() alone (baseline
// authentication) matches this tier exactly, the same as
// presentationsRouter's own GET/POST/duplicate routes — workspace scoping
// itself is enforced inside ExportService, not at the route.
// =============================================================================
import { Router } from "express";
import {
  exportService,
  ExportJobNotFoundError,
  ExportNotCancelableError,
  DuplicateExportJobError,
  EmptyPresentationError,
  ExportNotFoundError,
} from "../../domain/export-service.js";
import { PresentationNotFoundError } from "../../domain/presentation-service.js";
import { enqueue, cancel } from "../gateway/export-gateway.js";
import { requireAuth } from "../middleware/authorization.js";

export const exportsRouter = Router();

function sendError(res, status, message) {
  res.status(status).json({ error: message }); // Decision D's minimal shape, matching every other route file
}

exportsRouter.use(requireAuth());

// ---- POST /api/exports -----------------------------------------------------
// Note on path: the Product Layer Spec's own literal table names
// "POST /api/presentations/:id/exports" (presentationId in the path); this
// task's explicit route list instead names "POST /api/exports"
// (presentationId in the body). Implemented per the current, explicit
// instruction — flagged transparently in the WP5 completion report as a
// deviation from the Spec's literal path, not silently reconciled.
exportsRouter.post("/", async (req, res) => {
  const { presentationId, format } = req.body || {};
  if (!presentationId || typeof presentationId !== "string") {
    return sendError(res, 400, "presentationId is required.");
  }
  if (format !== "pdf" && format !== "pptx") {
    return sendError(res, 400, 'format must be "pdf" or "pptx".');
  }

  try {
    const job = await exportService.requestExport(req.context, presentationId, format);
    enqueue(req.context, job.id); // Application-Layer orchestration trigger — never inside ExportService (M10 Decision 4)
    res.status(201).json(job);
  } catch (err) {
    if (err instanceof PresentationNotFoundError) return sendError(res, 404, err.message);
    if (err instanceof EmptyPresentationError) return sendError(res, 409, err.message, "empty_presentation");
    if (err instanceof DuplicateExportJobError) return sendError(res, 409, err.message);
    sendError(res, 500, "Could not start the export.");
  }
});

// ---- GET /api/exports (bare collection root) --------------------------------
// WP9: workspace-wide Export Jobs list, backing the "Export Jobs" screen.
// The list/single-record sibling shape presentationsRouter already has
// (GET / vs GET /:id) — X-Total-Count + a JSON array, identical wire
// convention to GET /api/presentations, so the existing UI-side
// listPresentationsWithTotal pattern can be reused verbatim for this
// endpoint. All filtering/pagination/workspace-scoping logic lives in
// ExportService.listExports; this handler only parses query params and
// maps errors, per this file's own "thin by construction" header.
exportsRouter.get("/", async (req, res) => {
  const { presentationId, format, limit, offset } = req.query;
  if (format !== undefined && format !== "pdf" && format !== "pptx") {
    return sendError(res, 400, 'format must be "pdf" or "pptx".');
  }
  try {
    const { items, total } = await exportService.listExports(req.context, {
      presentationId,
      format,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
      offset: offset !== undefined ? parseInt(offset, 10) : undefined,
    });
    res.set("X-Total-Count", String(total));
    res.json(items);
  } catch (err) {
    if (err instanceof PresentationNotFoundError) return sendError(res, 404, err.message);
    sendError(res, 500, "Could not list exports.");
  }
});

// ---- GET /api/exports/:id --------------------------------------------------
exportsRouter.get("/:id", async (req, res) => {
  try {
    const job = await exportService.getExportJob(req.context, req.params.id);
    res.json(job);
  } catch (err) {
    if (err instanceof ExportJobNotFoundError) return sendError(res, 404, err.message);
    sendError(res, 500, "Could not read the export job.");
  }
});

// ---- POST /api/exports/:id/cancel ------------------------------------------
exportsRouter.post("/:id/cancel", async (req, res) => {
  try {
    const result = await cancel(req.context, req.params.id);
    res.json(result);
  } catch (err) {
    if (err instanceof ExportJobNotFoundError) return sendError(res, 404, err.message);
    if (err instanceof ExportNotCancelableError) return sendError(res, 409, err.message);
    sendError(res, 500, "Could not cancel the export.");
  }
});

// ---- GET /api/exports/:exportId/download ------------------------------------
// WP6 finding resolution: the download route the original WP6 pass found
// missing. Deliberately a different param name (:exportId, not :id) from
// the two routes above — those key on an Export JOB id, this one keys on
// an Export RECORD id (the `exported.id` the client already holds once a
// Job succeeds, via getLatestExport's response body). The two id spaces
// never collide (independent randomUUID()s), but the distinct param name
// keeps that distinction legible to a future reader, not just accidentally
// non-colliding. Content-Type/Content-Disposition assembly is the only
// logic here — pure HTTP-response shaping, not business logic, matching
// the same "thin route" posture as getLatestExport's JSON pass-through
// below.
const CONTENT_TYPES = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

exportsRouter.get("/:exportId/download", async (req, res) => {
  try {
    const { exported, buffer } = await exportService.getExportFile(req.context, req.params.exportId);
    const filename = `export-v${exported.version}.${exported.format}`;
    res.set("Content-Type", CONTENT_TYPES[exported.format]);
    res.set("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    if (err instanceof ExportNotFoundError) return sendError(res, 404, err.message);
    sendError(res, 500, "Could not download the export.");
  }
});

// ---- GET /api/presentations/:id/exports/latest -----------------------------
// A standalone handler, mounted directly in server.js rather than added to
// presentationsRouter — the same pattern that file's own header already
// uses for GET /api/presentations/:id/deck ("a different kind of
// endpoint... deliberately kept separate"). Keeps presentations.js
// untouched.
export async function getLatestExport(req, res) {
  const { format } = req.query;
  if (format !== "pdf" && format !== "pptx") {
    return sendError(res, 400, 'format must be "pdf" or "pptx".');
  }
  try {
    const exported = await exportService.getLatestExport(req.context, req.params.id, format);
    res.json(exported); // null when none exists yet — no rendering, no Job creation
  } catch (err) {
    if (err instanceof PresentationNotFoundError) return sendError(res, 404, err.message);
    sendError(res, 500, "Could not read the latest export.");
  }
}
