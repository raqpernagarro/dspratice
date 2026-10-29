// product/ui/editor-ai/conversation.js
// Per-slide AI state and the running conversation thread (sessionStorage),
// plus the scope line ("Slide 3 · Headline selected") above the composer.
import { ctx } from "./context.js";
import { escapeHtml } from "../lib/dom.js";
// Call-time only (never at module init) — proposals.js imports stateFor/
// pushThread/etc. from this module, so this is a circular import; it's safe
// because settlePhase is only invoked from inside newItem(), well after both
// modules have finished evaluating.
import { settlePhase } from "./proposals.js";

/** Per-slide AI workspace state, kept in memory only (session-scoped — there
 *  is no persistence model for it on the backend, and inventing one is out
 *  of scope for this pass). Keyed by slide id. Shape:
 *  { phase: "idle"|"working"|"review", items: [], thread: [] }
 *
 *  Every AI interaction is a work item — one card that carries the ask and
 *  its outcome through a lifecycle (see WORK_ITEM_CAP / newItem). Newest
 *  first, capped so the feed can't grow without bound. */
export const aiStates = new Map();

const WORK_ITEM_CAP = 8;

/** Creates a work item, unshifts it onto state.items (newest first) and
 *  caps the list. Returns the item so the caller can fill it in as the
 *  request progresses. */
export function newItem(state, { kind, ask, scopeLabel, action } = {}) {
  const item = {
    id: crypto.randomUUID(),
    kind,
    ask,
    scopeLabel,
    action,
    status: "working",
    createdAt: Date.now(),
    startedAt: Date.now(), // ticker/strip elapsed source — distinct from createdAt in spirit even though equal at creation
    elapsedMs: null,
    error: null,
    steps: [],
    payload: null,
  };
  state.items.unshift(item);
  state.items = state.items.slice(0, WORK_ITEM_CAP);
  // An evicted item could have been the one holding phase "review" pending —
  // without this, the panel could strand in "review" with nothing left to
  // review once its card falls off the cap.
  settlePhase(state);
  return item;
}

/** The newest rewrite item still in play (its proposals are what the canvas
 *  preview paints and the review bar counts) — or null if none. */
export function activeRewriteItem(state) {
  return state.items.find((it) => it.kind === "rewrite" && (it.status === "ready" || it.status === "working")) || null;
}

/** Human label for what an ask applied to, e.g. "Slide 3 · Headline" — used
 *  both for the scope row and stamped onto each item at send time. */
export function scopeLabel(scope, currentIndex) {
  const base = `Slide ${currentIndex + 1}`;
  return scope.level === "object" || scope.level === "visual" ? `${base} · ${scope.label}` : base;
}

export function currentScope() {
  const selection = ctx.iface.getSelection();
  const currentIndex = ctx.iface.getCurrentIndex();
  const fieldDefs = ctx.iface.getFieldDefs();
  if (selection?.kind === "visual") {
    const o = selection.object;
    return {
      level: "visual",
      label: o?.ai?.label || "this element",
      detail: o?.geometry ? `at (${Math.round(o.geometry.x)},${Math.round(o.geometry.y)}), ${Math.round(o.geometry.width)}×${Math.round(o.geometry.height)}` : "",
      text: o?.content?.text || "",
    };
  }
  if (selection?.kind === "image") {
    // Image sources aren't sent to the AI (isAssetLikeField) — scope stays
    // at slide level rather than pretending the image is in play.
    return { level: "slide", index: currentIndex };
  }
  if (selection?.kind === "deck") {
    // Footer text is deck chrome, outside the slide's content schema — the
    // AI assist path edits schema fields, so scope stays at slide level with
    // an honest label rather than pretending the footer is in play.
    return { level: "slide", index: currentIndex };
  }
  if (selection) {
    const def = fieldDefs.find((d) => d.key === selection.field);
    return { level: "object", field: selection.field, label: def?.label || selection.field };
  }
  return { level: "slide", index: currentIndex };
}

/** Renders the scope readout as a chip row: "Presentation · Slide N · [<el> ×]".
 *  The element chip only appears once an object/visual is selected, and its
 *  × is a real button that clears the canvas selection (the host re-triggers
 *  this render on the resulting selection-change, so the chip disappears on
 *  its own — no local re-render needed here). */
/** Two scope-appropriate placeholder hints per level, alternated on every
 *  scope change (selection made/cleared, slide switched) — a plain rotation,
 *  no timer. Never overwrites text the user is mid-typing. */
const PLACEHOLDER_HINTS = {
  slide: ["What do you want to change on this slide?", "Try a different layout, tone, or photo."],
  object: (label) => [`Rewrite the ${label}…`, `Make the ${label} shorter, punchier, or clearer.`],
  visual: (label) => [`What should happen to "${label}"?`, `Move, resize, or restyle "${label}".`],
};
let placeholderTick = 0;

export function renderAiScope() {
  const scope = currentScope();
  ctx.dom.aiScopeEl.dataset.level = scope.level;

  const hints = scope.level === "object" ? PLACEHOLDER_HINTS.object(scope.label)
    : scope.level === "visual" ? PLACEHOLDER_HINTS.visual(scope.label)
    : PLACEHOLDER_HINTS.slide;
  ctx.dom.aiInput.placeholder = hints[placeholderTick++ % hints.length];

  // Which slide is in play is the panel header's job now (the slide picker),
  // so this row is ONLY about a narrower selection inside that slide — and it
  // disappears entirely when there isn't one. It used to restate
  // "Presentation · Slide N" on every render, which said nothing the header
  // didn't already say.
  const hasElement = scope.level === "object" || scope.level === "visual";
  ctx.dom.aiScopeEl.hidden = !hasElement;
  ctx.dom.aiScopeText.innerHTML = hasElement
    ? `<span class="ed-ai__chip ed-ai__chip--element">${escapeHtml(scope.label)}` +
      `<button type="button" class="ed-ai__chip-x" id="ai-scope-clear" aria-label="Clear selection">×</button></span>`
    : "";
  ctx.dom.aiScopeText.querySelector("#ai-scope-clear")?.addEventListener("click", () => ctx.iface.clearSelection());

  // The empty state's prompt examples are scope-specific — narrowing to an
  // element while the panel is idle must re-offer element-level phrasing.
  if (ctx.dom.aiActivity.querySelector(".ed-empty__examples")) ctx.renderAiPanel();
}

/* The conversation itself persists per slide (sessionStorage): closing and
 * reopening the editor keeps the dialogue, so "now make it more persuasive"
 * still has its "make it shorter" to build on. */
function threadKey(slideId) { return `nps:thread:${ctx.iface.presentationId}:${slideId}`; }
function loadThread(slideId) {
  try { return JSON.parse(sessionStorage.getItem(threadKey(slideId))) || []; } catch { return []; }
}
export function pushThread(state, slideId, role, text) {
  state.thread.push({ role, text });
  state.thread = state.thread.slice(-12);
  try { sessionStorage.setItem(threadKey(slideId), JSON.stringify(state.thread)); } catch { /* full/blocked */ }
}

/** Drops aiStates (and their sessionStorage thread keys) for slides that no
 *  longer exist — deleted slides otherwise leak state for the life of the
 *  tab. `existingSlideIds` is whatever the caller currently has (an array or
 *  Set of ids). */
export function pruneStates(existingSlideIds) {
  const live = existingSlideIds instanceof Set ? existingSlideIds : new Set(existingSlideIds);
  for (const slideId of [...aiStates.keys()]) {
    if (live.has(slideId)) continue;
    const state = aiStates.get(slideId);
    // The slide is gone — abort any still-in-flight request for it via the
    // composer's callback (ctx.composer, registered like ctx.sendAi) rather
    // than importing composer.js directly, which would cycle back here.
    for (const item of state.items) {
      if (item.status === "working") ctx.composer?.cancelItem(item.id);
    }
    aiStates.delete(slideId);
    try { sessionStorage.removeItem(threadKey(slideId)); } catch { /* full/blocked */ }
  }
}

export function stateFor(slideId) {
  if (!aiStates.has(slideId)) {
    aiStates.set(slideId, {
      phase: "idle",
      items: [],
      thread: loadThread(slideId), // the running conversation — survives reloads
    });
  }
  return aiStates.get(slideId);
}

export function fieldLabel(field) {
  return ctx.iface.getFieldDefs().find((d) => d.key === field)?.label || field;
}

/** Status chip labels shared by every card renderer. */
export const STATUS_LABEL = {
  working: "Working",
  ready: "Ready",
  applied: "Applied",
  partial: "Partial",
  discarded: "Discarded",
  cancelled: "Cancelled",
  // "Failed", not "Error" — matches the Activity System milestone's named
  // states (Working/Ready/Applied/Cancelled/Failed) exactly; the internal
  // status string stays "error" everywhere else, this is display-only.
  error: "Failed",
};

/** "just now" under a minute, "Nm ago" under an hour, else "Hh ago" —
 *  rendered once at card-build time, no ticking timer. */
export function relativeTime(ts) {
  const secs = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return `${hours}h ago`;
}

/** Inline 16px kind glyphs (`js/icons.js`-style) for the card header. */
export const KIND_GLYPH = {
  rewrite: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 2.5l3 3-8 8-3.5.5.5-3.5 8-8z"/></svg>`,
  layout: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>`,
  review: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none"/></svg>`,
  advice: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5a4.5 4.5 0 0 0-2.5 8.25c.35.28.5.68.5 1.05v.7h4v-.7c0-.37.15-.77.5-1.05A4.5 4.5 0 0 0 8 1.5z"/><path d="M6.25 14h3.5"/></svg>`,
  error: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2l6.5 11.5h-13z"/><path d="M8 6.5v3.2"/><circle cx="8" cy="11.7" r=".2" fill="currentColor" stroke="none"/></svg>`,
};

export function glyphFor(item) {
  return KIND_GLYPH[item.status === "error" ? "error" : item.kind] || KIND_GLYPH.advice;
}

export function initConversation() {
  ctx.renderAiScope = renderAiScope;
}
