// =============================================================================
// Template routes — Milestone M5, Application Layer. Extended M8.
//
// GET /api/templates now accepts Phase 2.5 §05's documented query params
// (category, search). GET /api/templates/:name — the Templates Gallery's
// detail/preview drill-in — is added at M8. POST /api/templates/:name/promote
// is deliberately not built (approved decision A — no design-operator role
// exists in the built system, and Phase 4's M8 acceptance criteria doesn't
// require it).
//
// Protected like every other route (Phase 4 §12 Rule 29). Decision K: the
// handler passes req.context into the Service and never the request itself.
// =============================================================================
import { Router } from "express";
import { templateService } from "../../domain/template-service.js";
import { requireAuth } from "../middleware/authorization.js";

export const templatesRouter = Router();

templatesRouter.use(requireAuth());

templatesRouter.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    res.json(await templateService.listTemplates(req.context, { category, search }));
  } catch {
    res.status(500).json({ error: "Could not read the template library." });
  }
});

templatesRouter.get("/:name", async (req, res) => {
  try {
    const template = await templateService.getTemplate(req.context, req.params.name);
    if (!template) return res.status(404).json({ error: "Template not found." });
    res.json(template);
  } catch {
    res.status(500).json({ error: "Could not read the template library." });
  }
});
