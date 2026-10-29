// product/ui/editor-ai/panel.js
import { ctx } from "./context.js";
import { aiStates, stateFor, pruneStates, currentScope, STATUS_LABEL, relativeTime, glyphFor } from "./conversation.js";
import { buildProgressEl } from "./thinking.js";
import { toggleMemory } from "./memory.js";
import { applyCanvasPreview, buildRewriteCard } from "./proposals.js";
import { buildLayoutCard } from "./structural.js";
import {
  getDeckReview, getDeckReviewSteps, runDeckReview,
  getStoredReview, isReviewStale, nextUnresolvedIssue,
  isWalkthroughActive, startReviewWalkthrough, stopReviewWalkthrough,
  skipReviewIssue, nextOpenIssue, walkthroughProgress, stepWalk, walkPosition,
  setActiveReviewIssueIndex, getActiveReviewIssueIndex, markFixSent, isIssueResolved,
  progressiveScore,
} from "./review.js";
import { escapeHtml, toast } from "../lib/dom.js";
import { sendAi } from "./composer.js";
import { emptyStateIntents, followUpsFor } from "./intents.js";
import { renderPreserving, wireScroll, scrollToBottom, isStuck, stickToBottom, unseenCount } from "./panel-dom.js";

/** One line describing what an item's payload holds — a placeholder for the
 *  real kind-specific card bodies (rewrite rows, layout plan, review score,
 *  notes) built out in later tasks. */
function summarizePayload(item) {
  if (item.status === "working") return "";
  if (item.status === "cancelled") return "Cancelled.";
  if (item.status === "error") return item.error || "Something went wrong.";
  if (item.kind === "rewrite") {
    const n = item.payload?.proposals?.length || 0;
    const lo = item.payload?.layoutOps?.length || 0;
    const parts = [];
    if (n) parts.push(`${n} proposal${n === 1 ? "" : "s"}`);
    if (lo) parts.push(`${lo} layout change${lo === 1 ? "" : "s"}`);
    return parts.join(" · ") || "No changes pending.";
  }
  if (item.kind === "layout") {
    const plan = item.payload?.structural;
    return plan ? `${plan.operation === "addSlide" ? "New slide" : "Layout"} — ${plan.templateName}` : "Layout change";
  }
  if (item.kind === "advice") {
    return (item.payload?.advice || []).join(" ");
  }
  return "";
}

function buildItemCard(item, hasWorking) {
  const card = document.createElement("article");
  card.className = "ed-item";
  card.dataset.kind = item.kind;
  card.dataset.status = item.status;
  card.setAttribute("aria-label", `${item.kind} — ${item.ask} — ${STATUS_LABEL[item.status] || item.status}`);

  const elapsed = item.status !== "working" && item.elapsedMs ? ` · ${Math.round(item.elapsedMs / 1000)}s` : "";
  card.innerHTML = `
    <header class="ed-item__head">
      <span class="ed-item__glyph" aria-hidden="true">${glyphFor(item)}</span>
      <span class="ed-item__ask" title="${escapeHtml(item.ask)}">${escapeHtml(item.ask)}</span>
      <span class="ed-item__chip" data-chip="${item.status}">${STATUS_LABEL[item.status] || item.status}</span>
    </header>
    <p class="ed-item__sub">${item.scopeLabel ? `${escapeHtml(item.scopeLabel)} · ` : ""}${relativeTime(item.createdAt)}${elapsed}</p>
    <div class="ed-item__body"></div>`;

  const body = card.querySelector(".ed-item__body");
  if (item.status === "working") {
    body.appendChild(buildProgressEl(item, item.scopeAtSend, { cancellable: item.id }));
  } else {
    const summary = summarizePayload(item);
    if (summary) {
      const p = document.createElement("p");
      p.className = item.status === "error" ? "ed-item__summary ed-item__summary--error" : "ed-item__summary";
      p.textContent = summary;
      body.appendChild(p);
    }
    if (item.status === "error" || item.status === "cancelled") {
      const actions = document.createElement("div");
      actions.className = "ed-item__actions";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "ed-item__btn";
      retry.textContent = "Retry";
      retry.disabled = hasWorking; // this slide already has an in-flight request
      retry.addEventListener("click", () => sendAi(item.ask, item.action));
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "ed-item__btn ed-item__btn--ghost";
      edit.textContent = "Edit ask";
      edit.addEventListener("click", () => ctx.composer.draft(item.ask));
      actions.append(retry, edit);
      body.appendChild(actions);
    }
  }

  return card;
}

/** A quiet "Notes" card for advice-kind items — a plain list, no actions. */
function buildNotesCard(item) {
  const card = document.createElement("article");
  card.className = "ed-item";
  card.dataset.kind = "advice";
  card.dataset.status = item.status;
  card.setAttribute("aria-label", `notes — ${item.ask} — ${STATUS_LABEL[item.status] || item.status}`);

  const elapsed = item.elapsedMs ? ` · ${Math.round(item.elapsedMs / 1000)}s` : "";
  card.innerHTML = `
    <header class="ed-item__head">
      <span class="ed-item__glyph" aria-hidden="true">${glyphFor(item)}</span>
      <span class="ed-item__ask" title="${escapeHtml(item.ask)}">${escapeHtml(item.ask)}</span>
      <span class="ed-item__chip" data-chip="notes">Notes</span>
    </header>
    <p class="ed-item__sub">${item.scopeLabel ? `${escapeHtml(item.scopeLabel)} · ` : ""}${relativeTime(item.createdAt)}${elapsed}</p>
    <ul class="ed-ai__list"></ul>`;

  const list = card.querySelector(".ed-ai__list");
  for (const line of item.payload?.advice || []) {
    const li = document.createElement("li");
    li.textContent = line;
    list.appendChild(li);
  }
  return card;
}

/** Rewrite items with a settled payload (row lifecycle, per-row diff, the
 *  Accept all/Discard all footer), layout plans, and advice notes get their
 *  dedicated card; working steps and error/cancelled outcomes (any kind)
 *  keep the shared placeholder shell above. */
function buildCard(item, hasWorking) {
  if (item.kind === "rewrite" && item.payload && Array.isArray(item.payload.proposals)) return buildRewriteCard(item);
  if (item.kind === "layout" && item.payload?.structural) return buildLayoutCard(item);
  if (item.kind === "advice" && item.payload && item.status !== "working") return buildNotesCard(item);
  return buildItemCard(item, hasWorking);
}

/** The conversation's living edge: the newest item (items[0] is newest —
 *  conversation.js unshifts) whose status has settled to applied/partial.
 *  Walks the feed from the top rather than only checking items[0], because
 *  the very newest item can still be working/error/cancelled while an older
 *  one is the last one that actually settled. Older settled cards never
 *  grow a follow-up row — only the first settled one found this way. */
function newestSettledItem(state) {
  return state.items.find((it) => it.status === "applied" || it.status === "partial") || null;
}

/** Quiet "Next:" chip row (spec §2) — appended to the newest settled card
 *  only, after the card's own DOM is built. Rendered here rather than inside
 *  buildRewriteCard/buildLayoutCard because "which card gets it" is a
 *  cross-item decision (the newest settled one) that only this render loop
 *  can make; the card builders stay ignorant of their neighbors. Chips only
 *  ever draft (ctx.composer.draft) — never auto-send. */
function appendFollowUps(card, item) {
  const nextReviewIssue = nextUnresolvedIssue();
  const chips = followUpsFor(item, { nextReviewIssue });
  if (!chips.length) return;
  const row = document.createElement("div");
  row.className = "ed-item__followups";
  row.innerHTML = `<span class="ed-item__followups-label">Next:</span>`;
  for (const chip of chips) {
    // Most chips are plain strings that only draft into the composer. A chip
    // can instead be `{ label, action }` when its text doesn't match the
    // action it must send under (e.g. "Generate speaker notes" needs action
    // "speakerNotes", not the default "rewrite") — drafting can't carry an
    // action through the composer, so that chip sends directly instead,
    // same as a quick action.
    const label = typeof chip === "string" ? chip : chip.label;
    const action = typeof chip === "string" ? null : chip.action;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ed-item__followup-chip";
    btn.textContent = label;
    if (label === "Fix the next issue") btn.title = "Stays available until the fix is run.";
    btn.addEventListener("click", () => {
      // "Fix the next issue" drafts the issue's actual fix text, jumping to
      // its slide first — same jump behavior as the review card's own Fix
      // button — since the ask, once sent, is slide-scoped.
      if (label === "Fix the next issue" && nextReviewIssue) {
        ctx.iface.selectSlide(nextReviewIssue.slideIndex - 1);
        ctx.composer.draft(nextReviewIssue.fix);
      } else if (action) {
        ctx.sendAi(label, action);
      } else {
        ctx.composer.draft(label);
      }
    });
    row.appendChild(btn);
  }
  card.appendChild(row);
}

/** Cross-slide strip of every working item, regardless of which slide is
 *  showing — hidden when nothing is running. Lives above the context chips
 *  (`#ai-tasks` in editor.html, added for this task). Rebuilt wholesale on
 *  every call — but this function only runs when the SET of working items
 *  actually changed (a new ask started, one settled/cancelled): the panel's
 *  own render path (renderAiPanel → here), and composer.js's finally when an
 *  item settles on a slide that isn't mounted. The 1s live ticker
 *  (thinking.js tickLive) does NOT call this — it patches the existing rows'
 *  elapsed text in place instead (patchTaskStripElapsed below), so a
 *  keyboard focus sitting on a row's Cancel button survives every tick
 *  instead of being destroyed by an innerHTML rebuild it triggered a second
 *  ago. Rows carry a stable data-item-id so the ticker can find them again. */
function renderTaskStrip() {
  const el = ctx.dom.aiTasks;
  if (!el) return;
  const slides = ctx.iface.getSlides();
  const currentIndex = ctx.iface.getCurrentIndex();
  const rows = [];
  for (const [slideId, state] of aiStates) {
    const index = slides.findIndex((s) => s.id === slideId);
    if (index === -1) continue; // slide was deleted while its request was in flight
    if (index === currentIndex) continue; // already shown as its own card in Active Task — don't repeat it here
    for (const item of state.items) {
      if (item.status === "working") rows.push({ index, item });
    }
  }
  el.hidden = rows.length === 0;
  el.innerHTML = "";
  if (!rows.length) return;
  for (const { index, item } of rows) {
    const secs = Math.max(0, Math.round((Date.now() - (item.startedAt || item.createdAt)) / 1000));
    const ask = item.ask.length > 40 ? `${item.ask.slice(0, 40)}…` : item.ask;
    const row = document.createElement("div");
    row.className = "ed-tasks__row";
    row.dataset.itemId = item.id;
    row.innerHTML = `
      <button type="button" class="ed-tasks__slide">Slide ${index + 1}</button>
      <span class="ed-tasks__ask" title="${escapeHtml(item.ask)}">${escapeHtml(ask)}</span>
      <span class="ed-tasks__elapsed">${secs >= 1 ? `${secs}s` : ""}</span>
      <button type="button" class="ed-tasks__cancel" aria-label="Cancel the task on slide ${index + 1}">Cancel</button>`;
    row.querySelector(".ed-tasks__slide").addEventListener("click", () => ctx.iface.selectSlide(index));
    row.querySelector(".ed-tasks__cancel").addEventListener("click", () => ctx.composer.cancelItem(item.id));
    el.appendChild(row);
  }
}

/** Ticker-only update: patches the elapsed text of the task strip's existing
 *  rows in place, keyed by the data-item-id renderTaskStrip stamps on each
 *  row. Never touches innerHTML, so a focused Cancel button stays focused
 *  across every tick. Rows for items that settled between ticks are simply
 *  skipped here — renderTaskStrip (called from the add/remove path) drops
 *  them on its own next pass. */
function patchTaskStripElapsed() {
  const el = ctx.dom.aiTasks;
  if (!el || el.hidden) return;
  for (const [, state] of aiStates) {
    for (const item of state.items) {
      if (item.status !== "working") continue;
      const row = el.querySelector(`.ed-tasks__row[data-item-id="${item.id}"]`);
      if (!row) continue;
      const secs = Math.max(0, Math.round((Date.now() - (item.startedAt || item.createdAt)) / 1000));
      const elapsedEl = row.querySelector(".ed-tasks__elapsed");
      if (elapsedEl) elapsedEl.textContent = secs >= 1 ? `${secs}s` : "";
    }
  }
}

/** Whether any slide OTHER than the current one has an in-flight request. */
function hasCrossSlideWorking(currentIndex, slides) {
  for (const [slideId, state] of aiStates) {
    const index = slides.findIndex((s) => s.id === slideId);
    if (index === -1 || index === currentIndex) continue;
    if (state.items.some((it) => it.status === "working")) return true;
  }
  return false;
}

/* ---- Health strip ---------------------------------------------------------
 * One line, fixed height, never a card. Before a review it offers to run one;
 * after, it shows the score and a "Review issues" button that starts the
 * guided walkthrough IN THE THREAD (one issue at a time) instead of expanding
 * a tall list of every issue at once — that list was the thing that read as
 * "a mess". */
function renderHealthSection() {
  const el = ctx.dom.aiHealthBody;
  if (!el) return;
  el.innerHTML = "";

  const dr = getDeckReview();
  if (dr?.pending) {
    // Reading a whole deck takes a while. A static line reads as frozen, so
    // this carries a pulsing dot — the one honest liveness signal available,
    // since the backend reports no progress until the whole review lands.
    el.dataset.state = "working";
    el.innerHTML =
      `<span class="ed-healthbar__pulse" aria-hidden="true"></span>` +
      `<span class="ed-healthbar__label">Reading every slide…</span>`;
    return;
  }

  const stored = getStoredReview();
  if (!stored) {
    el.dataset.state = "empty";
    el.innerHTML =
      `<span class="ed-healthbar__label">Check the whole presentation for issues</span>` +
      `<button type="button" class="ed-healthbar__icon" id="ai-memory-toggle" ` +
             `title="Standing instructions for this deck" aria-label="Standing instructions">✎</button>` +
      `<button type="button" class="ed-healthbar__btn" id="ai-health-run">Review</button>`;
    el.querySelector("#ai-health-run").addEventListener("click", runDeckReview);
    el.querySelector("#ai-memory-toggle").addEventListener("click", toggleMemory);
    return;
  }

  const { review } = stored;
  const issues = review.issues || [];
  const open = issues.length - issues.reduce((n, _, i) => n + (isIssueResolved(i) ? 1 : 0), 0);
  const score = Math.round(progressiveScore() ?? review.score);
  const stale = isReviewStale();
  el.dataset.state = "scored";
  // Four competing things on one 360px line meant the label always lost and
  // truncated mid-word ("…· de…"). Now there is exactly one text label and one
  // named action; re-run is an icon, and staleness rides ON that icon as a dot
  // instead of eating label width — staleness is information ABOUT re-running,
  // so that is where it belongs.
  el.innerHTML =
    `<span class="ed-healthbar__score" data-band="${score >= 80 ? "good" : score >= 50 ? "mid" : "low"}">${score}<i>/100</i></span>` +
    `<span class="ed-healthbar__label">${open ? `${open} issue${open === 1 ? "" : "s"} to fix` : "All issues handled"}</span>` +
    (open ? `<button type="button" class="ed-healthbar__btn" id="ai-health-walk">Review</button>` : "") +
    `<button type="button" class="ed-healthbar__icon${stale ? " is-stale" : ""}" id="ai-health-rerun"` +
      ` aria-label="${stale ? "Deck changed since this review — run it again" : "Run the review again"}"` +
      ` title="${stale ? "Deck changed since this review — run it again" : "Run the review again"}">` +
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"` +
      ` stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>` +
    `</button>`;
  el.querySelector("#ai-health-walk")?.addEventListener("click", startReviewWalkthrough);
  el.querySelector("#ai-health-rerun").addEventListener("click", runDeckReview);
}

/* ---- Conversation turns ---------------------------------------------------
 * Every item renders as a pair: the ask as a right-aligned user bubble, then
 * the AI's answer below it (proposal card, layout plan, notes, or live
 * progress). The card keeps all its existing behaviour — its own header ask
 * is hidden by CSS inside a turn, because the bubble above already says it.
 * Ordered oldest-first so the thread reads like a chat and the newest turn is
 * at the bottom, next to the composer. */
/** Turns whose entrance animation has already played. The thread is rebuilt
 *  wholesale on every interaction, so without this every card re-animates
 *  each time you toggle a diff or accept a row — the whole panel twitches. */
const entered = new Set();

function buildTurn(item, hasWorking, isNewestSettled) {
  const turn = document.createElement("div");
  turn.className = "ed-turn";
  turn.dataset.status = item.status;
  turn.dataset.anchor = item.id; // scroll-restore target across rebuilds
  if (!entered.has(item.id)) { turn.dataset.enter = "1"; entered.add(item.id); }

  if (item.ask) {
    const ask = document.createElement("div");
    ask.className = "ed-turn__ask";
    const bubble = document.createElement("div");
    bubble.className = "ed-bubble ed-bubble--user";
    bubble.textContent = item.ask;
    ask.appendChild(bubble);
    if (item.fromReview) {
      const tag = document.createElement("span");
      tag.className = "ed-turn__tag";
      tag.textContent = "from review";
      ask.appendChild(tag);
    }
    turn.appendChild(ask);
  }

  const answer = document.createElement("div");
  answer.className = "ed-turn__answer";
  const card = buildCard(item, hasWorking);
  if (isNewestSettled) appendFollowUps(card, item);
  answer.appendChild(card);
  turn.appendChild(answer);
  return turn;
}

/** The guided review walkthrough, rendered as the last turn in the thread:
 *  ONE issue, its severity, and two choices. This is the whole point of the
 *  redesign — the old card showed every issue at once with a Fix button on
 *  each, which is what made it unreadable and made clicking Fix feel like
 *  nothing happened. Here the next issue only appears once the current one is
 *  resolved or skipped, and pressing Fix posts a real ask into the thread so
 *  the work is visible where everything else is. */
function buildWalkthroughTurn(hasWorking) {
  // While a fix is actually running, the card does NOT render. Previously it
  // sat there with a greyed-out button while the real work happened somewhere
  // below it — which is precisely why pressing Fix felt like nothing had
  // happened. Now the ask bubble and its progress ARE the feedback, and the
  // next issue only reappears once this one is settled.
  if (hasWorking || getActiveReviewIssueIndex() !== null) return null;
  const next = nextOpenIssue();
  if (!next) return null;
  const { index, issue } = next;
  // Counter reads from the OPEN set, which is exactly what the arrows step
  // through — so "Issue 2 of 5" always matches what pressing next does.
  const pos = walkPosition();

  const turn = document.createElement("div");
  turn.className = "ed-turn ed-turn--review";
  turn.dataset.anchor = `walk:${index}`;
  if (!entered.has(`walk:${index}`)) { turn.dataset.enter = "1"; entered.add(`walk:${index}`); }

  const answer = document.createElement("div");
  answer.className = "ed-turn__answer";
  const card = document.createElement("article");
  card.className = "ed-walk";
  const sev = String(issue.severity || "").toLowerCase();
  const sevWord = sev ? sev[0].toUpperCase() + sev.slice(1) : "";
  card.innerHTML = `
    <div class="ed-walk__head">
      <span class="ed-walk__sev" data-sev="${escapeHtml(sev)}">
        <span class="ed-walk__dot" aria-hidden="true"></span>
        <button type="button" class="ed-walk__slide" data-walk-goto>Slide ${escapeHtml(String(issue.slideIndex))}</button>
        <span class="ed-walk__sevword">· ${escapeHtml(sevWord)}</span>
      </span>
      <span class="ed-walk__count">Issue ${pos.at + 1} of ${pos.open}</span>
      <button type="button" class="ed-walk__close" aria-label="Stop reviewing issues">&times;</button>
    </div>
    <p class="ed-walk__text"></p>
    <p class="ed-walk__fix"></p>
    <div class="ed-walk__actions">
      <button type="button" class="ed-item__btn ed-item__btn--accept" data-walk-fix>Fix it</button>
      <button type="button" class="ed-item__btn ed-item__btn--ghost" data-walk-skip>Skip</button>
      <span class="ed-walk__nav">
        <button type="button" class="ed-walk__arrow" data-walk-prev aria-label="Previous issue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button type="button" class="ed-walk__arrow" data-walk-next aria-label="Next issue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </span>
    </div>`;
  card.querySelector(".ed-walk__text").textContent = issue.issue;
  card.querySelector(".ed-walk__fix").textContent = issue.fix;

  card.querySelector(".ed-walk__close").addEventListener("click", stopReviewWalkthrough);
  card.querySelector("[data-walk-skip]").addEventListener("click", () => skipReviewIssue(index));
  const prevBtn = card.querySelector("[data-walk-prev]");
  const nextBtn = card.querySelector("[data-walk-next]");
  // With one issue left there is nowhere to step, so the arrows say so
  // rather than looking live and doing nothing.
  prevBtn.disabled = nextBtn.disabled = pos.open < 2;
  prevBtn.addEventListener("click", () => stepWalk(-1));
  nextBtn.addEventListener("click", () => stepWalk(1));
  // Look before you commit: jump to the slide without starting anything.
  card.querySelector("[data-walk-goto]").addEventListener("click", () => ctx.iface.selectSlide(issue.slideIndex - 1));

  card.querySelector("[data-walk-fix]").addEventListener("click", async () => {
    const targetIdx = issue.slideIndex - 1;
    // Check BEFORE jumping. The old order teleported the user to another
    // slide and only then discovered it was busy, leaving them somewhere they
    // never asked to be with a toast as the only explanation.
    if (slideBusyAt(targetIdx)) {
      toast(`Slide ${issue.slideIndex} is still working on another change.`, "error");
      return;
    }
    ctx.iface.selectSlide(targetIdx);
    setActiveReviewIssueIndex(index);
    const sent = await ctx.sendAi(issue.fix, "rewrite", { fromReview: true, reviewIssueIndex: index });
    if (sent) markFixSent(index);
    else {
      setActiveReviewIssueIndex(null);
      toast("Could not start that fix — try again in a moment.", "error");
    }
  });

  answer.appendChild(card);
  turn.appendChild(answer);
  return turn;
}

/** Whether the slide at `index` already has an in-flight AI request. */
function slideBusyAt(index) {
  const slide = ctx.iface.getSlides()[index];
  if (!slide) return false;
  const st = aiStates.get(slide.id);
  return !!st && st.items.some((it) => it.status === "working");
}

/* ---- Slide picker (the panel header) -------------------------------------- */
let slideMenuOpen = false;

function renderSlidePicker(slides, currentIndex) {
  const btn = ctx.dom.aiSlidePicker;
  const label = ctx.dom.aiSlidePickerLabel;
  const menu = ctx.dom.aiSlideMenu;
  if (!btn || !label || !menu) return;

  label.textContent = `Slide ${currentIndex + 1}`;
  btn.setAttribute("aria-expanded", slideMenuOpen ? "true" : "false");
  menu.hidden = !slideMenuOpen;
  if (!slideMenuOpen) return;

  menu.innerHTML = "";
  slides.forEach((s, i) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "ed-slidepick__item";
    // menuitem, not option: these are buttons that navigate, and a listbox
    // would promise arrow-key + aria-activedescendant semantics this doesn't
    // implement. aria-current marks the one you're on.
    row.setAttribute("role", "menuitem");
    if (i === currentIndex) {
      row.dataset.current = "true";
      row.setAttribute("aria-current", "true");
    }
    // A slide with unfinished AI work gets a dot, so moving between slides
    // never loses track of where something is still pending.
    const st = aiStates.get(s.id);
    const busy = st?.items.some((it) => it.status === "working");
    const pending = st?.items.some((it) => (it.kind === "rewrite" || it.kind === "layout") && it.status === "ready");
    row.innerHTML =
      `<span class="ed-slidepick__num">${i + 1}</span>` +
      `<span class="ed-slidepick__name"></span>` +
      (busy ? `<span class="ed-slidepick__dot" data-kind="busy" title="Working"></span>`
        : pending ? `<span class="ed-slidepick__dot" data-kind="pending" title="Waiting on you"></span>` : "");
    row.querySelector(".ed-slidepick__name").textContent = slideTitle(s, i);
    row.addEventListener("click", () => {
      slideMenuOpen = false;
      ctx.iface.selectSlide(i);
    });
    menu.appendChild(row);
  });
}

/** Best-effort human name for a slide in the picker: the first non-empty
 *  string field on its content, trimmed. Falls back to the template name so
 *  a slide is never nameless. */
function slideTitle(slide, i) {
  const c = slide.content || {};
  for (const key of ["title", "heading", "headline", "statement", "eyebrow", "label"]) {
    if (typeof c[key] === "string" && c[key].trim()) return c[key].trim().slice(0, 44);
  }
  for (const v of Object.values(c)) {
    if (typeof v === "string" && v.trim() && v.trim().length > 2) return v.trim().slice(0, 44);
  }
  return slide.templateReference?.templateName || `Slide ${i + 1}`;
}

function wireSlidePicker() {
  const btn = ctx.dom.aiSlidePicker;
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    slideMenuOpen = !slideMenuOpen;
    renderSlidePicker(ctx.iface.getSlides(), ctx.iface.getCurrentIndex());
  });
  document.addEventListener("click", (e) => {
    if (!slideMenuOpen) return;
    if (ctx.dom.aiSlideMenu?.contains(e.target) || btn.contains(e.target)) return;
    slideMenuOpen = false;
    renderSlidePicker(ctx.iface.getSlides(), ctx.iface.getCurrentIndex());
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && slideMenuOpen) {
      slideMenuOpen = false;
      renderSlidePicker(ctx.iface.getSlides(), ctx.iface.getCurrentIndex());
      btn.focus();
    }
  });
}

/** Keeps the thread pinned to the newest turn. Only auto-scrolls when the
 *  user is already near the bottom, so reading back through older turns
 *  isn't yanked away every time a step ticks. */
function scrollThread(force) {
  const el = ctx.dom.aiScroll;
  if (!el) return;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  if (force || nearBottom) el.scrollTop = el.scrollHeight;
}

/** Which slide the thread was last rendered for. Switching slides swaps the
 *  entire conversation, so the new one must open at its newest turn — without
 *  this, the scroll offset from the previous slide's thread carries over and
 *  a different conversation opens halfway up. */
let lastRenderedSlideId = null;

function renderAiPanelBody() {
  const slides = ctx.iface.getSlides();
  const currentIndex = ctx.iface.getCurrentIndex();
  const slide = slides[currentIndex];
  if (!slide) return;
  if (aiStates.size > 0) {
    const liveIds = new Set(slides.map((s) => s.id));
    if ([...aiStates.keys()].some((id) => !liveIds.has(id))) pruneStates(liveIds);
  }
  const state = stateFor(slide.id);
  // A wholesale re-render can wipe a card mid-hover, so its mouseleave never
  // fires and a hint outline is stranded on the canvas.
  for (const el of ctx.iface.getCanvas()?.querySelectorAll(".is-ai-hint") || []) el.classList.remove("is-ai-hint");

  renderSlidePicker(slides, currentIndex);
  renderHealthSection();

  // ---- The conversation ---------------------------------------------------
  ctx.dom.aiActivity.innerHTML = "";
  const hasWorking = state.items.some((it) => it.status === "working");
  const newestSettled = newestSettledItem(state);

  if (state.items.length === 0 && !isWalkthroughActive()) {
    const scope = currentScope();
    const examples = emptyStateIntents({ scopeLevel: scope.level, slideIndex: currentIndex, count: 3 });
    const empty = document.createElement("div");
    empty.className = "ed-empty";
    empty.innerHTML =
      `<p class="ed-empty__lead">What should change on ${
        scope.level === "object" ? `the <strong>${escapeHtml(scope.label)}</strong>` : "this slide"
      }?</p>` +
      `<p class="ed-empty__hint">You'll see every change on the slide before it's applied.</p>` +
      `<ul class="ed-empty__examples">${examples
        .map((t) => `<li><button type="button" class="ed-ai__example" data-ex="${escapeHtml(t)}">${escapeHtml(t)}</button></li>`)
        .join("")}</ul>`;
    ctx.dom.aiActivity.appendChild(empty);
    for (const b of ctx.dom.aiActivity.querySelectorAll(".ed-ai__example")) {
      b.addEventListener("click", () => ctx.composer.draft(b.dataset.ex));
    }
  } else {
    // Oldest first: conversation.js unshifts newest to the front, so the
    // thread reads it back to front.
    for (const item of [...state.items].reverse()) {
      ctx.dom.aiActivity.appendChild(buildTurn(item, hasWorking, item === newestSettled));
    }
  }

  if (isWalkthroughActive()) {
    const walk = buildWalkthroughTurn(hasWorking);
    if (walk) ctx.dom.aiActivity.appendChild(walk);
  }

  // Announce a one-line summary; the panel itself is not a live region.
  if (ctx.dom.aiStatus) {
    const working = state.items.find((it) => it.status === "working");
    const active = state.items.find((it) => it.kind === "rewrite" && it.status === "ready");
    const activeCount = (active?.payload?.proposals || []).filter((p) => !p.rowStatus || p.rowStatus === "pending").length;
    const newest = state.items[0];
    ctx.dom.aiStatus.textContent =
      working ? "AI is working on this slide."
      : newest?.status === "cancelled" ? "Cancelled."
      : newest?.status === "error" ? newest.error || "Something went wrong."
      : activeCount ? `${activeCount} suggested ${activeCount === 1 ? "change" : "changes"} ready for review.`
      : "";
  }

  ctx.dom.aiClearBtn.hidden = state.items.length === 0;

  applyCanvasPreview();
  renderTaskStrip();
  renderJumpPill();
}

/** The public render. Every call preserves the user's scroll position and
 *  keyboard focus across the wholesale thread rebuild — without this, clicking
 *  "Diff" or accepting a row snapped the panel to the top and dropped focus to
 *  <body>. A slide change is the one case that deliberately jumps to the
 *  newest turn: a different slide is a different conversation. */
function renderAiPanel() {
  const slides = ctx.iface.getSlides();
  const slide = slides[ctx.iface.getCurrentIndex()];
  const slideChanged = !!slide && lastRenderedSlideId !== slide.id;
  if (slide) lastRenderedSlideId = slide.id;
  renderPreserving(ctx.dom.aiScroll, renderAiPanelBody, {
    mode: slideChanged ? "bottom" : "preserve",
    fallbackFocus: ctx.dom.aiInput,
  });
}

/** Only shown once the user has scrolled away from the newest turn, so a long
 *  conversation never strands them mid-history while work lands below. */
function renderJumpPill() {
  const pill = ctx.dom.aiJump;
  const sc = ctx.dom.aiScroll;
  if (!pill || !sc) return;
  const distance = sc.scrollHeight - sc.scrollTop - sc.clientHeight;
  // 48px, not the stick threshold: between the two the newest turn is
  // essentially visible already and a pill would just be noise.
  const show = !isStuck() && distance > 48 && sc.scrollHeight > sc.clientHeight;
  pill.hidden = !show;
  if (!show) return;
  const n = unseenCount();
  pill.querySelector("span").textContent = n > 0 ? `${n} new` : "Latest";
}

export function initPanel() {
  wireSlidePicker();
  wireScroll(ctx.dom.aiScroll, renderJumpPill);
  ctx.dom.aiJump?.addEventListener("click", () => {
    stickToBottom();
    scrollToBottom(ctx.dom.aiScroll);
    renderJumpPill();
    ctx.dom.aiInput?.focus({ preventScroll: true });
  });
  ctx.renderAiPanel = renderAiPanel;
  ctx.renderTaskStrip = renderTaskStrip;
  ctx.patchTaskStripElapsed = patchTaskStripElapsed;
}

export { renderAiPanel, renderTaskStrip, patchTaskStripElapsed };
