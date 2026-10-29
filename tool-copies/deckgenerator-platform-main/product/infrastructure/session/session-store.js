// =============================================================================
// Session store — Milestone M4, Infrastructure Layer.
//
// Phase 2.5 §06 assigns Authentication's persistence to "a session store
// (Infrastructure), NOT the Workspace Repository". This module is that
// store, and it is deliberately not a Repository: it is never registered
// alongside product/storage, and no Service calls it directly — only the
// Authentication Service does, through its own interface.
//
// Decision B: file-backed, so sessions survive a dev-server restart.
// Decision J: 8-hour absolute lifetime, no sliding renewal — a session's
// expiresAt is fixed at issue time and never extended.
// =============================================================================
import { randomBytes, createHmac } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { DATA_DIR as USER_DATA_DIR } from "../user-data.js";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Outside the app folder — see infrastructure/user-data.js.
const DATA_DIR = USER_DATA_DIR;
const SESSIONS_FILE = join(DATA_DIR, "sessions.json");

async function readSessions() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(SESSIONS_FILE)) return [];
  try {
    return JSON.parse(await readFile(SESSIONS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeSessions(records) {
  await mkdir(DATA_DIR, { recursive: true });
  // Atomic tmp+rename so a crash mid-write can't truncate the file, and an
  // explicit mode as an options object — fs.promises.writeFile takes only
  // three arguments, so a trailing { mode } after "utf8" is silently ignored.
  const tmp = `${SESSIONS_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(records, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  await rename(tmp, SESSIONS_FILE);
}

/** Serializes read-modify-write cycles so concurrent logins/logouts can't
 * drop each other's sessions. */
let opQueue = Promise.resolve();
function serialize(fn) {
  const result = opQueue.then(fn);
  opQueue = result.then(() => {}, () => {});
  return result;
}

/**
 * The stored token is a hash, never the raw value — a leaked sessions file
 * then cannot be replayed as a live session.
 */
function hashToken(token) {
  return createHmac("sha256", config.sessionSecret).update(token).digest("hex");
}

function isExpired(session) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

export const sessionStore = {
  /** @returns {{token: string, expiresAt: string}} — the RAW token, returned once. */
  async create({ userId, workspaceId, role }) {
    const token = randomBytes(32).toString("hex");
    const now = Date.now();
    const session = {
      tokenHash: hashToken(token),
      userId,
      workspaceId,
      role,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + config.sessionLifetimeMs).toISOString(),
    };

    await serialize(async () => {
      const all = (await readSessions()).filter((s) => !isExpired(s));
      all.push(session);
      await writeSessions(all);
    });

    return { token, expiresAt: session.expiresAt };
  },

  /** @returns {{userId, workspaceId, role}|null} */
  async validate(token) {
    if (!token) return null;
    const all = await readSessions();
    const session = all.find((s) => s.tokenHash === hashToken(token));
    if (!session || isExpired(session)) return null;
    return { userId: session.userId, workspaceId: session.workspaceId, role: session.role };
  },

  async destroy(token) {
    if (!token) return false;
    return serialize(async () => {
      const all = await readSessions();
      const target = hashToken(token);
      const next = all.filter((s) => s.tokenHash !== target && !isExpired(s));
      const removed = next.length !== all.filter((s) => !isExpired(s)).length;
      await writeSessions(next);
      return removed;
    });
  },
};
