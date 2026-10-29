// =============================================================================
// Authentication screen — Milestone M5, UI Layer (Phase 3 §04, Phase 5 §10).
//
// Phase 3 §04's states, implemented literally:
//   Loading — inline spinner on the sign-in button; the form is disabled to
//             prevent double-submit.
//   Error   — invalid credentials show an inline message that never reveals
//             which field was wrong. The API already returns one
//             non-specific message for every failure mode (M4), so the UI
//             simply displays what it is given rather than elaborating.
//   Success — immediate redirect, no intermediate confirmation screen.
// =============================================================================
import { api, ApiError } from "./lib/api.js";
import { consumeIntendedDestination } from "./lib/session.js";
import { NAGARRO_LOGO } from "/js/logo.js";

document.getElementById("brand").innerHTML = NAGARRO_LOGO;

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit");
const banner = document.getElementById("banner");

const HOME_PAGE = "index.html";

function showError(message) {
  banner.className = "banner banner--error";
  banner.setAttribute("role", "alert");
  banner.textContent = message;
  banner.hidden = false;
}

function clearError() {
  banner.hidden = true;
  banner.textContent = "";
}

function setBusy(busy) {
  submitBtn.disabled = busy;
  emailInput.disabled = busy;
  passwordInput.disabled = busy;
  submitBtn.innerHTML = busy
    ? '<span class="spinner" aria-hidden="true"></span>Signing in…'
    : "Sign in";
}

// If a session already exists, don't make the user sign in again.
api.session()
  .then(() => location.replace(consumeIntendedDestination() || HOME_PAGE))
  .catch(() => { /* no session — stay on this screen, as expected */ });

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Client-side check only guards against an empty submit. It deliberately
  // does not validate the email's shape: a "that's not a valid email"
  // message would disclose more about the attempt than the server does.
  if (!email || !password) {
    showError("Enter your email and password.");
    return;
  }

  setBusy(true);
  try {
    await api.login(email, password);
    location.replace(consumeIntendedDestination() || HOME_PAGE);
  } catch (err) {
    setBusy(false);
    passwordInput.value = "";
    if (err instanceof ApiError && err.status === 401) {
      showError(err.message); // the API's own non-specific message
    } else if (err instanceof ApiError && err.status === 0) {
      showError(err.message); // network — Phase 3 §11
    } else {
      showError("Something went wrong. Please try again.");
    }
    passwordInput.focus();
  }
});
