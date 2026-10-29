// =============================================================================
// Authentication routes — Milestone M4, Application Layer.
//
// Exactly the three endpoints Phase 2.5 §05 defines, no more:
//   POST /api/auth/login    public        → session token, User  (401 invalid)
//   POST /api/auth/logout   authenticated → 204
//   GET  /api/auth/session  authenticated → current User + Workspace (401)
//
// No registration endpoint exists here, deliberately: Phase 2.5 §05 defines
// none, and adding one would be an unauthenticated user-creation route,
// which Phase 4 §12 Rule 29 forbids. Users are created only by the
// bootstrap CLI (Decision D).
// =============================================================================
import { Router } from "express";
import {
  authenticationService,
  InvalidCredentialsError,
  SessionExpiredError,
} from "../../domain/authentication-service.js";
import { requireAuth } from "../middleware/authorization.js";
import { setSessionCookie, clearSessionCookie, getSessionToken } from "../middleware/session.js";

export const authRouter = Router();

function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

/* In-process login throttle: after MAX_ATTEMPTS consecutive failures, further
 * attempts for that account are rejected until the window expires. Counters
 * reset on a successful sign-in. In-memory is the right scope — one process
 * serves every login.
 *
 * Keyed on IP **and** email together, not on either alone. It used to check
 * both separately, which made ten wrong passwords for one account return 429
 * to EVERY user on the machine: a shared host, or anything behind a proxy where
 * all requests carry one address, could be locked out by a single person
 * mistyping. And because counters only reset on a successful login — impossible
 * while throttled — it was a hard fifteen-minute wall with no way out.
 *
 * The composite key still slows an attacker guessing one account's password
 * from one source, which is what this defends, without letting them deny
 * service to anyone else. */
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginFailures = new Map(); // key -> { count, firstAt }

function loginThrottled(key) {
  const entry = loginFailures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > LOGIN_WINDOW_MS) { loginFailures.delete(key); return false; }
  return entry.count >= LOGIN_MAX_ATTEMPTS;
}
function recordLoginFailure(key) {
  const now = Date.now();
  const entry = loginFailures.get(key);
  if (!entry || now - entry.firstAt > LOGIN_WINDOW_MS) loginFailures.set(key, { count: 1, firstAt: now });
  else entry.count++;
  if (loginFailures.size > 10_000) loginFailures.clear(); // memory backstop
}

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    // Same non-specific message as a genuine credential failure, so a
    // missing field cannot be used to probe which accounts exist.
    return sendError(res, 401, "Invalid email or password.");
  }

  const keys = [`${req.ip}|${String(email).trim().toLowerCase()}`];
  if (keys.some(loginThrottled)) {
    return sendError(res, 429, "Too many sign-in attempts. Try again in a few minutes.");
  }

  try {
    const { token, expiresAt, user, workspace } = await authenticationService.login(email, password);
    keys.forEach((k) => loginFailures.delete(k));
    setSessionCookie(res, token, expiresAt);
    res.json({ user, workspace, expiresAt });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      keys.forEach(recordLoginFailure);
      return sendError(res, 401, err.message);
    }
    sendError(res, 500, "Could not sign in.");
  }
});

authRouter.post("/logout", requireAuth(), async (req, res) => {
  try {
    await authenticationService.logout(getSessionToken(req));
  } catch {
    // The cookie is cleared regardless — a failed store write must not
    // leave the browser signed in.
  }
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get("/session", requireAuth(), async (req, res) => {
  try {
    const { user, workspace } = await authenticationService.getCurrentUser(req.context);
    res.json({ user, workspace });
  } catch (err) {
    if (err instanceof SessionExpiredError) return sendError(res, 401, err.message);
    sendError(res, 500, "Could not read the session.");
  }
});
