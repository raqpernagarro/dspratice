// =============================================================================
// Session guard — Milestone M5, UI Layer.
//
// Phase 3 §02: an unauthenticated visit to any protected screen redirects to
// Authentication, and returns to the originally requested page on success.
// Phase 3 §11: an expired session shows "Please sign in again" and preserves
// in-progress state where possible.
//
// The session cookie is HTTP-only (M4, Decision A), so the UI cannot read it
// directly — it asks the API instead. That is the intended posture: no
// script can see the token.
// =============================================================================
import { api, ApiError } from "./api.js";

const LOGIN_PAGE = "login.html";

/** Where to return to after a successful sign-in. */
export function rememberIntendedDestination() {
  const here = location.pathname + location.search;
  sessionStorage.setItem("nps_return_to", here);
}

export function consumeIntendedDestination() {
  const target = sessionStorage.getItem("nps_return_to");
  sessionStorage.removeItem("nps_return_to");
  return target;
}

/**
 * Resolve the current session, or redirect to Authentication.
 * @returns {Promise<{user, workspace}|null>} null once a redirect has begun.
 */
export async function requireSession() {
  try {
    return await api.session();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      rememberIntendedDestination();
      location.replace(LOGIN_PAGE);
      return null;
    }
    // Anything else (API down, network) used to reject out of every page's
    // un-caught boot(), leaving the screen on its skeleton forever. Render a
    // recoverable error state here instead — no page needs its own copy.
    renderBootError(err);
    return null;
  }
}

function renderBootError(err) {
  const main = document.querySelector("main") || document.body;
  const box = document.createElement("div");
  box.className = "boot-error";
  box.setAttribute("role", "alert");
  box.innerHTML = `
    <div style="max-width:420px;margin:18vh auto 0;text-align:center;font-family:inherit">
      <h1 style="font-size:20px;font-weight:500;margin-bottom:8px">Can't reach the server</h1>
      <p style="opacity:.7;margin-bottom:20px">${
        err instanceof ApiError && err.status === 0
          ? "The API isn't responding. Make sure it's running, then try again."
          : "Something went wrong while loading your session."
      }</p>
      <button type="button" style="padding:10px 22px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer"
              onclick="location.reload()">Try again</button>
    </div>`;
  main.replaceChildren(box);
}

export async function signOut() {
  try {
    await api.logout();
  } catch {
    /* Signing out locally must succeed even if the call fails. */
  }
  location.replace(LOGIN_PAGE);
}
