// =============================================================================
// Session middleware — Milestone M4, Application Layer (Phase 2.5 §02:
// "Application Layer... enforces Authentication on every call").
//
// Decision A: the session token travels as an HTTP-only SameSite cookie.
// Decision K: this middleware is the ONLY place an HTTP request is turned
// into a context object. Everything downstream receives
// { userId, workspaceId, role } and never the request itself.
//
// Additive by construction: it attaches req.context and calls next(). It
// rejects nothing on its own — requireAuth (authorization.js) decides what
// a missing context means for a given route, so mounting this middleware
// cannot by itself break an unprotected route.
// =============================================================================
import { authenticationService } from "../../domain/authentication-service.js";
import { workspaceRepository } from "../../storage/workspace-repository.js";
import { config } from "../../infrastructure/config.js";

export const SESSION_COOKIE = "nps_session";

/**
 * Local desktop auto-login (config.autoLoginLocalUser) — resolves to your
 * actual account (the first workspace's first member), so the app shows
 * your real presentations. Governed by config so it is impossible in
 * production, disableable via AUTO_LOGIN=0, and announced at boot.
 *
 * The resolved context is cached briefly (not forever): a null result must
 * not stick past first-boot user creation, and role changes should take
 * effect without a restart.
 */
let cachedLocalUserContext = null;
let cachedLocalUserContextAt = 0;
const LOCAL_CONTEXT_TTL_MS = 30_000;

async function resolveLocalUserContext() {
  const now = Date.now();
  if (cachedLocalUserContext !== null && now - cachedLocalUserContextAt < LOCAL_CONTEXT_TTL_MS) {
    return cachedLocalUserContext;
  }

  const workspace = await workspaceRepository.findAnyWorkspace();
  const member = workspace ? (await workspaceRepository.findMembers(workspace.id))[0] : null;

  cachedLocalUserContext = member
    ? Object.freeze({ userId: member.id, workspaceId: workspace.id, role: member.role })
    : null;
  cachedLocalUserContextAt = now;
  return cachedLocalUserContext;
}

/** Minimal cookie parsing — no new dependency (Decision A of M3). */
function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

export function setSessionCookie(res, token, expiresAt) {
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAt).toUTCString()}`,
  ];
  if (config.isProduction) attrs.push("Secure");
  res.append("Set-Cookie", attrs.join("; "));
}

export function clearSessionCookie(res) {
  const attrs = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (config.isProduction) attrs.push("Secure");
  res.append("Set-Cookie", attrs.join("; "));
}

export function getSessionToken(req) {
  return readCookie(req, SESSION_COOKIE);
}

/**
 * Resolves req.context from the session cookie. Never rejects — see the
 * module note above.
 */
export function sessionMiddleware() {
  return async (req, _res, next) => {
    // Decision H: the bypass is honored only when config already verified
    // BOTH conditions (NODE_ENV !== production AND AUTH_BYPASS=1).
    if (config.authBypass) {
      req.context = Object.freeze({
        userId: "dev-bypass-user",
        workspaceId: "dev-bypass-workspace",
        role: "admin",
        isBypass: true,
      });
      return next();
    }

    try {
      const token = getSessionToken(req);
      const context = await authenticationService.validateSession(token);
      req.context = context ? Object.freeze({ ...context }) : null;
    } catch {
      req.context = null;
    }

    // A real (non-production) cookie is always honored above, unchanged —
    // this only fills in when there's genuinely no valid session, e.g. the
    // ephemeral per-boot SESSION_SECRET invalidated it on restart.
    if (!req.context && config.autoLoginLocalUser) {
      req.context = await resolveLocalUserContext();
    }
    next();
  };
}
