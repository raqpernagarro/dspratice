// product/ui/editor-ai/thinking.js
import { ctx } from "./context.js";
import { aiStates } from "./conversation.js";

/* ---- In-flight progress -----------------------------------------------------
 * This used to render three named steps ("Reading slide" → "Rewriting
 * content" → "Preparing changes") and tick them to "done" one per second. The
 * system knows none of that: the model call is a single CLI round-trip with no
 * intermediate signal, so a step marked complete at t=1s was a guess dressed
 * as a fact — and a slow request showed every step finished while nothing had
 * come back.
 *
 * What is actually knowable is: which request is in flight (an ordinary ask,
 * or a structural one that runs a planning call first), and how long it has
 * been running. That is what this shows — one honest phase label, a pulsing
 * dot for liveness, elapsed seconds, and a reassurance line once it has been
 * a while. Nothing here ever claims a step finished. */

const ADVICE_ACTIONS = new Set(["suggest", "speakerNotes", "imageIdeas", "followUpSlides"]);

/** The phase a request starts in. `planning` only applies to structural asks,
 *  which really do make a separate planning call before the rewrite. */
export function initialPhase(action, text, structural) {
  if (structural) return "planning";
  return ADVICE_ACTIONS.has(action) ? "reading" : "writing";
}

/** Present continuous, always — it describes what IS happening, never what
 *  has completed. */
export function phaseLabel(phase, scope) {
  const target = scope?.level === "object" || scope?.level === "visual"
    ? `the ${scope.label}`
    : "this slide";
  switch (phase) {
    case "planning": return "Checking which layout fits";
    case "reading": return `Reading ${target}`;
    default: return scope?.level === "slide" ? "Writing the change" : `Rewriting ${target}`;
  }
}

/** Patches the phase label of a mounted, in-flight item in place — no panel
 *  re-render, so nothing the user is looking at moves or loses focus. */
export function setItemPhase(item, phase, scope) {
  item.phase = phase;
  const el = ctx.dom.aiActivity?.querySelector(`.ed-progress[data-item-id="${CSS.escape(item.id)}"] .ed-progress__label`);
  if (el) el.textContent = phaseLabel(phase, scope);
}

/** The in-flight block for one work item. `cancellable` is the work-item id
 *  the Cancel control aborts, wired through ctx.composer rather than a direct
 *  import (composer.js already imports this module). */
export function buildProgressEl(item, scope, { cancellable = null } = {}) {
  const box = document.createElement("div");
  box.className = "ed-progress";
  box.dataset.itemId = item.id;
  box.dataset.startedAt = String(item.startedAt || Date.now());
  box.innerHTML =
    `<span class="ed-progress__dot" aria-hidden="true"></span>` +
    `<span class="ed-progress__label"></span>` +
    `<span class="ed-progress__elapsed" data-elapsed aria-hidden="true"></span>` +
    `<p class="ed-progress__note" data-note hidden></p>`;
  box.querySelector(".ed-progress__label").textContent = phaseLabel(item.phase, scope);
  if (cancellable) {
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ed-item__btn ed-item__btn--ghost ed-progress__cancel";
    cancel.textContent = "Stop";
    cancel.addEventListener("click", () => ctx.composer.cancelItem(cancellable));
    box.appendChild(cancel);
  }
  return box;
}

/* ---- Deck review ------------------------------------------------------------
 * The review is a single, always-single-flight call. Its liveness is the
 * pulsing dot in the health bar (panel.js), so there is no step machine here
 * any more — these remain as no-ops-with-a-purpose: review.js brackets its
 * request with them, and keeping the pair means the call sites stay honest if
 * a real progress signal ever exists. */
export function startSteps() {}
export function stopSteps() {}

/* ---- Live ticker -------------------------------------------------------------
 * Time-derived from `item.startedAt` — the one thing genuinely known. Runs
 * while ANY slide has work in flight and self-stops when the last settles. */
let liveTimer = null;

function anyItemWorking() {
  for (const state of aiStates.values()) {
    if (state.items.some((it) => it.status === "working")) return true;
  }
  return false;
}

/** Elapsed only appears after 3s: below that it is noise, and a fast request
 *  shouldn't flash a number on its way past. */
function elapsedText(secs) {
  if (secs < 3) return "";
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

/** Honest reassurance, not progress: it says how long this is taking, and
 *  never implies the work is nearly done. */
function noteText(secs) {
  if (secs >= 30) return "This is taking longer than usual — it's still running.";
  if (secs >= 12) return "Still working. You can keep editing other slides.";
  return "";
}

function tickLive() {
  const now = Date.now();
  ctx.dom.aiActivity?.querySelectorAll(".ed-progress[data-item-id]").forEach((box) => {
    const startedAt = Number(box.dataset.startedAt) || now;
    const secs = Math.max(0, Math.round((now - startedAt) / 1000));
    const elapsedEl = box.querySelector("[data-elapsed]");
    if (elapsedEl) elapsedEl.textContent = elapsedText(secs);
    const noteEl = box.querySelector("[data-note]");
    if (noteEl) {
      const note = noteText(secs);
      noteEl.hidden = !note;
      if (note && noteEl.textContent !== note) noteEl.textContent = note;
    }
  });
  // Patched in place rather than rebuilt: a wholesale rebuild every second
  // destroys whatever node currently holds keyboard focus.
  ctx.patchTaskStripElapsed?.();
  if (!anyItemWorking()) stopLiveTicker();
}

export function ensureLiveTicker() {
  if (liveTimer) return;
  liveTimer = setInterval(tickLive, 1000);
}
function stopLiveTicker() { clearInterval(liveTimer); liveTimer = null; }
