// product/ui/editor-ai/review.js
import { ctx } from "./context.js";
import { startSteps, stopSteps } from "./thinking.js";
import { toast } from "../lib/dom.js";
import { api } from "../lib/api.js";

/* ---- Presentation review ----------------------------------------------------
 * Deck-wide, not per-slide. The result is surfaced two ways: a one-line score
 * in the health bar, and a guided walkthrough that puts ONE issue at a time
 * into the conversation thread (panel.js buildWalkthroughTurn). "Fix" jumps to
 * the issue's slide and runs its instruction through the normal proposal loop,
 * so nothing is applied without the usual Accept. Not a work item. */
// `deckReview` is a transient in-flight marker only (`{ pending: true }`
// while a run is happening, else null) — the settled result the card renders
// lives in `storedReview` below so a reload can render it without re-running.
let deckReview = null;
let deckReviewBusy = false;
let deckReviewSteps = [];

// ---- Persistence + staleness ------------------------------------------------
// The review is advisory UI state, not backend data: it lives in localStorage
// keyed by presentation id, and staleness is derived for free by comparing
// the deck's updatedAt at review time against its updatedAt now (or against
// any local mutation observed since, via notifyDeckChanged()).
let storedReview = null; // { review, reviewedAt, updatedAtAtReview } | null
let storedLoaded = false;
let stale = false;

// ---- Follow-up chip support ("Fix the next issue") -------------------------
// Session-only (not persisted): tracks which issue indices of the CURRENT
// storedReview have had their Fix button fired. Reset whenever a fresh
// review is persisted (new review = new issue list = new indices).
let sentFixIndices = new Set();

// ---- One-issue-at-a-time resolution + progressive score --------------------
// Session-only, reset on a fresh review (same lifecycle as sentFixIndices).
// `activeIssueIndex` is the issue currently being resolved — set the moment
// its Fix is clicked, cleared the moment its item settles (accepted OR
// discarded), by resolveReviewIssue() below. While it's non-null the
// walkthrough's Fix button is disabled, so only one fix is ever in flight —
// a rejected/cancelled fix also clears it rather than stranding the user.
let activeIssueIndex = null;
// Accepted issues only — a discarded issue returns to the open/unresolved
// list so the user can try Fix again, it is NOT "resolved".
let resolvedIndices = new Set();

export function getActiveReviewIssueIndex() { return activeIssueIndex; }
export function setActiveReviewIssueIndex(n) { activeIssueIndex = n; ctx.renderAiPanel(); }
export function isIssueResolved(n) { return resolvedIndices.has(n); }

// ---- Guided walkthrough ----------------------------------------------------
// The review used to render every issue at once as one tall card. It now
// walks the user through them ONE at a time, as a turn in the conversation:
// `walkthrough` is on from the moment they open it until the last issue is
// resolved or skipped. Skipped issues stay in the deck's issue list (they're
// still real) but drop out of the walk so it can finish.
let walkthrough = false;
let skippedIndices = new Set();
/** Explicit browse position within the open issues. null = "wherever the walk
 *  naturally is" (the first still-open issue). Set only by stepWalk(), so
 *  arrowing back to re-read an earlier issue doesn't fight the auto-advance
 *  that happens when one is fixed or skipped. */
let walkCursor = null;

export function isWalkthroughActive() { return walkthrough; }
export function startReviewWalkthrough() {
  ensureLoaded();
  if (!storedReview) return;
  walkthrough = true;
  skippedIndices = new Set();
  walkCursor = null;
  ctx.renderAiPanel();
}
export function stopReviewWalkthrough() { walkthrough = false; ctx.renderAiPanel(); }
export function skipReviewIssue(n) {
  skippedIndices.add(n);
  if (walkCursor === n) walkCursor = null; // fall back to the natural position
  if (activeIssueIndex === n) activeIssueIndex = null;
  if (!nextOpenIssue()) walkthrough = false; // nothing left to walk
  ctx.renderAiPanel();
}

/** The issue the walkthrough is currently on: the first that is neither
 *  resolved nor skipped. Returns `{ index, issue }` or null when the walk is
 *  finished. Distinct from nextUnresolvedIssue() below, which is keyed off
 *  "was a fix ever sent" for the follow-up chip rather than off the walk. */
export function nextOpenIssue() {
  ensureLoaded();
  if (!storedReview) return null;
  const open = openIssues();
  if (!open.length) return null;
  if (walkCursor != null) {
    const at = open.find((o) => o.index === walkCursor);
    if (at) return at;
    walkCursor = null; // the issue we were parked on got resolved/skipped
  }
  return open[0];
}

/** Every issue still neither resolved nor skipped, in deck order. */
function openIssues() {
  const issues = storedReview?.review.issues || [];
  const out = [];
  for (let i = 0; i < issues.length; i++) {
    if (!resolvedIndices.has(i) && !skippedIndices.has(i)) out.push({ index: i, issue: issues[i] });
  }
  return out;
}

/** Browse the open issues without acting on any of them. Wraps at both ends
 *  so a short list stays navigable with one control. */
export function stepWalk(delta) {
  ensureLoaded();
  const open = openIssues();
  if (open.length < 2) return;
  const current = nextOpenIssue();
  const at = open.findIndex((o) => o.index === current?.index);
  const nextAt = (at + delta + open.length) % open.length;
  walkCursor = open[nextAt].index;
  ctx.renderAiPanel();
}

/** How many issues are still open, and where the cursor sits among them —
 *  the walkthrough card's "Issue N of M" reads from this so the counter
 *  matches what the arrows actually step through. */
export function walkPosition() {
  ensureLoaded();
  const open = openIssues();
  const current = nextOpenIssue();
  const at = open.findIndex((o) => o.index === current?.index);
  return { at: at < 0 ? 0 : at, open: open.length };
}

/** Progress readout for the walkthrough header: how far through the deck's
 *  issues the user is, counting a skip as "dealt with" for position purposes
 *  (they've seen it and moved on) but never as resolved. */
export function walkthroughProgress() {
  ensureLoaded();
  const issues = storedReview?.review.issues || [];
  const done = issues.reduce((n, _, i) => n + (resolvedIndices.has(i) || skippedIndices.has(i) ? 1 : 0), 0);
  return { done, total: issues.length };
}

/** Severity → weight for the progressive score (higher-severity issues move
 *  the number more). Matches the ring/chip severity vocabulary already used
 *  elsewhere in this file (`data-sev`). */
const SEVERITY_WEIGHT = { high: 3, medium: 2, low: 1 };

/** An honest client-side progress indicator, NOT a second call to the real
 *  review endpoint (that stays a manual "Re-run", same as ever) — it moves
 *  the displayed number toward 100 in proportion to how much of the found,
 *  weighted-by-severity issue surface has been resolved. At full resolution
 *  it reaches exactly 100; with nothing resolved it equals the stored score.
 *  Callers must show this as "progress", never claim it's a fresh score. */
export function progressiveScore() {
  ensureLoaded();
  if (!storedReview) return null;
  const issues = storedReview.review.issues || [];
  if (!issues.length) return storedReview.review.score;
  const weight = (iss) => SEVERITY_WEIGHT[iss.severity] || 1;
  const totalWeight = issues.reduce((n, iss) => n + weight(iss), 0);
  const resolvedWeight = issues.reduce((n, iss, i) => n + (resolvedIndices.has(i) ? weight(iss) : 0), 0);
  const base = storedReview.review.score;
  return base + (100 - base) * (totalWeight ? resolvedWeight / totalWeight : 0);
}

/** The single hook every path that can settle a review-originated item calls
 *  — proposals.js's acceptProposal/acceptAllProposals/discardProposals and
 *  structural.js's applyStructuralPlan (success) and its Discard button.
 *  `accepted` marks the issue resolved (checked off) only when true; a
 *  discard returns it to the open list. Always clears activeIssueIndex so
 *  the panel returns to the review view either way — "fixing an issue
 *  opens one proposal at a time" implies the review is always where you
 *  land back, not just on success. */
export function resolveReviewIssue(index, accepted) {
  if (index == null) return;
  if (accepted) resolvedIndices.add(index);
  if (walkCursor === index && accepted) walkCursor = null;
  if (activeIssueIndex === index) activeIssueIndex = null;
  // Walking ends on its own once nothing is left to walk — otherwise the
  // thread would keep showing a walkthrough prompt with no issue in it.
  if (walkthrough && !nextOpenIssue()) walkthrough = false;
}

function storageKey() { return `nps:review:${ctx.iface.presentationId}`; }

/** Lazy-loaded on first use — module init runs before context.js has the
 *  presentationId, so this can't run at import time. */
function ensureLoaded() {
  if (storedLoaded) return;
  storedLoaded = true;
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.review && typeof parsed.review.score === "number") {
        storedReview = parsed;
      } else {
        // Malformed/foreign shape — don't render off it, and don't keep
        // re-parsing it on every future load.
        localStorage.removeItem(storageKey());
      }
    }
  } catch {
    storedReview = null;
  }
  if (storedReview) {
    const live = ctx.iface.getPresentation();
    stale = !!live && live.updatedAt !== storedReview.updatedAtAtReview;
  }
}

function persist(review) {
  const live = ctx.iface.getPresentation();
  storedReview = { review, reviewedAt: Date.now(), updatedAtAtReview: live?.updatedAt ?? null };
  stale = false;
  sentFixIndices = new Set();
  resolvedIndices = new Set();
  activeIssueIndex = null;
  // A fresh review is a fresh issue list — the old walk's positions and
  // skips no longer refer to anything.
  walkthrough = false;
  skippedIndices = new Set();
  try {
    localStorage.setItem(storageKey(), JSON.stringify(storedReview));
  } catch {
    // localStorage full/unavailable — the chip still works for this session
  }
}

/** Called from the host's single write choke point (editor.js endSave(true))
 *  whenever any slide mutation succeeds. Flips staleness immediately per
 *  spec §2 ("any accepted change flips staleness immediately"). */
export function notifyDeckChanged() {
  if (storedReview && !stale) {
    stale = true;
    ctx.renderAiPanel?.();
  }
}

export function getStoredReview() { ensureLoaded(); return storedReview; }
export function isReviewStale() { ensureLoaded(); return stale; }

/** Marks issue `index` (into the current storedReview's `issues` array) as
 *  sent — called only from the review card's own Fix button, matching the
 *  brief's "resolved = its fix was sent". The follow-up chip only drafts, so
 *  it must never call this. */
export function markFixSent(index) { sentFixIndices.add(index); }

/** The next unresolved issue's fix text + target slide, or null if there's
 *  no stored review or every issue's Fix has already fired. Backs the
 *  "Fix the next issue" follow-up chip. */
export function nextUnresolvedIssue() {
  ensureLoaded();
  if (!storedReview) return null;
  const issues = storedReview.review.issues || [];
  const idx = issues.findIndex((_, i) => !sentFixIndices.has(i));
  if (idx === -1) return null;
  return { fix: issues[idx].fix, slideIndex: issues[idx].slideIndex };
}

/** Called after a successful presentation-level PATCH that does NOT touch
 *  deck content (today: aiMemory) — that write still bumps the record's
 *  updatedAt, which would otherwise falsely flip the stored review stale on
 *  the next load even though nothing content-wise changed. Only fast-
 *  forwards the staleness baseline when the chip is currently NOT stale —
 *  if it's already stale, a real content edit may be behind that too, so
 *  staleness must not be cleared here. */
export function rebaseReviewTimestamp(newUpdatedAt) {
  ensureLoaded();
  if (!storedReview || stale) return;
  storedReview.updatedAtAtReview = newUpdatedAt;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(storedReview));
  } catch {
    // localStorage full/unavailable — in-memory baseline is still updated
  }
}

export function getDeckReview() { return deckReview; }
export function getDeckReviewSteps() { return deckReviewSteps; }

export async function runDeckReview() {
  if (deckReviewBusy || ctx.iface.getBusy()) return;
  ensureLoaded();
  deckReviewBusy = true;
  deckReview = { pending: true };
  deckReviewSteps = ["Reading all slides", "Judging flow and density", "Writing the review"];
  ctx.renderAiPanel();
  startSteps();
  try {
    const result = await api.reviewPresentation(ctx.iface.presentationId);
    persist(result);
    deckReview = null; // rendering now reads from storedReview, not this transient slot
  } catch (err) {
    deckReview = null;
    toast(ctx.iface.errText(err, "Could not review the presentation."), "error");
  } finally {
    deckReviewBusy = false;
    stopSteps();
    ctx.renderAiPanel();
  }
}
