// product/ui/editor-ai/composer.js
import { ctx } from "./context.js";
import { stateFor, pushThread, currentScope, fieldLabel, newItem, scopeLabel, activeRewriteItem } from "./conversation.js";
import { initialPhase, setItemPhase, ensureLiveTicker } from "./thinking.js";
import { discardProposals, clearCanvasPreviewDom, wireReviewBar } from "./proposals.js";
import { resolveReviewIssue } from "./review.js";
import { sceneDigest } from "../lib/scene-graph.js";
import { api } from "../lib/api.js";

function wireAiWorkspace() {
  ctx.dom.aiComposer.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = ctx.dom.aiInput.value.trim();
    if (!text) return;
    if (currentSlideWorking()) return; // keep the typed message — clearing it while a send is impossible eats it silently
    ctx.dom.aiInput.value = "";
    autoGrowAi();
    syncSendState();
    sendAi(text, "rewrite");
  });
  ctx.dom.aiInput.addEventListener("input", () => { autoGrowAi(); syncSendState(); });
  ctx.dom.aiInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!ctx.dom.aiSend.disabled) ctx.dom.aiComposer.requestSubmit(); }
  });
  ctx.dom.aiClearBtn.addEventListener("click", () => {
    const slide = ctx.iface.getSlides()[ctx.iface.getCurrentIndex()];
    if (!slide) return;
    clearCanvasPreviewDom();
    const state = stateFor(slide.id);
    // Abort any still-in-flight requests before dropping their items — same
    // cancelItem loop pruneStates uses for deleted slides — so a cleared
    // request is actually cancelled and the per-slide working gate doesn't
    // stay falsely true after the items that held it are gone.
    for (const item of state.items) {
      if (item.status === "working") cancelItem(item.id);
    }
    state.items = [];
    state.phase = "idle";
    ctx.renderAiPanel();
  });
  wireReviewBar();
}
function autoGrowAi() {
  ctx.dom.aiInput.style.height = "auto";
  ctx.dom.aiInput.style.height = `${Math.min(ctx.dom.aiInput.scrollHeight, 160)}px`;
}
/** True only when the slide currently showing has an in-flight AI request —
 *  the per-slide gate that replaced the old global `busy` check for AI
 *  think calls (writes still use the host's global busy). */
function currentSlideWorking() {
  const slide = ctx.iface.getSlides()[ctx.iface.getCurrentIndex()];
  return !!slide && stateFor(slide.id).items.some((it) => it.status === "working");
}
function syncSendState() { ctx.dom.aiSend.disabled = !ctx.dom.aiInput.value.trim() || currentSlideWorking(); }

/** Structured fields (arrays of objects — table rows, card grids) USED to be
 *  withheld from the AI on the reasoning that their shape can't survive a
 *  free-text rewrite. With the v2 library that excluded 693 of 1,226 fields
 *  and made 31 templates entirely un-editable by AI, which is most of the
 *  value gone. They are sent now: the model is told each field's exact type
 *  and shape, and anything that comes back with the wrong shape is dropped
 *  client-side (sameShape below) before it can ever reach the slide. */
/** True for values/keys the AI must never rewrite as prose: asset paths,
 *  image URLs, and color tokens. A "rewritten" URL or hex passes every
 *  render check (a broken src doesn't throw) and quietly destroys the
 *  slide's imagery. */
function isAssetLikeField(key, value) {
  if (/(image|photo|icon|logo|avatar|src)$/i.test(key) || /^(image|photo|icon|logo|avatar)/i.test(key)) return true;
  if (/(color|accent)$/i.test(key)) return true;
  if (typeof value === "string" && (/^(https?:)?\/\//.test(value) || /^assets\//.test(value) || /^#[0-9a-f]{3,8}$/i.test(value) || /\.(png|jpe?g|svg|webp|gif)$/i.test(value))) return true;
  return false;
}

/** Does `next` still fit where `prev` came from? Scalars and flat lists are
 *  unconstrained — any string is a valid string. Structured rows are not: the
 *  template indexes into each row's own keys, so a row that loses a key (or
 *  stops being an object) renders blank or throws. Compares against the row
 *  shape actually in use rather than the schema text, which is prose. */
function sameShape(prev, next) {
  // A single object field (e.g. a `meta` block) is just as shape-bound as a
  // row list — the template reads its keys directly.
  if (prev && typeof prev === "object" && !Array.isArray(prev)) {
    if (!next || typeof next !== "object" || Array.isArray(next)) return false;
    for (const key of Object.keys(prev)) if (!(key in next)) return false;
    return true;
  }
  const prevIsRows = Array.isArray(prev) && prev.some((r) => r && typeof r === "object");
  if (!prevIsRows) return true; // scalar or flat list — nothing to preserve
  if (!Array.isArray(next) || !next.length) return false;
  const template = prev.find((r) => r && typeof r === "object");
  const wantArrayRows = Array.isArray(template);
  for (const row of next) {
    if (wantArrayRows) {
      if (!Array.isArray(row) || row.length !== template.length) return false;
      continue;
    }
    if (!row || typeof row !== "object" || Array.isArray(row)) return false;
    // Every key the template row relies on must still be present.
    for (const key of Object.keys(template)) if (!(key in row)) return false;
  }
  return true;
}

function editableContentForAi() {
  const slide = ctx.iface.getSlides()[ctx.iface.getCurrentIndex()];
  const out = {};
  for (const def of ctx.iface.getFieldDefs()) {
    if (isAssetLikeField(def.key, slide.content[def.key])) continue;
    out[def.key] = slide.content[def.key];
  }
  return out;
}

/** Words that mean "the shape of this slide is wrong", not "reword it".
 *  A cheap pre-filter so ordinary copy edits keep their single fast call and
 *  only structural asks pay for the planning round-trip. */
const STRUCTURAL_HINT = /\b(layout|template|design|redesign|restructure|split|another slide|new slide|add a slide|extra slide|image|photo|picture|visual|columns?|chart|diagram|too (dense|long|much|crowded)|doesn'?t fit|break (this |it )?(up|into)|two slides|timeline|(comparison )?table|reorder)\b/i;

// One in-flight AI call PER SLIDE — different slides are independent CLI
// processes, so each gets its own AbortController, keyed by work-item id.
// Entries are removed in sendAi's finally, whether the request settled,
// errored, or was cancelled.
const controllers = new Map();

/** Aborts the in-flight AI fetch for a given work item, if any. The catch in
 *  sendAi distinguishes AbortError from a real failure and marks the item
 *  "cancelled" instead of "error". Called from a card's own Cancel button
 *  and from the cross-slide task strip's Cancel — same function either way. */
function cancelItem(itemId) {
  controllers.get(itemId)?.abort();
}

async function sendAi(text, action, { fromReview = false, reviewIssueIndex = null } = {}) {
  const slide = ctx.iface.getSlides()[ctx.iface.getCurrentIndex()];
  const state = stateFor(slide.id);
  if (state.items.some((it) => it.status === "working")) return false; // one in-flight AI request per slide — a second would race the first's proposals
  if (state.phase === "review") discardProposals({ silent: true }); // a new ask supersedes the pending review
  const scope = currentScope();
  const currentIndex = ctx.iface.getCurrentIndex();
  const item = newItem(state, { kind: "rewrite", ask: text, scopeLabel: scopeLabel(scope, currentIndex), action });
  // Tags an item as having come from the review card's "Fix" button — used
  // by followUpsFor (intents.js) to offer the "Fix the next issue" chip once
  // this item settles, and by review.js to track which issue is currently
  // being resolved (one at a time) and to auto-return to the review view
  // once this item's rows are all decided. Survives the kind flip to
  // "layout" below since it's the same item object.
  if (fromReview) {
    item.fromReview = true;
    item.reviewIssueIndex = reviewIssueIndex;
  }
  // Phase is set from what will ACTUALLY run, and updated only when the
  // request genuinely moves on — never on a timer. See thinking.js.
  item.phase = initialPhase(action, text, STRUCTURAL_HINT.test(text));
  item.scopeAtSend = scope;
  pushThread(state, slide.id, "user", scope.level === "object" ? `(about the ${scope.label}) ${text}` : text);
  state.phase = "working";
  const abort = new AbortController();
  controllers.set(item.id, abort);
  ctx.renderAiPanel();
  syncSendState();
  ensureLiveTicker();

  const instructions = scope.level === "object"
    ? `Focus on the "${scope.label}" field specifically. ${text}`
    : scope.level === "visual"
      ? `The user selected the visual element "${scope.label}" ${scope.detail}${scope.text ? ` showing "${scope.text.slice(0, 80)}"` : ""} — it is template chrome, not a content field, so satisfy the request through the content fields or explain what would have to change. ${text}`
      : text;

  // Snapshot what the model was shown: any field the user edits while the
  // request is in flight must NOT be proposed over — accepting would clobber
  // their newer text with a rewrite of the older one.
  const contentAtSend = structuredClone(editableContentForAi());
  const sceneAtSend = ctx.iface.getScene(); // digest ids belong to THIS graph generation

  try {
    // Structural asks ("this is too dense", "add a photo", "split this")
    // are planned against the real template catalog first — the answer may
    // be a different layout or an extra slide, not just different words.
    if (STRUCTURAL_HINT.test(text)) {
      const layoutNow = sceneDigest(ctx.iface.getScene());
      const plan = await api.planSlideChange(ctx.iface.presentationId, slide.id, {
        instruction: layoutNow ? `${text}\n\n[Current slide layout, 1920×1080 units: ${layoutNow}]` : text,
        signal: abort.signal,
      });
      if (!state.items.includes(item)) return true; // cleared/evicted while awaiting — the catch below already settled it
      if (plan.operation === "template" || plan.operation === "addSlide") {
        item.kind = "layout";
        item.payload = { structural: { ...plan, slideId: slide.id } };
        item.status = "ready";
        item.elapsedMs = Date.now() - item.createdAt;
        state.phase = "review";
        return true;
      }
      // operation === "content" — fall through to the ordinary copy edit,
      // keeping the model's reason as context for the rewrite.
      if (plan.reason) item.planReason = plan.reason;
      // Planning is done and the rewrite call is about to start — a real
      // transition, so the label moves now rather than on a tick.
      setItemPhase(item, "writing", scope);
    }

    const layout = sceneDigest(ctx.iface.getScene());
    const result = await api.assistEditorSlide(ctx.iface.presentationId, slide.id, {
      action,
      content: contentAtSend,
      instructions: layout ? `${instructions}\n\n[Slide layout, in 1920×1080 units: ${layout}]` : instructions,
      history: state.thread.slice(0, -1), // everything before the ask just pushed
      signal: abort.signal,
    });
    if (!state.items.includes(item)) return true; // cleared/evicted while awaiting
    // Write paths REPLACE array elements (liveSlides[idx] = updated), so the
    // captured `slide` reference from send time can be stale by the time this
    // settles — comparing against it would never catch a meanwhile-edit.
    // Re-resolve the live slide by id (null if it was deleted while in flight).
    const liveSlide = ctx.iface.getSlides().find((s) => s.id === slide.id) || null;
    const liveContent = liveSlide?.content || {};
    // Two distinct drop reasons get two distinct notices: the slide itself
    // is gone (deleted, or the user navigated away and back to a different
    // one) vs. this specific field was hand-edited while the AI worked. The
    // former is a neutral fact; the latter names what the user did.
    const editedMeanwhile = (field) => liveSlide && !ctx.iface.deepEqual(liveContent[field], contentAtSend[field]);
    let droppedForSlideChange = !liveSlide && (
      (result.content && Object.keys(result.content).length > 0) ||
      (Array.isArray(result.layout) && result.layout.length > 0));
    let droppedForFieldEdit = false;
    // A field-level scope is a hard boundary, not a hint: the prompt only
    // asks the model to focus on one field, and it sometimes answers with a
    // sibling field changed too. Drop anything outside the scoped field
    // before it ever becomes a proposal card — the user asked about one
    // field and must only ever be shown that one.
    const scopedField = scope.level === "object" ? scope.field : null;
    let droppedForShape = false;
    const proposals = result.content
      ? Object.entries(result.content)
          .filter(([field]) => !scopedField || field === scopedField)
          .filter(([field, value]) => !ctx.iface.deepEqual(liveContent[field], value))
          // Structured fields are now sent to the AI, so its answer must be
          // checked against the shape the template actually needs. The backend
          // would reject a bad one anyway (assertRenders), but failing here is
          // both faster and honest — the user sees "some suggestions were
          // dropped", not a slide that refuses to save.
          .filter(([field, value]) => {
            if (sameShape(liveContent[field], value)) return true;
            droppedForShape = true;
            return false;
          })
          .filter(([field]) => {
            if (!liveSlide) return false;
            if (!editedMeanwhile(field)) return true;
            droppedForFieldEdit = true;
            return false;
          })
          .map(([field, value]) => ({
            field, value, editing: false,
            prev: structuredClone(liveContent[field]),
            label: fieldLabel(field),
          }))
      : [];
    // Layout operations come back addressed to object ids from the digest;
    // resolve them against the graph generation the model actually saw and
    // keep only ops whose object still compiles to a style key. Same gate as
    // content proposals: if the slide is gone or the scene generation moved
    // on, the ops are stale and must not be offered.
    const layoutOps = !liveSlide ? [] : (Array.isArray(result.layout) ? result.layout : [])
      .map((op) => {
        const obj = sceneAtSend?.objects.find((o) => o.id === op.objectId && o.editable);
        if (!obj || !obj.origin?.templateField) return null;
        const key = ctx.iface.styleKeyFor({
          kind: obj.origin.kind, field: obj.origin.templateField,
          index: obj.origin.index, rowIndex: obj.origin.rowIndex, subKey: obj.origin.subKey,
        });
        if (!key) return null;
        const patch = {};
        if (op.dx !== undefined || op.dy !== undefined) { patch.dx = op.dx || 0; patch.dy = op.dy || 0; }
        if (op.scale !== undefined) patch.size = op.scale;
        if (op.align !== undefined) patch.align = op.align;
        if (op.weight !== undefined) patch.weight = op.weight;
        if (!Object.keys(patch).length) return null;
        return { key, patch, label: obj.ai.label, note: op.note || "" };
      })
      .filter(Boolean);
    const advice = Array.isArray(result.suggestions) ? result.suggestions : [];

    item.elapsedMs = Date.now() - item.createdAt;
    if (proposals.length || layoutOps.length) {
      item.kind = "rewrite";
      item.payload = { proposals, layoutOps, advice };
      item.status = "ready";
      pushThread(state, slide.id, "assistant",
        `proposed changes to ${proposals.map((p) => p.label).join(", ")}`);
    } else {
      // Nothing to review — the outcome is a note, not an error and not a
      // reviewable change. Kept as an advice-kind item so the feed still
      // records that the ask ran and what came back.
      item.kind = "advice";
      item.payload = {
        advice: advice.length ? advice : ["The AI didn't suggest any changes for that ask."],
      };
      if (droppedForShape) {
        item.payload.advice = [...item.payload.advice, "Some suggestions came back in the wrong shape for this template and were dropped."];
      }
      if (droppedForSlideChange) {
        item.payload.advice = [...item.payload.advice, "The slide changed before the suggestions landed."];
      } else if (droppedForFieldEdit) {
        item.payload.advice = [...item.payload.advice, "Some suggestions were dropped because that text was edited while the AI was working."];
      }
      item.status = "ready";
    }
    state.phase = activeRewriteItem(state) ? "review" : "idle";
  } catch (err) {
    if (!state.items.includes(item)) return true; // cleared/evicted while awaiting
    if (err?.name === "AbortError") {
      item.status = "cancelled";
    } else {
      item.status = "error";
      item.error = ctx.iface.errText(err, "Could not reach the AI assistant.");
    }
    item.elapsedMs = Date.now() - item.createdAt;
    state.phase = activeRewriteItem(state) ? "review" : "idle";
    // A cancelled/failed review-originated fix must not strand the review
    // on "resolving issue N" with no way back — return to the checklist
    // (not resolved, so the issue stays open and Fix works again).
    if (item.fromReview) resolveReviewIssue(item.reviewIssueIndex, false);
  } finally {
    controllers.delete(item.id);
    if (ctx.iface.getSlides()[ctx.iface.getCurrentIndex()]?.id === slide.id) {
      ctx.renderAiPanel();
      syncSendState();
    } else {
      // Item settled on a slide the user isn't currently viewing — don't
      // touch that slide's panel DOM (it isn't mounted), but the task strip
      // is cross-slide and must drop this row now, not on the next tick.
      ctx.renderTaskStrip?.();
    }
  }
  return true;
}

function focusComposer() { ctx.dom.aiInput.focus(); }

function draft(text) {
  ctx.dom.aiInput.value = text;
  autoGrowAi();
  syncSendState();
  ctx.dom.aiInput.focus();
  ctx.dom.aiInput.setSelectionRange(ctx.dom.aiInput.value.length, ctx.dom.aiInput.value.length);
}

export function initComposer() {
  ctx.sendAi = sendAi;
  ctx.composer = { draft, cancelItem };
}

/** True while the CURRENT slide has an in-flight AI request — exposed to the
 *  host for the floating toolbar / context menu's quick actions, which only
 *  ever act on the currently-viewed slide. Same gate the composer uses. */
function slideBusy() { return currentSlideWorking(); }

export { sendAi, wireAiWorkspace, focusComposer, syncSendState, cancelItem, slideBusy };
