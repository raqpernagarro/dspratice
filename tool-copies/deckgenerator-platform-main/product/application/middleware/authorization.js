// =============================================================================
// Authorization middleware — Milestone M4, Application Layer.
//
// Phase 2.5 §02 places authorization in the Application Layer, and the
// approved constraint states "no permission logic inside repositories".
// This file is therefore the single place role and ownership are checked.
//
// Decision E: roles are hierarchical — member < editor < admin. Ownership
// is derived from Presentation.ownerId, not represented as a role.
//
// Permission tiers come straight from Phase 2.5 §05's endpoint table:
//   GET/POST/duplicate  → workspace member
//   PATCH               → owner / editor role
//   DELETE / archive    → owner / admin
// =============================================================================
import { ROLES } from "../../storage/workspace-repository.js";

function sendError(res, status, message) {
  res.status(status).json({ error: message }); // Decision D of M3
}

/** Rejects an unauthenticated request. Phase 2.5 §04: an expired or absent
 * session produces a typed 401, never a silent failure elsewhere. */
export function requireAuth() {
  return (req, res, next) => {
    if (!req.context) {
      return sendError(res, 401, "Authentication required.");
    }
    next();
  };
}

/** @param {"member"|"editor"|"admin"} minimum */
export function requireRole(minimum) {
  const required = ROLES.indexOf(minimum);
  if (required === -1) throw new Error(`Unknown role: ${minimum}`);

  return (req, res, next) => {
    if (!req.context) return sendError(res, 401, "Authentication required.");
    if (ROLES.indexOf(req.context.role) < required) {
      return sendError(res, 403, "You don't have permission to do this.");
    }
    next();
  };
}

/**
 * "owner OR minimum role" — Phase 2.5 §05's PATCH and DELETE rows.
 * The resource is loaded by the caller-supplied loader so this middleware
 * stays generic and never imports a Service directly.
 *
 * Workspace isolation is enforced here too: a resource belonging to another
 * workspace is reported as 404, not 403, so its existence is not disclosed
 * across a tenant boundary.
 */
export function requireOwnerOrRole(minimum, loadResource) {
  const required = ROLES.indexOf(minimum);
  if (required === -1) throw new Error(`Unknown role: ${minimum}`);

  return async (req, res, next) => {
    if (!req.context) return sendError(res, 401, "Authentication required.");

    let resource;
    try {
      resource = await loadResource(req);
    } catch {
      return sendError(res, 404, "Not found.");
    }
    if (!resource) return sendError(res, 404, "Not found.");

    if (resource.workspaceId && resource.workspaceId !== req.context.workspaceId) {
      return sendError(res, 404, "Not found.");
    }

    const isOwner = resource.ownerId && resource.ownerId === req.context.userId;
    const hasRole = ROLES.indexOf(req.context.role) >= required;
    if (!isOwner && !hasRole) {
      return sendError(res, 403, "You don't have permission to do this.");
    }

    next();
  };
}
