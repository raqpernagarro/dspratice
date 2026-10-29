// =============================================================================
// Local identity provider — Milestone M4, Infrastructure Layer
// (Phase 2 §02: "an identity provider (local for the prototype stage, real
// SSO later)"; Phase 2.5 §05: "Credentials are handled entirely by the
// identity provider adapter (Infrastructure Layer)").
//
// Decision C: credential records live HERE, in their own file, completely
// separate from the User profile in the Workspace Repository. That
// separation is not a stylistic choice — Phase 2.5 §05 states it as a
// deliberate, security-driven exception to the usual "one repository owns
// the entity" rule, which is why no Authentication Repository exists.
//
// Hashing is Node's built-in crypto.scrypt (memory-hard, no new
// dependency). Verification is constant-time via timingSafeEqual.
//
// This module knows about credentials and nothing else. It has no idea what
// a Presentation is, never touches the Workspace Repository, and returns
// only a boolean or an email — never a User object. Swapping it for real
// SSO later replaces this file alone.
// =============================================================================
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { CREDENTIALS_DIR as USER_CREDENTIALS_DIR } from "../user-data.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scrypt = promisify(scryptCb);

const __dirname = dirname(fileURLToPath(import.meta.url));
// Credentials deliberately do NOT live in product/data alongside domain
// records — they are Infrastructure-owned secrets, not product data.
// Outside the app folder — see infrastructure/user-data.js.
const CREDENTIALS_DIR = USER_CREDENTIALS_DIR;
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, "credentials.json");

const KEY_LENGTH = 64;

async function readCredentials() {
  await mkdir(CREDENTIALS_DIR, { recursive: true });
  if (!existsSync(CREDENTIALS_FILE)) return [];
  try {
    return JSON.parse(await readFile(CREDENTIALS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeCredentials(records) {
  await mkdir(CREDENTIALS_DIR, { recursive: true });
  // Atomic tmp+rename; mode passed as an options object (a 4th argument
  // after "utf8" is silently discarded by fs.promises.writeFile).
  const tmp = `${CREDENTIALS_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(records, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  await rename(tmp, CREDENTIALS_FILE);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// Explicit scrypt cost — Node's defaults (N=16384) are below current
// guidance. Existing hashes were produced with the defaults, so records
// carry a `params` marker: absent means legacy defaults, and verify() uses
// whichever the record was written with (a login transparently still works;
// setCredential always writes the strong parameters).
const SCRYPT_PARAMS = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

async function hashPassword(password, salt, params) {
  const derived = await scrypt(password, salt, KEY_LENGTH, params || {});
  return derived.toString("hex");
}

export const localIdentityProvider = {
  /**
   * Store a credential for an email. Used only by the bootstrap CLI
   * (Decision D) — never exposed over HTTP, since no registration endpoint
   * exists anywhere in Phase 2.5 §05.
   */
  async setCredential(email, password) {
    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error("email is required.");
    if (typeof password !== "string" || password.length < 8) {
      throw new Error("password must be at least 8 characters.");
    }

    const salt = randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(password, salt, SCRYPT_PARAMS);

    const all = await readCredentials();
    const existing = all.findIndex((c) => c.email === normalized);
    const record = { email: normalized, salt, passwordHash, params: SCRYPT_PARAMS };
    if (existing === -1) all.push(record);
    else all[existing] = record;

    await writeCredentials(all);
    return { email: normalized };
  },

  /**
   * Verify a password. Returns the normalized email on success, null on
   * failure — deliberately never distinguishing "unknown email" from
   * "wrong password", so the caller cannot leak which one was wrong
   * (Phase 3 §04: "never revealing which field specifically was wrong").
   */
  async verify(email, password) {
    const normalized = normalizeEmail(email);
    const all = await readCredentials();
    const record = all.find((c) => c.email === normalized);

    if (!record) {
      // Spend comparable work on an unknown email so response timing does
      // not reveal whether the account exists. A random salt each time —
      // a fixed decoy salt made the equalization imperfect.
      await hashPassword(String(password || ""), randomBytes(16).toString("hex"), SCRYPT_PARAMS);
      return null;
    }

    const candidate = await hashPassword(String(password || ""), record.salt, record.params);
    const a = Buffer.from(candidate, "hex");
    const b = Buffer.from(record.passwordHash, "hex");
    if (a.length !== b.length) return null;
    return timingSafeEqual(a, b) ? normalized : null;
  },
};
