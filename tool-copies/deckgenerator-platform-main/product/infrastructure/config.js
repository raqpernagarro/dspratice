// =============================================================================
// Configuration — Milestone M4, Infrastructure Layer (Phase 2.5 §02).
//
// Decision G: environment variables, read once at startup. The session
// secret has no default; the server refuses to boot without one, except in
// explicit local-development mode where an ephemeral per-boot secret is
// generated (so a forgotten secret can never silently become a known-weak
// shared constant).
//
// Decision H: the local-development authentication bypass requires BOTH
// NODE_ENV !== "production" AND AUTH_BYPASS=1. Two independent conditions,
// off by default, with a prominent warning — Phase 4 §08 requires the flag
// to exist; Phase 4 §12 Rule 29 requires it to be impossible to enable by
// accident outside local development.
// =============================================================================
import { randomBytes } from "node:crypto";

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

function resolveSessionSecret() {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  if (IS_PRODUCTION) {
    throw new Error(
      "SESSION_SECRET is required when NODE_ENV=production. Refusing to start."
    );
  }
  // Local development only: ephemeral, regenerated every boot. Sessions do
  // not survive a restart in this mode, which is correct — a dev secret
  // must never become a stable, guessable value.
  return randomBytes(32).toString("hex");
}

function resolvePort() {
  if (!process.env.PORT) return 4600;
  const n = parseInt(process.env.PORT, 10);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535 (got "${process.env.PORT}").`);
  }
  return n;
}

export const config = {
  nodeEnv: NODE_ENV,
  isProduction: IS_PRODUCTION,
  port: resolvePort(),
  sessionSecret: resolveSessionSecret(),
  sessionSecretIsEphemeral: !process.env.SESSION_SECRET,

  /** Decision J — 8-hour absolute lifetime, no sliding renewal. */
  sessionLifetimeMs: 8 * 60 * 60 * 1000,

  /** Decision I — CORS must name an explicit origin once credentials are
   * in play; "*" is invalid alongside Access-Control-Allow-Credentials. */
  allowedOrigin: process.env.ALLOWED_ORIGIN || "http://localhost:4599",

  /** Decision H — both conditions required. */
  authBypass: !IS_PRODUCTION && process.env.AUTH_BYPASS === "1",

  /** Local desktop convenience: with no valid session, requests resolve to
   * the first workspace's first member. Never available in production.
   * Disable with AUTO_LOGIN=0 to require the login screen locally. */
  autoLoginLocalUser: !IS_PRODUCTION && process.env.AUTO_LOGIN !== "0",
};

/** Printed at boot so an enabled bypass is never quiet. */
export function warnIfInsecure() {
  if (config.authBypass) {
    console.warn("\n" + "!".repeat(72));
    console.warn("!!  AUTH BYPASS IS ENABLED — every request runs as a synthetic admin.");
    console.warn("!!  This is a local-development affordance only (Phase 4 §08).");
    console.warn("!!  Unset AUTH_BYPASS to restore real authentication.");
    console.warn("!".repeat(72) + "\n");
  }
  /* Auto-login is only safe because the server binds to loopback. Said
   * together, because separately each sounds harmless and combined they mean
   * "anyone who can reach the port is an admin". */
  const exposed = Boolean(process.env.NPS_HOST) && process.env.NPS_HOST !== "127.0.0.1" && process.env.NPS_HOST !== "localhost";
  if (exposed && config.autoLoginLocalUser) {
    console.warn("\n" + "!".repeat(72));
    console.warn("!!  NPS_HOST is set AND auto-login is on.");
    console.warn("!!  Anyone who can reach this port is an admin, with no password.");
    console.warn("!!  Set AUTO_LOGIN=0, or unset NPS_HOST to stay on this machine.");
    console.warn("!".repeat(72) + "\n");
  } else if (exposed) {
    console.warn(`Note: NPS_HOST=${process.env.NPS_HOST} — reachable from other machines.\n`);
  } else if (config.autoLoginLocalUser) {
    console.warn("Note: AUTO-LOGIN is on — requests without a session run as the first");
    console.warn("      workspace's first member. Safe because the server is loopback-only.");
    console.warn("      Set AUTO_LOGIN=0 to require the login screen.\n");
  }
  if (config.sessionSecretIsEphemeral && !config.isProduction) {
    console.warn("Note: SESSION_SECRET not set — using an ephemeral per-boot secret.");
    console.warn("      Sessions will not survive a server restart.\n");
  }
}
