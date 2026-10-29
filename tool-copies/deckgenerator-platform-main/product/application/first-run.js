// product/application/first-run.js
// =============================================================================
// First-run bootstrap for a local install.
//
// The problem this solves: `product/data/` is machine-local and deliberately
// not in the repository, so a freshly cloned copy has no workspace and no
// user. Local auto-login resolves to "the first workspace's first member"
// (middleware/session.js), which on a fresh clone is nobody — so every API
// call returned 401 and the app was unusable until someone found and ran
// `npm run auth:create-user`. For a tool colleagues are meant to unzip and
// run, that is a dead end at the very first click.
//
// So: if there is genuinely no workspace yet, create one with a single local
// member. This ONLY ever fires when the store is empty, so it can never
// touch, overwrite, or duplicate an existing setup.
//
// Deliberately NOT a registration endpoint: it is not reachable over HTTP, it
// takes no user input, and it creates no credential — the member it makes can
// be used by local auto-login but cannot be signed into with a password.
// Anyone wanting a real password account still runs `npm run auth:create-user`
// (which, finding a workspace already present, simply joins it).
// =============================================================================
import { workspaceRepository } from "../storage/workspace-repository.js";
import { config } from "../infrastructure/config.js";

const DEFAULT_WORKSPACE = "My Workspace";
const DEFAULT_MEMBER = { name: "You", email: "local@localhost" };

/**
 * Ensures a usable local identity exists. Returns a short description of what
 * happened so the caller can log it, or null when nothing was needed.
 *
 * @returns {Promise<{workspace: string, member: string} | null>}
 */
export async function ensureFirstRunWorkspace() {
  // Never auto-provision an identity on a real deployment — there, accounts
  // are created deliberately and a silently-created admin would be a hole.
  if (config.isProduction) return null;

  const existing = await workspaceRepository.findAnyWorkspace();
  if (existing) {
    // A workspace with zero members is the one other way auto-login lands on
    // nobody (e.g. the users file was cleared by hand). Repair that too.
    const members = await workspaceRepository.findMembers(existing.id);
    if (members.length) return null;
    const member = await workspaceRepository.addMember({
      ...DEFAULT_MEMBER,
      role: "admin",
      workspaceId: existing.id,
    });
    return { workspace: existing.name, member: member.email };
  }

  const workspace = await workspaceRepository.insert({ name: DEFAULT_WORKSPACE });
  // First member of a new workspace is an admin — a workspace nobody can
  // administer is not a useful starting state.
  const member = await workspaceRepository.addMember({
    ...DEFAULT_MEMBER,
    role: "admin",
    workspaceId: workspace.id,
  });
  return { workspace: workspace.name, member: member.email };
}
