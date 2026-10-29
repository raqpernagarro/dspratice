// =============================================================================
// References routes — /api/references.
//
// Source material attached to a deck: a file (raw bytes, filename as a query
// param — same single-file upload shape as /api/presentations/import) or
// pasted text. Every route needs a session and is scoped to its workspace;
// another workspace's id answers 404.
// =============================================================================
import { Router, raw } from "express";
import { claudeCliProvider } from "../../infrastructure/ai/claude-cli-provider.js";
import {
  ReferenceService,
  ReferenceNotFoundError,
  UnsupportedReferenceError,
  ReferenceTooLargeError,
  ReferenceParseError,
  ReferenceValidationError,
  MAX_REFERENCE_BYTES,
} from "../../domain/reference-service.js";
import { requireAuth } from "../middleware/authorization.js";
import { sendError, respondWithError } from "../http-errors.js";

const referenceService = new ReferenceService(claudeCliProvider);

const OVERRIDES = [
  [ReferenceNotFoundError, { status: 404, code: "not_found" }],
  [UnsupportedReferenceError, { status: 415, code: "unsupported_type" }],
  [ReferenceTooLargeError, { status: 413, code: "too_large" }],
  [ReferenceParseError, { status: 400, code: "unreadable" }],
  [ReferenceValidationError, { status: 400, code: "validation" }],
];

export const referencesRouter = Router();
referencesRouter.use(requireAuth());

referencesRouter.post("/", raw({ type: "application/octet-stream", limit: MAX_REFERENCE_BYTES }), async (req, res) => {
  const filename = typeof req.query.filename === "string" ? req.query.filename : "";
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return sendError(res, 400, "No file uploaded.");
  try {
    res.status(201).json(await referenceService.create(req.context, { buffer: req.body, filename }));
  } catch (err) {
    respondWithError(res, err, "Could not read this reference.", OVERRIDES);
  }
});

// The raw() parser's over-limit error, answered here: the app-level 413
// handler in server.js sits before the routers, so it never sees it.
referencesRouter.use((err, _req, res, next) => {
  if (err?.type !== "entity.too.large") return next(err);
  sendError(res, 413, "This file is larger than 30 MB. Try a smaller file.", "too_large");
});

referencesRouter.post("/text", async (req, res) => {
  const { name, text } = req.body || {};
  try {
    res.status(201).json(await referenceService.createFromText(req.context, { name, text }));
  } catch (err) {
    respondWithError(res, err, "Could not save this text.", OVERRIDES);
  }
});

referencesRouter.patch("/:id", async (req, res) => {
  try {
    res.json(await referenceService.setUseOnSlides(req.context, req.params.id, req.body?.useOnSlides));
  } catch (err) {
    respondWithError(res, err, "Could not update this reference.", OVERRIDES);
  }
});

referencesRouter.delete("/:id", async (req, res) => {
  try {
    await referenceService.remove(req.context, req.params.id);
    res.status(204).end();
  } catch (err) {
    respondWithError(res, err, "Could not delete this reference.", OVERRIDES);
  }
});
