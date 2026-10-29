// =============================================================================
// Generation routes — M15, Application Layer.
//
// Thin by construction, matching every other route file in this codebase
// (see routes/exports.js's own header): parse request, authorize, delegate
// to the Service, map errors. All business rules live in GenerationService —
// never here.
//
// Composition root for the AI Provider dependency: GenerationService takes
// its AIProvider via constructor rather than importing one at module scope
// (see generation-service.js's own header for why), so this file is where
// the concrete provider is chosen — the mock provider for this phase, swapped
// for a real one later with a change to this one import and this one line,
// nowhere else in the codebase.
// =============================================================================
import { Router } from "express";
import {
  GenerationService,
  GenerationNotFoundError,
  GenerationNotApprovableError,
} from "../../domain/generation-service.js";
import { ReferenceNotFoundError, ReferenceValidationError } from "../../domain/reference-service.js";
import { claudeCliProvider } from "../../infrastructure/ai/claude-cli-provider.js";
import { requireAuth } from "../middleware/authorization.js";
import { sendError, respondWithError } from "../http-errors.js";

// MVP Sprint 1: swapped from mockAIProvider to claudeCliProvider — exactly
// the one import and one line this composition root was always meant to
// change (see generation-service.js's own header). Nothing else in the
// codebase knows or cares which provider is answering a generation request.
const generationService = new GenerationService(claudeCliProvider);

export const generationsRouter = Router();

generationsRouter.use(requireAuth());

// ---- POST /api/generations --------------------------------------------------
generationsRouter.post("/", async (req, res) => {
  const { prompt, coaching, answers, wantsHook, slideCount, referenceIds, background } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return sendError(res, 400, "prompt is required.");
  }

  try {
    // Values are cleaned in the domain; the route only passes them through.
    // A hook is the default — only an explicit false (or "no") turns it off.
    const generation = await generationService.requestGeneration(req.context, {
      prompt,
      coaching,
      answers,
      wantsHook: !(wantsHook === false || wantsHook === "false" || wantsHook === "no"),
      slideCount,
      referenceIds,
      background: background === true,
    });
    // 202 when drafting continues after the response (poll GET /:id until the
    // status leaves `pending`); 201 when the outline is already drafted.
    res.status(background === true ? 202 : 201).json(generation);
  } catch (err) {
    // A validation error from the service must be distinguishable from a
    // crash — this previously swallowed everything into a blanket 500.
    respondWithError(res, err, "Could not start the generation.", [
      // Too many references → 400; one this workspace cannot see → 404.
      [ReferenceValidationError, { status: 400, code: "validation" }],
      [ReferenceNotFoundError, { status: 404, code: "not_found" }],
    ]);
  }
});

// ---- GET /api/generations/:id ------------------------------------------------
generationsRouter.get("/:id", async (req, res) => {
  try {
    const generation = await generationService.getGeneration(req.context, req.params.id);
    res.json(generation);
  } catch (err) {
    if (err instanceof GenerationNotFoundError) return sendError(res, 404, err.message, "not_found");
    respondWithError(res, err, "Could not read the generation.");
  }
});

// ---- PATCH /api/generations/:id ---------------------------------------------
// Edit the outline before it is laid out. The approve endpoint always modelled
// this window; nothing could write to it, so the UI approved straight through.
generationsRouter.patch("/:id", async (req, res) => {
  try {
    const updated = await generationService.updateOutline(
      req.context, req.params.id, req.body?.proposedMapping
    );
    res.json(updated);
  } catch (err) {
    if (err instanceof GenerationNotFoundError) return sendError(res, 404, err.message, "not_found");
    if (err instanceof GenerationNotApprovableError) return sendError(res, 409, err.message, "not_editable");
    if (err instanceof Error && /proposedMapping|outline needs/.test(err.message)) {
      return sendError(res, 400, err.message, "validation");
    }
    respondWithError(res, err, "Could not update the outline.");
  }
});

// ---- POST /api/generations/:id/approve --------------------------------------
// Phase 4 M15: turns a completed Generation into a real Presentation. All
// mapping/creation logic lives in GenerationService — this route only
// parses, delegates, and maps errors, matching every other route file.
generationsRouter.post("/:id/approve", async (req, res) => {
  try {
    // 202: the claim is taken and composition is running. The client polls
    // GET /api/generations/:id until presentationId appears. Returning 201 with
    // a finished deck meant holding the request open for 130-260s, which the
    // browser aborts at 150.
    const generation = await generationService.approveGeneration(req.context, req.params.id);
    res.status(202).json(generation);
  } catch (err) {
    if (err instanceof GenerationNotFoundError) return sendError(res, 404, err.message, "not_found");
    if (err instanceof GenerationNotApprovableError) {
      // Carry the existing presentation id so a client that retried after its
      // own timeout can open the deck instead of dead-ending on the conflict.
      return res.status(409).json({
        error: err.message,
        code: "not_approvable",
        status: err.status,
        ...(err.presentationId ? { presentationId: err.presentationId } : {}),
      });
    }
    respondWithError(res, err, "Could not approve the generation.");
  }
});
