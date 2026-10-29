// =============================================================================
// Editor AI Assist route — M15 Phase 3, Application Layer.
//
// Thin by construction, matching every other route file in this codebase:
// parse request, authorize, delegate to the Service, map errors. All
// business rules live in EditorAiService — never here.
//
// Deliberately a separate file/router from routes/presentations.js rather
// than an addition to it: this keeps that already-working, already-audited
// file completely untouched (zero-diff) while still exposing the exact URL
// shape requested — POST /api/presentations/:id/slides/:slideId/ai — by
// mounting this router at the same "/api/presentations" prefix in
// server.js. Express tries each router mounted at a shared prefix in turn,
// so presentationsRouter's own routes are unaffected and this router only
// ever matches the one path it defines.
//
// Composition root for the AI Provider dependency, same posture as
// generations.js: EditorAiService takes its AIProvider via constructor, and
// this file is where the concrete provider (the mock, for this phase) is
// chosen.
// =============================================================================
import { Router } from "express";
import { EditorAiService, EditorAiValidationError } from "../../domain/editor-ai-service.js";
import {
  PresentationNotFoundError,
  SlideNotFoundError,
  UnknownTemplateError,
} from "../../domain/presentation-service.js";
import { SlideContentInvalidError } from "../../domain/slide-content.js";
import { claudeCliProvider } from "../../infrastructure/ai/claude-cli-provider.js";
import { presentationRepository } from "../../storage/presentation-repository.js";
import { requireOwnerOrRole } from "../middleware/authorization.js";
import { sendError, respondWithError } from "../http-errors.js";

// Switched from mockAIProvider to claudeCliProvider: Editor AI Assist now
// runs against the same local Claude CLI that presentation generation already
// used, so there is one AI orchestration layer rather than two.
const editorAiService = new EditorAiService(claudeCliProvider);

export const editorAiRouter = Router();

/** Resource loader for the ownership check — identical shape to
 * routes/presentations.js's own loadPresentation, duplicated locally rather
 * than imported, matching this codebase's established convention of each
 * route file owning its own small loader/sendError helpers. */
const loadPresentation = (req) => presentationRepository.findById(req.params.id);

// ---- POST /api/presentations/:id/slides/:slideId/ai ------------------------
// Same permission tier as the sibling slide-mutation endpoints in
// routes/presentations.js (PATCH .../slides/:slideId and
// .../slides/:slideId/template): owner or editor role.
editorAiRouter.post(
  "/:id/slides/:slideId/ai",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    const { action, content, instructions, history } = req.body || {};
    try {
      const result = await editorAiService.assist(req.context, req.params.id, req.params.slideId, {
        action,
        content,
        instructions,
        history,
      });
      res.json(result);
    } catch (err) {
      if (err instanceof EditorAiValidationError) return sendError(res, 400, err.message, "validation");
      respondWithError(res, err, "Could not run the AI assist action.");
    }
  }
);

// ---- POST /api/presentations/:id/slides/generate ----------------------------
// "Generate slide with AI" — the user states intent only; the route inserts
// whatever slide Claude drafts. Same permission tier as every other slide-
// mutation route.
editorAiRouter.post(
  "/:id/slides/generate",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    const { intent, position, relativeToSlideId } = req.body || {};
    try {
      const result = await editorAiService.generateSlide(req.context, req.params.id, {
        intent, position, relativeToSlideId,
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof EditorAiValidationError) return sendError(res, 400, err.message, "validation");
      // Claude chose badly — not the caller's fault, so these two are 502 here.
      respondWithError(res, err, "Could not generate a slide.", [
        [UnknownTemplateError, { status: 502, code: "ai_failed" }],
        [SlideContentInvalidError, { status: 502, code: "ai_failed" }],
      ]);
    }
  }
);

// ---- POST /api/presentations/:id/review --------------------------------------
editorAiRouter.post(
  "/:id/review",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    try {
      res.json(await editorAiService.reviewPresentation(req.context, req.params.id));
    } catch (err) {
      if (err instanceof EditorAiValidationError) return sendError(res, 400, err.message, "validation");
      respondWithError(res, err, "Could not review the presentation.");
    }
  }
);

// ---- POST /api/presentations/:id/slides/:slideId/plan -----------------------
// One natural-language ask, planned against the real template catalog: the
// answer may be a copy edit, a layout swap, or an extra slide.
editorAiRouter.post(
  "/:id/slides/:slideId/plan",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    const { instruction } = req.body || {};
    try {
      const result = await editorAiService.planSlideChange(req.context, req.params.id, req.params.slideId, { instruction });
      res.json(result);
    } catch (err) {
      if (err instanceof EditorAiValidationError) return sendError(res, 400, err.message, "validation");
      respondWithError(res, err, "Could not plan that change.");
    }
  }
);

// ---- POST /api/presentations/:id/slides/:slideId/map-template ---------------
// Feeds the swap picker's field-mapping dialog a semantic suggestion.
editorAiRouter.post(
  "/:id/slides/:slideId/map-template",
  requireOwnerOrRole("editor", loadPresentation),
  async (req, res) => {
    const { newTemplateName } = req.body || {};
    if (!newTemplateName || typeof newTemplateName !== "string") {
      return sendError(res, 400, "newTemplateName is required.");
    }
    try {
      const result = await editorAiService.suggestFieldMapping(req.context, req.params.id, req.params.slideId, {
        newTemplateName,
      });
      res.json(result);
    } catch (err) {
      respondWithError(res, err, "Could not suggest a field mapping.");
    }
  }
);
