// =============================================================================
// Brief routes — the prompt coach, Application Layer.
//
// Thin by construction, like every route file here: parse, authorize,
// delegate to BriefService, map errors. This is also the composition root for
// the coach's AI provider, the same way routes/generations.js is for
// generation — swap the provider here and nowhere else.
// =============================================================================
import { Router } from "express";
import { BriefService } from "../../domain/brief-service.js";
import { claudeCliProvider } from "../../infrastructure/ai/claude-cli-provider.js";
import { requireAuth } from "../middleware/authorization.js";
import { sendError, respondWithError } from "../http-errors.js";

const briefService = new BriefService(claudeCliProvider);

export const briefsRouter = Router();

briefsRouter.use(requireAuth());

// ---- POST /api/briefs/coach -------------------------------------------------
// Always 200 with questions for a valid request: every model failure is the
// service's fallback (the fixed form), never an error the composer has to show.
briefsRouter.post("/coach", async (req, res) => {
  // `missing` (coach v1) is still accepted and validated, but no longer
  // steers anything: the server re-checks the prompt itself.
  const { prompt, missing, hasReferences } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return sendError(res, 400, "prompt is required.");
  }
  if (missing !== undefined && !Array.isArray(missing)) {
    return sendError(res, 400, "missing must be a list.");
  }

  try {
    res.json(await briefService.coach(req.context, { prompt, hasReferences: hasReferences === true }));
  } catch (err) {
    respondWithError(res, err, "Could not prepare follow-up questions.");
  }
});
