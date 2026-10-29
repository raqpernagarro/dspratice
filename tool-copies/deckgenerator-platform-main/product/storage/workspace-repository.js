// =============================================================================
// Workspace Repository — Milestone M4, Storage Layer (Phase 2.5 §05).
//
// Owns exactly what Phase 2.5 §05 assigns: Workspace and User.
// Read: findById, findMembers, findUserByEmail. Write: insert, addMember.
//
// Phase 2.5 §05's own note is why this repository holds User but no
// credentials: "Credentials are handled entirely by the identity provider
// adapter (Infrastructure Layer)... Only the non-secret User profile lives
// in the Workspace Repository." Nothing in this file ever sees a password.
//
// AUDIT-M4-02 (documented gap, accepted): Phase 2.5 §07's storage contract
// enumerates twelve objects and User is not among them, so User has no
// declared immutable/mutable split. The split applied below is derived by
// direct analogy to §07's Workspace card and Phase 2 §05's User field list
// — id/workspaceId/createdAt immutable, name/email/role mutable — and is
// recorded here as an inference, not as something §07 states.
//
// Per Phase 2.5 Rule 13, immutable fields are ENFORCED here, not merely
// documented. Per the approved constraint "repository validation remains
// authoritative", these guards are the real ones — Services do not
// re-filter fields before calling (the M3 bug that came from doing exactly
// that is not repeated).
// =============================================================================
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR as USER_DATA_DIR } from "../infrastructure/user-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// User state lives outside the app folder so replacing/updating the app
// can never destroy someone's work — see infrastructure/user-data.js.
const DATA_DIR = USER_DATA_DIR;
const WORKSPACES_FILE = join(DATA_DIR, "workspaces.json");
const USERS_FILE = join(DATA_DIR, "users.json");


/** Decision E — hierarchical: member < editor < admin. */
export const ROLES = ["member", "editor", "admin"];

async function readFileOrEmpty(path) {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return [];
  }
}

async function writeRecords(path, records) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(records, null, 2) + "\n", "utf8");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export class WorkspaceRepository {
  // ------------------------------------------------------------ workspace --
  async findById(id) {
    const all = await readFileOrEmpty(WORKSPACES_FILE);
    const found = all.find((w) => w.id === id) || null;
    return found ? structuredClone(found) : null;
  }

  async findAnyWorkspace() {
    const all = await readFileOrEmpty(WORKSPACES_FILE);
    return all.length ? structuredClone(all[0]) : null;
  }

  async insert(data) {
    if (!data || typeof data.name !== "string" || !data.name.trim()) {
      throw new Error("Workspace.name is required.");
    }
    const all = await readFileOrEmpty(WORKSPACES_FILE);
    const record = {
      id: randomUUID(),
      name: data.name.trim(),
      plan: data.plan ?? "local",
      defaultTemplatePackId: data.defaultTemplatePackId ?? null,
      createdAt: new Date().toISOString(),
    };
    all.push(record);
    await writeRecords(WORKSPACES_FILE, all);
    return structuredClone(record);
  }

  // update()/updateMember()/removeMember() were removed as dead code: no
  // caller existed anywhere, and removeMember additionally orphaned the
  // member's credential and live sessions (no cleanup path exists yet).
  // When member management is built, implement it at the service layer with
  // credential + session cleanup in the same operation.

  // ----------------------------------------------------------------- user --
  async findMembers(workspaceId) {
    const all = await readFileOrEmpty(USERS_FILE);
    return all.filter((u) => u.workspaceId === workspaceId).map((u) => structuredClone(u));
  }

  async findUserById(id) {
    const all = await readFileOrEmpty(USERS_FILE);
    const found = all.find((u) => u.id === id) || null;
    return found ? structuredClone(found) : null;
  }

  async findUserByEmail(email) {
    const all = await readFileOrEmpty(USERS_FILE);
    const found = all.find((u) => u.email === normalizeEmail(email)) || null;
    return found ? structuredClone(found) : null;
  }

  async addMember({ name, email, role, workspaceId }) {
    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error("User.email is required.");
    if (!workspaceId) throw new Error("User.workspaceId is required.");
    if (!ROLES.includes(role)) {
      throw new Error(`User.role must be one of: ${ROLES.join(", ")}.`);
    }

    const all = await readFileOrEmpty(USERS_FILE);
    if (all.some((u) => u.email === normalized)) {
      throw new Error(`A user with email ${normalized} already exists.`);
    }

    const record = {
      id: randomUUID(),
      name: (name || "").trim() || normalized,
      email: normalized,
      role,
      workspaceId,
      createdAt: new Date().toISOString(),
    };
    all.push(record);
    await writeRecords(USERS_FILE, all);
    return structuredClone(record);
  }

}

export const workspaceRepository = new WorkspaceRepository();
