// =============================================================================
// Authentication Service — Milestone M4, Domain Layer (Phase 2.5 §04).
//
// Public methods, exactly as §04 specifies: login, logout, validateSession,
// getCurrentUser. Nothing added.
//
// State owned: active sessions (via the Infrastructure session store).
// State never owned: "Workspace/Presentation content of any kind" — this
// file never imports the Presentation Repository or Presentation Service.
//
// Phase 2.5 §05's "must never bypass" note explicitly permits this Service
// to call the Workspace Repository directly for User lookups, which is what
// login does. Credentials are never handled here — they belong entirely to
// the Infrastructure identity provider (Phase 2.5 §05's security-driven
// exception), so this Service asks "is this password valid?" and receives
// only a boolean-equivalent answer.
//
// Decision K: this Service returns a plain, immutable context object. It
// never receives or returns an HTTP request/response — that boundary
// belongs to the Application Layer's middleware.
// =============================================================================
import { localIdentityProvider } from "../infrastructure/identity/local-identity-provider.js";
import { sessionStore } from "../infrastructure/session/session-store.js";
import { workspaceRepository } from "../storage/workspace-repository.js";

export class InvalidCredentialsError extends Error {
  constructor() {
    // Deliberately non-specific — Phase 3 §04 requires that an invalid
    // login "never reveal which field specifically was wrong".
    super("Invalid email or password.");
    this.name = "InvalidCredentialsError";
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "SessionExpiredError";
  }
}

class AuthenticationService {
  /**
   * @returns {{token, expiresAt, user, workspace}}
   * @throws {InvalidCredentialsError}
   */
  async login(email, password) {
    const verifiedEmail = await localIdentityProvider.verify(email, password);
    if (!verifiedEmail) throw new InvalidCredentialsError();

    const user = await workspaceRepository.findUserByEmail(verifiedEmail);
    if (!user) {
      // A credential exists with no matching User profile. Treated as a
      // failed login rather than a 500: the caller learns nothing about
      // which half of the pair was missing.
      throw new InvalidCredentialsError();
    }

    const { token, expiresAt } = await sessionStore.create({
      userId: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
    });

    const workspace = await workspaceRepository.findById(user.workspaceId);
    return { token, expiresAt, user, workspace };
  }

  async logout(token) {
    return sessionStore.destroy(token);
  }

  /**
   * @returns {{userId, workspaceId, role}|null} the request context
   *   (Decision K). Null means no valid session — the Application Layer
   *   decides what that means for a given route.
   */
  async validateSession(token) {
    return sessionStore.validate(token);
  }

  /** @returns {{user, workspace}} for GET /api/auth/session. */
  async getCurrentUser(context) {
    if (!context) throw new SessionExpiredError();
    const user = await workspaceRepository.findUserById(context.userId);
    if (!user) throw new SessionExpiredError();
    const workspace = await workspaceRepository.findById(context.workspaceId);
    return { user, workspace };
  }
}

export const authenticationService = new AuthenticationService();
