// =============================================================================
// Engine Gateway route handler — Milestone M3, Application Layer
// (Phase 2.5 §02: "Gateway orchestration"). Protected at Milestone M4.
//
// Backs GET /api/presentations/:id/deck — Phase 2.5 §05's own table marks
// this endpoint "Permission: internal (Engine Gateway only)", distinct from
// the ordinary CRUD endpoints in routes/presentations.js. It exists purely
// to hand js/render-gateway.js (the frontend Gateway, Milestone M1) exactly
// the {meta, slides} object buildStage() expects.
//
// M4 resolved AUDIT-M4-06: "internal" does not mean unauthenticated.
// Phase 4 §03 requires a session check on every route, and Phase 4 §12
// Rule 29 forbids leaving an endpoint open, so this route requires a valid
// session like every other. The frontend Gateway sends its session cookie
// with credentials: "include" (Decision I).
//
// This handler does no assembly itself — it only calls
// Presentation Service.buildDeckDefinition(), the one function permitted to
// build that object, and returns its result as JSON.
// =============================================================================
import { presentationService, PresentationNotFoundError } from "../../domain/presentation-service.js";

export async function getDeckDefinition(req, res) {
  try {
    const deckDefinition = await presentationService.buildDeckDefinition(req.context, req.params.id);
    res.json(deckDefinition);
  } catch (err) {
    if (err instanceof PresentationNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Could not build the deck definition." });
  }
}
