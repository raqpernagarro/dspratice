// product/ui/editor-ai/proposals.js
import { ctx } from "./context.js";
import { stateFor, pushThread, activeRewriteItem, STATUS_LABEL, relativeTime, KIND_GLYPH } from "./conversation.js";
// Circular with structural.js (it imports deriveItemStatus/settlePhase/
// settleReviewLink from here). Safe for the same reason conversation.js's
// cycle is: applyStructuralPlan is only ever called at runtime from inside
// acceptAllPending, long after both modules have finished evaluating.
import { buildLayoutOpEl, isOpPending, applyStructuralPlan } from "./structural.js";
import { resolveReviewIssue } from "./review.js";
import { escapeHtml, cssEscape, toast } from "../lib/dom.js";
import { api, ApiError } from "../lib/api.js";

/** Call after every `item.status = deriveItemStatus(item)` — the single
 *  place that decides whether a review-originated item (Fix button, see
 *  review.js) has genuinely settled. "ready"/"working" mean rows are still
 *  pending or the request hasn't landed, so the review must stay parked on
 *  "resolving issue N" (one at a time); only a terminal status (applied,
 *  partial, discarded) returns control to the checklist. Only "applied"
 *  (every row of the fix accepted) checks the issue off — "partial" leaves
 *  it open, matching "resolved = the fix actually landed", not "half of it". */
export function settleReviewLink(item) {
  if (!item?.fromReview) return;
  if (item.status === "ready" || item.status === "working") return;
  resolveReviewIssue(item.reviewIssueIndex, item.status === "applied");
}

/** A row is still "pending" if it has never been touched — proposals are
 *  created without a rowStatus, and only Accept/Discard ever set one. */
function isPending(p) { return !p.rowStatus || p.rowStatus === "pending"; }

/** True once nothing on the slide is waiting on the user anywhere in the
 *  feed — the phase gate cares about the whole feed, not just the newest
 *  item (an older item can still have pending rows if a newer ask started
 *  before the user finished reviewing it — see discardProposals). */
function hasPendingAnywhere(state) {
  return state.items.some((it) =>
    it.kind === "rewrite" &&
    ((it.payload?.proposals || []).some(isPending) || (it.payload?.layoutOps || []).some(isOpPending)));
}

/** Rewrite-item status derives entirely from its rows: any row still
 *  pending (proposal or layout op) keeps the card "ready"; once nothing is
 *  pending, all-applied/all-discarded/mixed decide the rest. Exported —
 *  structural.js's layout-op rows share this same lifecycle. */
export function deriveItemStatus(item) {
  const rows = item.payload?.proposals || [];
  const ops = item.payload?.layoutOps || [];
  if (rows.some(isPending) || ops.some(isOpPending)) return "ready";
  if (!rows.length && !ops.length) return "applied";
  const applied = rows.filter((r) => r.rowStatus === "applied").length + ops.filter((o) => o.rowStatus === "applied").length;
  const discarded = rows.filter((r) => r.rowStatus === "discarded").length + ops.filter((o) => o.rowStatus === "discarded").length;
  if (applied && discarded) return "partial";
  return discarded === rows.length + ops.length ? "discarded" : "applied";
}

/* ---- Canvas preview ---------------------------------------------------------
 * Proposed text is painted straight into the decorated spans (originals kept
 * on the element) so review happens on the slide itself. Only DOM text is
 * touched — nothing is written to the model until Accept, which goes through
 * writeField() like every other edit. */
let previewSpans = [];

export function applyCanvasPreview() {
  clearCanvasPreviewDom();
  const slide = ctx.iface.getSlides()[ctx.iface.getCurrentIndex()];
  const state = stateFor(slide.id);
  const item = activeRewriteItem(state);
  if (state.phase !== "review" || !item) { updateReviewBar(); return; }
  for (const p of (item.payload?.proposals || []).filter(isPending)) {
    if (isStale(slide, p)) continue; // canvas moved on — don't repaint over a manual edit
    const spans = [...ctx.iface.getCanvas().querySelectorAll(`.ed-editable[data-ed-field="${cssEscape(p.field)}"]`)];
    if (!spans.length) continue;
    if (Array.isArray(p.value)) {
      const items = spans.filter((s) => s.dataset.edKind === "list-item");
      const n = Math.min(items.length, p.value.length);
      for (let i = 0; i < n; i++) paintPreview(items[i], p.value[i]);
    } else if (spans[0].dataset.edKind === "text") {
      paintPreview(spans[0], String(p.value ?? ""));
    }
  }
  updateReviewBar();
}

function paintPreview(el, text) {
  if (el.dataset.edPrev === undefined) el.dataset.edPrev = el.textContent;
  el.textContent = text;
  el.classList.add("is-preview");
  previewSpans.push(el);
}

export function clearCanvasPreviewDom() {
  for (const el of previewSpans) {
    if (!document.contains(el)) continue;
    if (el.dataset.edPrev !== undefined) el.textContent = el.dataset.edPrev;
    delete el.dataset.edPrev;
    el.classList.remove("is-preview");
  }
  previewSpans = [];
  updateReviewBar();
}

export function hasPreview() { return previewSpans.length > 0; }

function updateReviewBar() {
  const slides = ctx.iface.getSlides();
  const currentIndex = ctx.iface.getCurrentIndex();
  const slide = slides[currentIndex];
  if (!slide) { if (ctx.dom.reviewBar) ctx.dom.reviewBar.hidden = true; return; }
  renderPendingQueue(stateFor(slide.id));
}

/** Kept only so composer.js's one-time init call has something to invoke —
 *  the review bar is now rebuilt wholesale on every renderPendingQueue call
 *  (fresh buttons, fresh listeners), the way every other card in this panel
 *  already works, so there is nothing left to wire once up front. */
export function wireReviewBar() {}

/* ---- Pending Changes queue ---------------------------------------------------
 * A dedicated review surface, not another chat bubble: it aggregates every
 * still-pending row across the WHOLE current-slide feed (every recent item,
 * not just the newest one) and puts Accept all / Discard all at that queue
 * level. Each card keeps its own per-row and per-card accept-all/discard-all
 * untouched (see buildRewriteCard) — this is an aggregate ON TOP, not a
 * replacement. Self-contained: it reads straight off state.items, the same
 * data every card already renders from, so it has nothing of its own to keep
 * in sync and can be remounted into a different container without changes. */

/** Every item in the feed that still has something awaiting a decision — a
 *  rewrite item with pending proposal or layout-op rows, or a layout
 *  (structural-plan) item that hasn't been applied or discarded yet. */
function pendingQueueItems(state) {
  return state.items.filter((it) => {
    if (it.kind === "rewrite") {
      return (it.payload?.proposals || []).some(isPending) || (it.payload?.layoutOps || []).some(isOpPending);
    }
    if (it.kind === "layout") return it.status === "ready";
    return false;
  });
}

function pendingCountFor(it) {
  if (it.kind === "layout") return 1;
  return (it.payload?.proposals || []).filter(isPending).length + (it.payload?.layoutOps || []).filter(isOpPending).length;
}

/** Renders the queue into the existing docked #ed-review element (see
 *  editor.html) — that slot already sits directly above the composer, which
 *  is exactly where a queue belongs, but nothing here assumes it: pass any
 *  element and it renders the same way. */
export function renderPendingQueue(state, mount = ctx.dom.reviewBar) {
  if (!mount) return;
  const items = pendingQueueItems(state);
  const total = items.reduce((n, it) => n + pendingCountFor(it), 0);
  if (!total) { mount.hidden = true; mount.innerHTML = ""; return; }
  mount.hidden = false;
  mount.innerHTML = `
    <div class="ed-review__queue-head">
      <span class="ed-review__label">${total === 1 ? "1 pending change" : `${total} pending changes`}</span>
      <button type="button" class="ed-review__btn ed-review__btn--accept" data-act="accept-all" data-fk="queue:accept-all">Accept all</button>
      <button type="button" class="ed-review__btn" data-act="discard-all" data-fk="queue:discard-all">Discard all</button>
    </div>
    <ul class="ed-review__list"></ul>`;

  const list = mount.querySelector(".ed-review__list");
  for (const it of items) {
    const n = pendingCountFor(it);
    const li = document.createElement("li");
    li.className = "ed-review__item";
    li.innerHTML = `
      <button type="button" class="ed-review__item-btn" data-item-id="${it.id}">
        <span class="ed-review__item-glyph" aria-hidden="true">${KIND_GLYPH[it.kind] || ""}</span>
        <span class="ed-review__item-ask" title="${escapeHtml(it.ask)}">${escapeHtml(it.ask)}</span>
        <span class="ed-review__item-count">${n === 1 ? "1 change" : `${n} changes`}</span>
      </button>`;
    li.querySelector(".ed-review__item-btn").addEventListener("click", () => {
      ctx.dom.aiActivity.querySelector(`[data-item-id="${cssEscape(it.id)}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    list.appendChild(li);
  }

  mount.querySelector('[data-act="accept-all"]').addEventListener("click", () => acceptAllPending(state));
  mount.querySelector('[data-act="discard-all"]').addEventListener("click", () => discardAllPending(state));
}

/** Queue-level Accept all: runs each pending item's own accept path (the
 *  exact one its card's footer button takes — one write per item, stale-
 *  guarded, undo-tracked) across the whole feed, one after another.
 *
 *  Layout/structural plans used to be skipped here on the reasoning that a
 *  template swap is a bigger decision than a wording tweak. But the queue
 *  COUNTS them ("1 pending change") and lists them, so a button labelled
 *  "Accept all" that silently ignored the only thing in the queue just read
 *  as broken — clicking it did nothing at all. A control must act on
 *  everything it claims to. Applying a plan still goes through
 *  applyStructuralPlan, which reverts the swap if the content write fails. */
async function acceptAllPending(state) {
  for (const it of pendingQueueItems(state)) {
    if (it.kind === "rewrite") await acceptAllProposals(it);
    else if (it.kind === "layout") await applyStructuralPlan(it);
  }
}

/** Queue-level Discard all: clears every still-pending row or plan across
 *  the whole feed. Rewrite items go through the normal discardProposals path
 *  (rows flip to "discarded", never removed); layout items flip the same way
 *  their own card's Discard button already does. */
function discardAllPending(state) {
  const items = pendingQueueItems(state);
  for (const it of items) {
    if (it.kind === "rewrite") discardProposals({ item: it, silent: true });
    else if (it.kind === "layout") it.status = "discarded";
  }
  if (state.phase === "review" && !pendingQueueItems(state).length) state.phase = "idle";
  ctx.renderAiPanel();
  if (items.length) announce("All pending changes discarded.");
}

/** Finds the work item a proposal object belongs to — proposal identity is
 *  by reference, and a proposal only ever lives on one rewrite item's
 *  payload. */
function ownerItem(state, p) {
  return state.items.find((it) => it.kind === "rewrite" && it.payload?.proposals?.includes(p)) || null;
}

/** Once a rewrite item's rows/layout ops settle (no pending left), the
 *  phase gate only clears when NOTHING in the feed is still pending — an
 *  older item can still be waiting even after the active one settles.
 *  Exported — structural.js's layout-op rows share this same gate. */
export function settlePhase(state) {
  if (state.phase === "review" && !hasPendingAnywhere(state)) state.phase = "idle";
}

/* ---- Accept / discard -------------------------------------------------------
 * Rows never disappear once touched — they stay on the card as a muted
 * "applied" line or a struck "discarded" label, so the card is a record of
 * what happened, not just what's left to decide. */
/** True once the canvas content a proposal was diffed against has moved on —
 *  the user edited the field manually while the proposal sat pending. Such a
 *  row must never be written or repainted; it's stale evidence, not a
 *  decision the user can still make. */
function isStale(slide, p) {
  return !ctx.iface.deepEqual(slide.content[p.field], p.prev);
}

/** Sets the live-region text directly (after renderAiPanel, which would
 *  otherwise overwrite it with the generic summary) so an accept/discard
 *  outcome is what screen readers actually hear for that action. */
function announce(msg) {
  if (ctx.dom.aiStatus) ctx.dom.aiStatus.textContent = msg;
}

export async function acceptProposal(p) {
  const slide = ctx.iface.getSlides()[ctx.iface.getCurrentIndex()];
  const state = stateFor(slide.id);
  const item = ownerItem(state, p);
  if (isStale(slide, p)) {
    clearCanvasPreviewDom();
    p.rowStatus = "discarded";
    p.editing = false;
    p.staleNote = true;
    if (item) { item.status = deriveItemStatus(item); settleReviewLink(item); }
    settlePhase(state);
    ctx.renderAiPanel();
    announce("Suggestion discarded.");
    return;
  }
  clearCanvasPreviewDom(); // writeField rebuilds the canvas from real content anyway
  const prevValue = structuredClone(slide.content[p.field]);
  slide.content[p.field] = p.value;
  const ok = await ctx.iface.writeField(slide, p.field, p.value, prevValue, { rebuild: true });
  // The row only flips to "applied" once the write actually landed — a
  // 422/500 must not eat it and then claim "updated".
  if (ok && item) {
    p.rowStatus = "applied";
    p.editing = false;
    p.expanded = false;
    item.status = deriveItemStatus(item);
    settleReviewLink(item);
    settlePhase(state);
    pushThread(state, slide.id, "user", `accepted the ${p.label} change`);
  }
  ctx.renderAiPanel();
  if (ok) announce(`${p.label} updated.`);
}

/** One PATCH, one history entry, one canvas rebuild — accepting N proposals
 *  field-by-field fired N network writes and N undo entries, and re-read
 *  `slides[currentIndex]` between writes while holding stale references. */
export async function acceptAllProposals(item) {
  const slides = ctx.iface.getSlides();
  const currentIndex = ctx.iface.getCurrentIndex();
  const slide = slides[currentIndex];
  const state = stateFor(slide.id);
  if (!item) item = activeRewriteItem(state);
  const pendingRows = (item?.payload?.proposals || []).filter(isPending);
  // Rows whose canvas content moved on since the diff was taken are stale —
  // drop them from the batch (flip to discarded) rather than overwrite a
  // manual edit the user just made.
  const stale = pendingRows.filter((p) => isStale(slide, p));
  for (const p of stale) { p.rowStatus = "discarded"; p.editing = false; p.staleNote = true; }
  const proposals = pendingRows.filter((p) => !stale.includes(p));
  if (item && stale.length) item.status = deriveItemStatus(item);
  if (!proposals.length) { if (item) settleReviewLink(item); settlePhase(state); ctx.renderAiPanel(); return; }
  if (proposals.length === 1) return acceptProposal(proposals[0]);

  clearCanvasPreviewDom();

  const prevValues = {};
  const nextValues = {};
  const overrides = {};
  for (const p of proposals) {
    prevValues[p.field] = structuredClone(slide.content[p.field]);
    nextValues[p.field] = p.value;
    overrides[p.field] = true;
    slide.content[p.field] = p.value;
  }

  const write = async (content) => {
    const updated = await api.updateSlide(ctx.iface.presentationId, slide.id, { content, manualOverrides: overrides });
    const liveSlides = ctx.iface.getSlides();
    const idx = liveSlides.findIndex((s) => s.id === updated.id);
    if (idx !== -1) liveSlides[idx] = updated;
    if (idx === ctx.iface.getCurrentIndex()) ctx.iface.renderCanvas();
    ctx.iface.paintThumb(idx);
  };

  ctx.iface.beginSave();
  let landed = false;
  try {
    await write(nextValues);
    ctx.iface.endSave(true);
    // Only a landed write settles the rows — a failure must keep them
    // pending rather than mark them applied and claim "updated".
    if (item) {
      for (const p of proposals) { p.rowStatus = "applied"; p.editing = false; p.expanded = false; }
      item.status = deriveItemStatus(item);
      settleReviewLink(item);
      settlePhase(state);
    }
    ctx.iface.pushHistory({
      label: "accept AI changes",
      undo: async () => { await write(prevValues); },
      redo: async () => { await write(nextValues); },
    });
    landed = true;
  } catch (err) {
    ctx.iface.endSave(false, err instanceof ApiError && err.status === 422 ? "Change rejected" : "Not saved");
    for (const [field, prev] of Object.entries(prevValues)) slide.content[field] = prev;
    ctx.iface.renderCanvas();
    toast(ctx.iface.errText(err, "Could not apply the changes."), "error");
  }
  ctx.renderAiPanel();
  if (landed) announce(proposals.length === 1 ? `${proposals[0].label} updated.` : `${proposals.length} changes updated.`);
}

/** Discards every still-pending row of the active rewrite item — the card's
 *  footer "Discard all" and the global review bar both route here. Rows
 *  already applied/discarded are left untouched (they're history now, not
 *  something this action can undo). Layout ops don't carry a row lifecycle
 *  yet, so they're cleared wholesale as before. */
export function discardProposals({ silent, item } = {}) {
  const state = stateFor(ctx.iface.getSlides()[ctx.iface.getCurrentIndex()].id);
  clearCanvasPreviewDom();
  if (!item) item = activeRewriteItem(state);
  if (item) {
    for (const p of item.payload?.proposals || []) if (isPending(p)) p.rowStatus = "discarded";
    for (const op of item.payload?.layoutOps || []) if (isOpPending(op)) op.rowStatus = "discarded";
    item.status = deriveItemStatus(item);
    settleReviewLink(item);
  }
  settlePhase(state);
  if (!silent) { ctx.renderAiPanel(); announce("Suggestion discarded."); }
}

/** Discards a single pending row — the per-row Discard button. */
function discardRow(p) {
  const state = stateFor(ctx.iface.getSlides()[ctx.iface.getCurrentIndex()].id);
  const item = ownerItem(state, p);
  p.rowStatus = "discarded";
  p.editing = false;
  if (item) { item.status = deriveItemStatus(item); settleReviewLink(item); }
  settlePhase(state);
  ctx.renderAiPanel();
  announce("Suggestion discarded.");
}

/* ---- Diff cards -------------------------------------------------------------
 * GitHub-PR-style: field name, "- current" / "+ proposed" lines, then plain
 * Accept / Edit / Discard. No input boxes until Edit is clicked. */
/** One display line per item. Structured rows (arrays of objects, e.g. a
 *  table's `rows` or a card grid's `items`) flatten to their own string
 *  values joined by " · " — without this they stringify to "[object Object]"
 *  and every diff, summary and snippet built on top reads as noise. */
/** Rows of objects/arrays — editable on the canvas, but not through the
 *  row's plain-text box, which would have to guess how to parse them back. */
function isStructuredValue(v) {
  return Array.isArray(v) && v.some((r) => r && typeof r === "object");
}

export function asLines(value) {
  if (!Array.isArray(value)) return String(value ?? "").split("\n");
  return value.map((v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.values(v).filter((x) => typeof x === "string" || typeof x === "number").join(" · ");
    }
    if (Array.isArray(v)) return v.map((c) => String(c ?? "")).join(" · ");
    return String(v ?? "");
  });
}

/** Word-level highlight within a changed line: the shared head and tail are
 *  left plain and only the words that actually differ are marked. Without
 *  this, "shorten the subtitle" reads as a whole line replaced, and the eye
 *  has to diff it manually — which is the work the panel is meant to do. */
function markWords(line, counterpart) {
  const a = line.split(/(\s+)/);
  const b = String(counterpart ?? "").split(/(\s+)/);
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;

  const before = a.slice(0, head).join("");
  const middle = a.slice(head, a.length - tail).join("");
  const after = a.slice(a.length - tail).join("");
  if (!middle) return escapeHtml(line);
  return `${escapeHtml(before)}<mark>${escapeHtml(middle)}</mark>${escapeHtml(after)}`;
}

function diffLines(value, counterpart, cls, sign) {
  const lines = asLines(value);
  const others = asLines(counterpart);
  return lines
    .map((line, i) =>
      `<span class="ed-item__diffline ed-item__diffline--${cls}"><i>${sign}</i>${
        others.includes(line) ? escapeHtml(line) : markWords(line, others[i])
      }</span>`)
    .join("");
}

/** "12 words → 8 — tighter" / "3 items → 2" / "Rewording, same length" —
 *  the decision in human terms, before any word-diff is shown. This is the
 *  card's "What changes" fact. */
function rowSummary(p) {
  const words = (v) => asLines(v).join(" ").trim().split(/\s+/).filter(Boolean).length;
  const items = (v) => (Array.isArray(v) ? v.length : null);
  const before = words(p.prev), after = words(p.value);
  const ib = items(p.prev), ia = items(p.value);
  if (ib !== null && ia !== null && ib !== ia) return `${ib} item${ib === 1 ? "" : "s"} → ${ia}`;
  if (after < before) return `${before} words → ${after} — tighter`;
  if (after > before) return `${before} words → ${after} — fuller`;
  return "Rewording, same length";
}

/** The card's "Why" fact — a short, honest read of the same word/item-count
 *  comparison rowSummary uses, phrased as a reason rather than a stat. There
 *  is no separate rationale from the model for a plain rewrite row, so this
 *  is derived from the real diff, never invented. */
function rowWhy(p) {
  const words = (v) => asLines(v).join(" ").trim().split(/\s+/).filter(Boolean).length;
  const items = (v) => (Array.isArray(v) ? v.length : null);
  const before = words(p.prev), after = words(p.value);
  const ib = items(p.prev), ia = items(p.value);
  if (ib !== null && ia !== null && ib > ia) return "Consolidates into fewer points";
  if (ib !== null && ia !== null && ib < ia) return "Breaks this into more points";
  if (after < before) return "Shorter, easier to scan";
  if (after > before) return "Adds a supporting detail";
  return "Reworded for tone, same length";
}

/** The card's "Expected impact" fact — a plain, factual one-liner off the
 *  same real diff (word/item counts). Never a fabricated score or
 *  percentage — just what actually changed, in the fewest words. */
function rowImpact(p) {
  const words = (v) => asLines(v).join(" ").trim().split(/\s+/).filter(Boolean).length;
  const items = (v) => (Array.isArray(v) ? v.length : null);
  const before = words(p.prev), after = words(p.value);
  const ib = items(p.prev), ia = items(p.value);
  if (ib !== null && ia !== null && ib !== ia) {
    const d = ia - ib;
    return d > 0 ? `Adds ${d} item${d === 1 ? "" : "s"}` : `Removes ${-d} item${-d === 1 ? "" : "s"}`;
  }
  if (after === before) return "Same length, reworded — meaning unchanged";
  const d = after - before;
  return d < 0 ? `${-d} fewer word${-d === 1 ? "" : "s"}, same meaning` : `${d} more word${d === 1 ? "" : "s"} of detail`;
}

/** The row's final text once applied — a short record, not the full value. */
function finalSnippet(p) {
  const text = asLines(p.value).join(" · ");
  return text.length > 60 ? `${text.slice(0, 59)}…` : text;
}

/** Returns focus to the row's own Edit button after the inline editor closes
 *  (Cancel or Escape) — the row that was being edited, not wherever the DOM
 *  rebuild happens to land. Called AFTER ctx.renderAiPanel(), which rebuilds
 *  the card wholesale synchronously — the button already exists in the DOM
 *  by the time this runs, so no requestAnimationFrame hop is needed (rAF
 *  never fires while the tab is backgrounded, which would strand focus). */
function focusRowTrigger(field) {
  const chip = ctx.dom.aiActivity.querySelector(`.ed-item__chipfield[data-field="${cssEscape(field)}"]`);
  chip?.closest(".ed-item__row")?.querySelector('[data-act="edit"]')?.focus();
}

/** One proposal row: pending (label chip + summary + Accept/Edit/Discard +
 *  per-row Diff toggle), applied (muted checkmark line), or discarded
 *  (struck label) — the row itself is the record, it never disappears. */
function buildProposalRow(p) {
  const row = document.createElement("div");
  row.className = "ed-item__row";
  row.dataset.rowStatus = p.rowStatus || "pending";
  // Focus-restore scope: the thread is rebuilt wholesale on every render, so
  // focus is re-found by (scope, action) rather than by node identity.
  row.dataset.fkScope = `row:${p.field}`;

  if (p.rowStatus === "applied") {
    row.innerHTML = `
      <span class="ed-item__row-check" aria-hidden="true">✓</span>
      <span class="ed-item__row-label">${escapeHtml(p.label)}</span>
      <span class="ed-item__row-final">${escapeHtml(finalSnippet(p))}</span>`;
    return row;
  }
  if (p.rowStatus === "discarded") {
    row.innerHTML = `
      <span class="ed-item__row-label ed-item__row-label--struck">${escapeHtml(p.label)}</span>
      ${p.staleNote ? `<span class="ed-item__row-note">Changed on canvas — suggestion dropped</span>` : ""}`;
    return row;
  }

  if (p.editing) {
    const isList = Array.isArray(p.value);
    // The chip must sit inside a row-head, exactly as the pending branch below
    // does. `.ed-item__row` is a column flex, so a bare chip as a direct child
    // stretches edge-to-edge instead of hugging its label — which is what the
    // "Headline" pill did the moment you pressed Edit.
    row.innerHTML = `<div class="ed-item__row-head"><span class="ed-item__chipfield">${escapeHtml(p.label)}</span></div>`;
    const ta = document.createElement("textarea");
    ta.className = "ed-item__row-editor";
    ta.rows = isList ? 5 : 3;
    ta.value = isList ? p.value.join("\n") : String(p.value ?? "");
    const actions = document.createElement("div");
    actions.className = "ed-item__row-actions";
    actions.innerHTML = `
      <button type="button" class="ed-item__btn ed-item__btn--accept" data-act="save">Accept</button>
      <button type="button" class="ed-item__btn" data-act="cancel">Cancel</button>`;
    row.append(ta, actions);
    actions.querySelector('[data-act="save"]').addEventListener("click", () => {
      const text = ta.value;
      p.value = isList ? text.split("\n").map((l) => l.trim()).filter(Boolean) : text;
      p.editing = false;
      acceptProposal(p);
    });
    actions.querySelector('[data-act="cancel"]').addEventListener("click", () => {
      p.editing = false;
      ctx.renderAiPanel();
      focusRowTrigger(p.field);
    });
    ta.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      p.editing = false;
      ctx.renderAiPanel();
      focusRowTrigger(p.field);
    });
    requestAnimationFrame(() => ta.focus());
    return row;
  }

  // Pending: read like a pull-request review item, not a chat reply —
  // what changes / why / expected impact up front, the technical diff
  // collapsed behind "Diff" until asked for.
  row.innerHTML = `
    <div class="ed-item__row-head">
      <span class="ed-item__chipfield" data-field="${escapeHtml(p.field)}">${escapeHtml(p.label)}</span>
    </div>
    <dl class="ed-item__row-facts">
      <div class="ed-item__row-fact"><dt>What changes</dt><dd>${escapeHtml(rowSummary(p))}</dd></div>
      <div class="ed-item__row-fact"><dt>Why</dt><dd>${escapeHtml(rowWhy(p))}</dd></div>
      <div class="ed-item__row-fact"><dt>Impact</dt><dd>${escapeHtml(rowImpact(p))}</dd></div>
    </dl>
    <div class="ed-item__row-diff" ${p.expanded ? "" : "hidden"}>
      ${diffLines(p.prev, p.value, "del", "−")}
      ${diffLines(p.value, p.prev, "add", "+")}
    </div>
    <div class="ed-item__row-actions">
      <button type="button" class="ed-item__btn ed-item__btn--accept" data-act="accept">Accept</button>
      ${isStructuredValue(p.value) ? "" : '<button type="button" class="ed-item__btn" data-act="edit">Edit</button>'}
      <button type="button" class="ed-item__btn ed-item__btn--discard" data-act="discard">Discard</button>
      <span class="ed-item__spacer"></span>
      <button type="button" class="ed-item__btn ed-item__btn--ghost" data-act="toggle" aria-expanded="${!!p.expanded}">${p.expanded ? "Hide diff" : "Diff"}</button>
    </div>`;

  // Highlighting the matching canvas element on hover is a Task 5 host
  // touchpoint — stubbed as an optional call so this row works before and
  // after that lands.
  const chip = row.querySelector(".ed-item__chipfield");
  chip.addEventListener("mouseenter", () => ctx.iface.highlightField?.(p.field, true));
  chip.addEventListener("mouseleave", () => ctx.iface.highlightField?.(p.field, false));

  row.querySelector('[data-act="accept"]').addEventListener("click", () => acceptProposal(p));
  row.querySelector('[data-act="edit"]')?.addEventListener("click", () => { p.editing = true; ctx.renderAiPanel(); });
  row.querySelector('[data-act="toggle"]').addEventListener("click", () => { p.expanded = !p.expanded; ctx.renderAiPanel(); });
  row.querySelector('[data-act="discard"]').addEventListener("click", () => discardRow(p));
  return row;
}

/** Full rewrite card: header (glyph, ask, status chip, sub-line) + one row
 *  per proposal + any still-pending layout ops + Accept all/Discard all
 *  footer once ≥2 rows are pending. Only used once the item has settled
 *  out of "working"/"error" — those statuses keep the shared placeholder
 *  card (steps / retry) in panel.js. */
export function buildRewriteCard(item) {
  const card = document.createElement("article");
  card.className = "ed-item";
  card.dataset.kind = "rewrite";
  card.dataset.status = item.status;
  card.dataset.itemId = item.id; // scroll target for the Pending Changes queue's per-item link
  card.setAttribute("aria-label", `rewrite — ${item.ask} — ${STATUS_LABEL[item.status] || item.status}`);

  const elapsed = item.elapsedMs ? ` · ${Math.round(item.elapsedMs / 1000)}s` : "";
  card.innerHTML = `
    <header class="ed-item__head">
      <span class="ed-item__glyph" aria-hidden="true">${KIND_GLYPH.rewrite}</span>
      <span class="ed-item__ask" title="${escapeHtml(item.ask)}">${escapeHtml(item.ask)}</span>
      <span class="ed-item__chip" data-chip="${item.status}">${STATUS_LABEL[item.status] || item.status}</span>
    </header>
    <p class="ed-item__sub">${item.scopeLabel ? `${escapeHtml(item.scopeLabel)} · ` : ""}${relativeTime(item.createdAt)}${elapsed}</p>
    <div class="ed-item__body"></div>
    <div class="ed-item__foot" hidden></div>`;

  const body = card.querySelector(".ed-item__body");
  for (const p of item.payload?.proposals || []) body.appendChild(buildProposalRow(p));
  for (const op of item.payload?.layoutOps || []) body.appendChild(buildLayoutOpEl(op, item));

  const pending = (item.payload?.proposals || []).filter(isPending);
  if (pending.length >= 2) {
    const foot = card.querySelector(".ed-item__foot");
    foot.hidden = false;
    foot.innerHTML = `
      <button type="button" class="ed-item__btn ed-item__btn--accept" data-act="accept-all">Accept all</button>
      <button type="button" class="ed-item__btn ed-item__btn--discard" data-act="discard-all">Discard all</button>`;
    foot.querySelector('[data-act="accept-all"]').addEventListener("click", () => acceptAllProposals(item));
    foot.querySelector('[data-act="discard-all"]').addEventListener("click", () => discardProposals({ item }));
  }

  return card;
}
