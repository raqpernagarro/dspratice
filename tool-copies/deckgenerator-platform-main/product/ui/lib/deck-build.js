// product/ui/lib/deck-build.js
// =============================================================================
// Turning an outline into a finished deck, from the client's side.
//
// Both ways of creating a deck — a prompt and a .pptx import — end at the same
// place: a Generation holding a proposed outline, which is then approved and
// laid out across the template library. Laying out takes 130 seconds for a
// short deck and 260+ for a sixteen-slide import.
//
// That used to be one awaited POST, which the client's own fetch aborts at
// 150s. The user was told the server had given up while it was still working,
// and the Retry button offered next produced a second copy of the same deck.
// Approval is asynchronous now: the server claims the generation, returns 202
// and composes in the background. This module does the waiting, in one place,
// so the home page and the library page cannot drift apart.
// =============================================================================
import { api } from "./api.js";

const POLL_INTERVAL_MS = 2000;
/* 11 minutes (330 * 2s). Deliberately generous: the cost of being wrong is
 * telling someone their deck failed while the server is still building it.
 * Sized against the whole-build soft deadline in generation-service.js
 * (#composeInBackground gives itself a ~9-minute budget before it starts
 * skipping optional passes) plus headroom for the parts of the build that
 * run outside that deadline (queueing, the final assemble/save) — the poll
 * must outlast the build it's watching, not race it. */
const POLL_MAX_ATTEMPTS = 330;
/* One dropped request must not fail the whole build. */
const MAX_CONSECUTIVE_FAILURES = 3;

// Stop polling when the page is going away, rather than issuing requests into
// a document that no longer exists.
let pageUnloading = false;
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => { pageUnloading = true; });
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Approves a completed generation and resolves with the finished presentation.
 *
 * @param {string} generationId
 * @param {{onProgress?: (info: {attempt: number, elapsedMs: number, progress: object|null}) => void}} [options]
 * @returns {Promise<object>} the created presentation
 */
export async function approveAndWait(generationId, { onProgress } = {}) {
  let claimed;
  try {
    claimed = await api.approveGeneration(generationId);
  } catch (err) {
    // Already approved — another tab, or a retry that raced this one. The deck
    // exists, so open it instead of reporting a conflict the user can't act on.
    if (err.status === 409 && err.presentationId) return api.getPresentation(err.presentationId);
    throw err;
  }

  // Nothing to wait for if it is already linked.
  if (claimed?.presentationId) return api.getPresentation(claimed.presentationId);

  const startedAt = Date.now();
  let consecutiveFailures = 0;

  for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt++) {
    if (pageUnloading) throw new Error("Building the deck was interrupted.");
    await wait(POLL_INTERVAL_MS);
    if (pageUnloading) throw new Error("Building the deck was interrupted.");

    let record;
    try {
      record = await api.getGeneration(generationId);
      consecutiveFailures = 0;
    } catch (err) {
      if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) throw err;
      continue;
    }

    // `progress` is absent on an older server — callers treat null as
    // "keep today's plain busy label", so nothing downstream has to branch
    // on server version.
    onProgress?.({ attempt, elapsedMs: Date.now() - startedAt, progress: record.progress || null });

    if (record.status === "approved" && record.presentationId) {
      const presentation = await api.getPresentation(record.presentationId);
      /* Composition can degrade without failing: the deck still arrives, but on
       * default layouts rather than chosen ones. That difference used to reach
       * only the server log, so a flat deck was indistinguishable from "the AI
       * is not very good". Carried on the presentation for the caller to show. */
      if (record.composeWarnings?.length) presentation.composeWarnings = record.composeWarnings;
      return presentation;
    }
    // The claim was released, which means composition failed. The record
    // carries the reason — it is the only place it is visible, because nothing
    // was awaiting the background task.
    if (record.status === "completed" || record.status === "failed") {
      throw new Error(record.error || "Building the deck failed. Try again.");
    }
  }

  throw new Error(
    "Building the deck is taking longer than expected. It may still finish — check your presentations in a moment."
  );
}

/* Drafting (understand → story → outline) runs in the background on the server
 * and can take minutes through the CLI. Same budget as the old inline poll. */
const DRAFT_POLL_INTERVAL_MS = 1500;
const DRAFT_MAX_MS = 12 * 60 * 1000;

/**
 * Waits for a background-drafting generation to leave `pending`, reporting the
 * server's `progress` (`understanding` | `story` | `drafting`) as it goes.
 * Resolves with the record once drafting is over (`completed`); rejects with the
 * server's reason if it `failed`.
 *
 * @param {string} generationId
 * @param {{onProgress?: (info: {attempt: number, elapsedMs: number, progress: object|null}) => void}} [options]
 * @returns {Promise<object>} the drafted generation
 */
export async function draftAndWait(generationId, { onProgress } = {}) {
  const startedAt = Date.now();
  let consecutiveFailures = 0;

  for (let attempt = 1; ; attempt++) {
    if (pageUnloading) throw new Error("Generation was interrupted.");
    if (Date.now() - startedAt > DRAFT_MAX_MS) throw new Error("Generation is taking longer than expected.");
    await wait(DRAFT_POLL_INTERVAL_MS);
    if (pageUnloading) throw new Error("Generation was interrupted.");

    let record;
    try {
      record = await api.getGeneration(generationId);
      consecutiveFailures = 0;
    } catch (err) {
      if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) throw err;
      continue;
    }

    // Progress is cleared by the server when drafting ends, so stop on status,
    // not on progress disappearing.
    if (record.status !== "pending") {
      if (record.status === "failed") throw new Error(record.error || "Generation failed.");
      return record;
    }
    onProgress?.({ attempt, elapsedMs: Date.now() - startedAt, progress: record.progress || null });
  }
}

/**
 * Imports a .pptx and waits for the finished deck.
 *
 * The import endpoint returns a Generation (the parsed outline) rather than a
 * presentation, because laying it out is the slow part. The `status` check
 * tolerates an older server that still returns a finished presentation.
 *
 * @param {File} file
 * @param {{imageSource?: "source"|"brand", onProgress?: Function}} [options]
 * @returns {Promise<object>} the created presentation
 */
export async function importAndWait(file, { imageSource, onProgress } = {}) {
  const result = await api.importPresentation(file, { imageSource });
  if (result?.id && result?.status && !result.slides) {
    return approveAndWait(result.id, { onProgress });
  }
  return result;
}
