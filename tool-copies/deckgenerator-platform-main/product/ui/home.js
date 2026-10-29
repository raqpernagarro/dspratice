// =============================================================================
// Create — one composer, one uninterrupted flow.
//
// Behaviour (unchanged since iteration 2): nothing is created until Generate.
//   Attach → the file is STAGED on the composer as an inline chip. No
//            request sent, nothing imported yet.
//   Generate → the single commit point:
//                file staged → POST /api/presentations/import
//                prompt only → the coach form (coach.js) → POST /api/generations
//                              (background) → wait for the draft → …/approve
//   Success → navigate straight to the presentation.
//   Failure → composer stays put; the button becomes Retry.
//
// Iteration 4 strips the composer down further: "+" opens the OS file
// picker directly (upload is the only supported action, so a menu was
// friction for one item), the staged file renders as a compact chip inline
// next to "+" rather than a separate row, and the Claude CLI status readout
// is gone — the composer is scoped to creating presentations, not surfacing
// provider plumbing.
// =============================================================================
import { api } from "./lib/api.js";
import { createCoach } from "./coach.js";
import { mountGuide } from "./guide.js";
import { mountIntro, mountStarters } from "./starters.js";
import { stageStates } from "./lib/build-stages.js";
import { approveAndWait, draftAndWait } from "./lib/deck-build.js";
import { requireSession } from "./lib/session.js";
import { mountAppShell, loadRecents, setWorkspaceOpener, setHomeAction } from "./lib/app-shell.js";
import {
  mountWorkspace, openWorkspace, closeWorkspace, isWorkspaceOpen, prepareWorkspace,
  wireDeleteModal,
} from "./lib/workspace.js";

/**
 * Phase 4 §02's M5 rollback strategy: "Feature-flag 'Generate' off; Home
 * degrades to a static landing message." Set to false and reload.
 */
const CREATE_ENABLED = true;

const COMPOSER_MAX_H = 260;

/** How recently a presentation must have been touched to steer the greeting. */
const RECENT_WORK_MS = 45 * 60 * 1000;

const MAX_IMPORT_BYTES = 200 * 1024 * 1024;

const form = document.getElementById("create-form");
const promptInput = document.getElementById("prompt");
const submitBtn = document.getElementById("create-submit");
const submitLabel = document.getElementById("create-submit-label");
const errorEl = document.getElementById("composer-error");
const titleEl = document.getElementById("create-title");
const attachmentChip = document.getElementById("composer-attachments");
const attachmentName = document.getElementById("attachment-name");
const attachmentRemove = document.getElementById("attachment-remove");
const brandImagesToggle = document.getElementById("attachment-brand-images");
const attachBtn = document.getElementById("attach-btn");
const uploadInput = document.getElementById("upload-pptx-input");
const buildViewEl = document.getElementById("build-view");
const buildStagesEl = document.getElementById("build-stages");

mountGuide({
  link: document.getElementById("guide-link"),
  panel: document.getElementById("guide-panel"),
  promptInput,
});
mountIntro({ root: document.getElementById("intro"), promptInput });
const startersEl = document.getElementById("starters");
mountStarters({ list: startersEl, promptInput });

/** The staged .pptx. Purely client-side until Generate is pressed. */
let attachedFile = null;
let busy = false;

/* ---- Boot ----------------------------------------------------------------- */
(async function boot() {
  // A deep link (`?id=…`) means the destination is a document, not Create.
  // The shell's DOM work is synchronous — only its recents request is async —
  // so building it and the workspace BEFORE the awaited session check lets the
  // document surface paint straight away instead of after two round trips.
  // Nothing here fetches; the real load still happens after auth below.
  const deepLinkId = new URLSearchParams(location.search).get("id");
  const recentsPromise = mountAppShell({ current: "home" });
  mountWorkspace(document.querySelector(".shell__main"), { onClose: restoreCreate });
  if (deepLinkId) prepareWorkspace();

  const session = await requireSession();
  if (!session) return;

  // The rail's own request is reused for the greeting — one call, not two.
  setGreeting(chooseGreeting(await recentsPromise));

  wireDeleteModal();
  // The rail opens presentations in place instead of navigating to them.
  // Opening a deck closes the coach, so Esc and late answers belong to the workspace.
  setWorkspaceOpener((id) => { closeCoach(); return openWorkspace(id); });
  // …and "New Presentation" returns to the blank composer in place, rather
  // than reloading the page it is already on. A typed draft is never
  // discarded — the row's job is to surface the composer, not to erase work.
  setHomeAction(() => {
    if (isWorkspaceOpen()) closeWorkspace();
    promptInput.focus();
  });
  // Archive/delete/duplicate from inside the workspace must be reflected in
  // the rail without a reload.
  document.addEventListener("workspace:changed", () => loadRecents());

  if (!CREATE_ENABLED) {
    document.querySelector(".composer-wrap").innerHTML =
      '<p class="hint">Creating presentations is temporarily unavailable.</p>';
    return;
  }

  autoGrow();
  await routeFromUrl({ push: false });
  if (!isWorkspaceOpen()) promptInput.focus({ preventScroll: true }); // the page opens at the top: greeting, then the opening message
})();

/* ---- Routing --------------------------------------------------------------
   `?id=` is the only piece of state. Back/forward replay it, so the workspace
   behaves like a real application surface rather than a modal that traps you. */
async function routeFromUrl({ push }) {
  const id = new URLSearchParams(location.search).get("id");
  if (id) { closeCoach(); await openWorkspace(id, { push }); }
  else if (isWorkspaceOpen()) closeWorkspace({ push: false });
}

window.addEventListener("popstate", () => { routeFromUrl({ push: false }); });

/** Returns the Create view to its resting state after the workspace closes. */
function restoreCreate() {
  document.title = "Create — Nagarro Presentations";
  promptInput.focus({ preventScroll: true });
}

/* ---- Greeting --------------------------------------------------------------
   Deterministic and layered: state of the workspace first (it's the more
   specific signal), time of day as the fallback. Nothing random — the same
   context always produces the same line, so the page doesn't feel like it's
   guessing. Rendered into reserved height and faded in, so resolving it
   never flashes or shifts the composer. */
export function chooseGreeting(recents = [], now = new Date()) {
  if (recents.length === 0) return "Let's build your first presentation.";

  const latest = recents.reduce((newest, p) =>
    new Date(p.updatedAt) > new Date(newest.updatedAt) ? p : newest
  );
  const sinceLatest = now.getTime() - new Date(latest.updatedAt).getTime();

  if (sinceLatest >= 0 && sinceLatest < RECENT_WORK_MS) {
    // "Generated" is set only by the AI approval path; an imported or
    // hand-made deck lands as "Ready".
    return latest.status === "Generated"
      ? "What would you like to build next?"
      : "Continue working on your presentation.";
  }

  const hour = now.getHours();
  if (hour >= 23 || hour < 5) return "Working late?";
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

function setGreeting(text) {
  titleEl.textContent = text;
  // Flush layout so the transition has a start value, rather than waiting on
  // requestAnimationFrame — rAF callbacks don't run while a tab is
  // backgrounded, which would leave the greeting permanently invisible for
  // anyone who opens the app in a background tab.
  void titleEl.offsetHeight;
  titleEl.classList.add("is-ready");
}

/* ---- Composer state ------------------------------------------------------- */
function autoGrow() {
  promptInput.style.height = "auto";
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, COMPOSER_MAX_H)}px`;
}

/** Generate is live when there is anything to act on — a prompt OR a file. */
function syncSubmitState() {
  const hasInput = promptInput.value.trim().length > 0 || attachedFile !== null;
  submitBtn.disabled = busy || !hasInput;
}

function clearError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
  delete errorEl.dataset.tone;
  submitLabel.textContent = "Generate";
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  errorEl.dataset.tone = "error";
  submitLabel.textContent = "Retry"; // the button carries the retry affordance
}

function setBusy(isBusy, label) {
  busy = isBusy;
  promptInput.disabled = isBusy;
  attachBtn.disabled = isBusy;
  attachmentRemove.disabled = isBusy;
  if (brandImagesToggle) brandImagesToggle.disabled = isBusy;
  submitBtn.classList.toggle("is-busy", isBusy);
  /* Restore the label when the work ends, not only set it when it starts.
   * Handing control back at the outline step left the button reading
   * "Generating…" over an outline that was plainly finished. */
  submitLabel.textContent = isBusy ? label : "Generate";
  syncSubmitState();
}

/* ---- Prompt starters --------------------------------------------------------
   The pills above the composer (product/ui/starters.js). A staged .pptx is
   imported, not prompted, so they hide while one is attached. */
function syncStarters() {
  startersEl.hidden = attachedFile !== null;
}

/* ---- Coach v2 — the question form at every Generate --------------------------
   product/ui/coach.js owns the form; here it is only opened and handed the
   result. The form opens on every prompt-path Generate, never blocks (Skip,
   "Generate now", Esc), and its answers go to the generation as their own
   fields — content answers also folded into the prompt (assembleBrief). */
const coach = createCoach(document.getElementById("coach"), {
  onGenerate: (brief, fields, prompt) => runGeneration(brief, fields, prompt),
  onClose: () => promptInput.focus(),
});
const closeCoach = () => coach.close({ restoreFocus: false });

// Editing the prompt closes the form (as v1 did): its questions and the brief
// it would send were built from the prompt as it was at Generate, so an edit
// makes them stale. Generate again reopens it for the new text.
promptInput.addEventListener("input", () => {
  lastCoached = null;
  closeCoach();
  clearError();
  syncSubmitState();
  autoGrow();
});

promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!submitBtn.disabled) form.requestSubmit();
  }
});

/* ---- Attachment (staged, not imported) ------------------------------------
   "+" is a single-purpose control now — upload is the only supported
   action, so it opens the OS file picker immediately rather than a menu
   for one item. */
attachBtn.addEventListener("click", () => {
  uploadInput.value = "";
  uploadInput.click();
});

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    showError(`This file is ${Math.round(file.size / 1024 / 1024)} MB — the limit is 200 MB.`);
    uploadInput.value = "";
    return;
  }
  attachedFile = file;
  attachmentName.textContent = file.name;
  attachmentName.title = file.name; // full name on hover once truncated
  if (brandImagesToggle) brandImagesToggle.checked = false; // default: the file's own images
  attachmentChip.hidden = false;
  lastCoached = null;
  clearError();
  syncSubmitState();
  syncStarters();
  closeCoach();
});

attachmentRemove.addEventListener("click", () => {
  attachedFile = null;
  attachmentChip.hidden = true;
  if (brandImagesToggle) brandImagesToggle.checked = false;
  clearError();
  syncSubmitState();
  syncStarters();
  promptInput.focus();
});

/* ---- Submit — the one commit point ---------------------------------------- */
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (submitBtn.disabled) return;
  clearError();

  if (attachedFile) {
    // Import path: unchanged — no checklist, no coach.
    create(async () => {
      setBusy(true, "Building…");
      // Import lands as a Generation with its slides already proposed
      // (proposedMapping) — from here it builds immediately, exactly like a
      // prompt. Slides are edited after the build, in the workspace.
      const generation = await api.importPresentation(attachedFile, {
        imageSource: brandImagesToggle?.checked ? "brand" : "source",
      });
      return buildFromGeneration(generation);
    });
    return;
  }

  // The form is already open: Generate again means "take me to it".
  if (coach.isOpen()) {
    coach.focus();
    return;
  }

  const prompt = promptInput.value.trim();
  // Retry of a failed coached build, prompt untouched: re-send the same brief
  // and answers instead of asking again.
  if (lastCoached && lastCoached.prompt === prompt) {
    runGeneration(lastCoached.brief, lastCoached.fields, lastCoached.prompt);
    return;
  }
  coach.open(prompt);
});

/** The last coached generation that failed, `{ prompt, brief, fields }`, so
 *  Retry keeps the answers. Forgotten on a prompt edit, a staged file, or any
 *  new attempt; the prompt textarea itself is never rewritten. */
let lastCoached = null;

/** The prompt path: generate (with whatever the form learned) and build. */
/** `prompt` is the text the brief was built from — stored with it, so Retry
 *  re-sends a brief only while the composer still holds that same text. */
async function runGeneration(brief, fields, prompt) {
  if (isWorkspaceOpen()) return; // a deck opened meanwhile — never build behind it
  lastCoached = null;
  const ok = await create(async () => {
    setBusy(true, "Drafting…");
    return generateAndApprove(brief, fields);
  });
  if (!ok) lastCoached = { prompt, brief, fields };
}

/** Shared by both paths: build, then open the new deck — or say why not. */
async function create(build) {
  try {
    const presentation = await build();
    // Straight into the workspace — still no success state in between, but
    // now without a document load: the new presentation simply becomes the
    // open document, and the rail picks it up.
    promptInput.value = "";
    attachedFile = null;
    attachmentChip.hidden = true;
    if (brandImagesToggle) brandImagesToggle.checked = false;
    setBusy(false);
    autoGrow();
    syncStarters();
    await openWorkspace(presentation.id);
    /* Compose warnings stay on the generation record for diagnosis, but they
     * are engine telemetry, not something the person building a deck can act
     * on — the deck opened, and anything worth changing is edited right here
     * in the workspace. So nothing is shown. */
    loadRecents();
    return true;
  } catch (err) {
    setBusy(false);
    showError(err.message || "Something went wrong. Try again.");
    return false;
  }
}

async function generateAndApprove(brief, fields) {
  let generation = await api.requestGeneration(brief, fields);

  if (generation.status === "pending") {
    try {
      generation = await draftAndWait(generation.id, {
        onProgress: ({ progress }) => renderBuildProgress(progress),
      });
    } catch (err) {
      // On success the view stays up: the build stages continue straight on.
      renderBuildProgress(null);
      throw err;
    }
  }

  if (generation.status === "failed") {
    throw new Error(generation.error || "Generation failed.");
  }

  setBusy(true, "Building…");
  return buildFromGeneration(generation);
}

/* ---- Build view -------------------------------------------------------------
 * Which rows are active, done or hidden: lib/build-stages.js. True while an
 * import builds, so its (never run) drafting rows are hidden. */
let buildIsImport = false;

/** Renders one `progress` frame from `approveAndWait`'s onProgress. `null`
 * (an older server, or a build that just ended) hides the section entirely —
 * the submit button's own busy label is the fallback then, unchanged from
 * before this feature existed.
 *
 * Each stage row carries a drawn marker (pending ring → pulsing active dot →
 * mint check) and the live detail rides WITH the active stage — one line of
 * plain language next to the thing it describes, instead of a separate strip
 * of per-slide cells nobody could decode. */
function renderBuildProgress(progress) {
  if (!progress) {
    buildViewEl.hidden = true;
    return;
  }
  if (buildViewEl.hidden) {
    buildViewEl.hidden = false;
    // The thread scrolls on its own above the docked composer: bring the
    // progress into view once, when it first appears, then leave scrolling to the person.
    buildViewEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  const states = stageStates(progress, { imported: buildIsImport });
  const doneCount = (progress.slides || []).filter(
    (s) => s.state === "done" || s.state === "fallback"
  ).length;
  const total = (progress.slides || []).length;

  for (const li of buildStagesEl.children) {
    const state = states[li.dataset.stage] || { active: false, done: false, hidden: false };
    const isActive = state.active;
    const isDone = state.done;
    li.hidden = state.hidden;
    li.classList.toggle("is-active", isActive);
    li.classList.toggle("is-done", isDone);

    /* The meta line belongs to the active stage only: the server's own detail
     * sentence, plus a slide count once slides are actually being written. */
    const meta = li.querySelector(".build__meta");
    if (!isActive) {
      meta.textContent = "";
    } else {
      const count = li.dataset.stage === "writing" && total
        ? `${Math.min(doneCount, total)} of ${total} slides`
        : "";
      const detail = progress.detail || "";
      meta.textContent = count && detail ? `${detail} · ${count}` : (detail || count);
    }
  }
}

/** Shared tail of both creation paths: approve the generation and poll it to
 * a finished presentation, narrating the build through the stage list above
 * the fold. Slides are edited afterwards, in the workspace — the build never
 * pauses for input. */
async function buildFromGeneration(generation) {
  buildIsImport = generation?.origin === "import";
  try {
    return await approveAndWait(generation.id, {
      onProgress: ({ progress }) => renderBuildProgress(progress),
    });
  } finally {
    // Completion and failure both end the build view the same way: gone, not
    // frozen on its last frame — the caller's own success/error UI takes over.
    renderBuildProgress(null);
    buildIsImport = false;
  }
}

