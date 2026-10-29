// product/ui/editor-ai/structural.js
import { ctx } from "./context.js";
import { stateFor, pushThread, STATUS_LABEL, relativeTime, KIND_GLYPH } from "./conversation.js";
import { deriveItemStatus, settlePhase, settleReviewLink } from "./proposals.js";
import { resolveReviewIssue } from "./review.js";
import { escapeHtml, toast } from "../lib/dom.js";
import { api } from "../lib/api.js";

/** For a whole structural PLAN item (kind:"layout") reaching "applied" or
 *  "discarded" — always terminal either way (no "partial" state for an
 *  all-or-nothing plan), unlike proposals.js's settleReviewLink, which is
 *  used below for layoutOp rows living on an ordinary rewrite item instead
 *  (those DO have a "ready"/"partial" in-between and need that guard). */
function settlePlanReviewLink(item) {
  if (!item?.fromReview) return;
  resolveReviewIssue(item.reviewIssueIndex, item.status === "applied");
}

/** A layout op row is still "pending" if it's never been touched — same
 *  convention as proposal rows (isPending in proposals.js). */
export function isOpPending(op) { return !op.rowStatus || op.rowStatus === "pending"; }

/** Full card for a kind:"layout" item — a structural plan (template swap or
 *  a new slide). Same anatomy as buildRewriteCard: header (glyph, ask,
 *  status chip), sub-line, then the plan itself as a single row so it can
 *  carry the same pending/applied/discarded lifecycle as a proposal row. */
export function buildLayoutCard(item) {
  const card = document.createElement("article");
  card.className = "ed-item";
  card.dataset.kind = "layout";
  card.dataset.status = item.status;
  card.dataset.itemId = item.id; // scroll target for the Pending Changes queue's per-item link
  card.setAttribute("aria-label", `layout — ${item.ask} — ${STATUS_LABEL[item.status] || item.status}`);

  const elapsed = item.elapsedMs ? ` · ${Math.round(item.elapsedMs / 1000)}s` : "";
  card.innerHTML = `
    <header class="ed-item__head">
      <span class="ed-item__glyph" aria-hidden="true">${KIND_GLYPH.layout}</span>
      <span class="ed-item__ask" title="${escapeHtml(item.ask)}">${escapeHtml(item.ask)}</span>
      <span class="ed-item__chip" data-chip="${item.status}">${STATUS_LABEL[item.status] || item.status}</span>
    </header>
    <p class="ed-item__sub">${item.scopeLabel ? `${escapeHtml(item.scopeLabel)} · ` : ""}${relativeTime(item.createdAt)}${elapsed}</p>
    <div class="ed-item__body"></div>`;

  const plan = item.payload?.structural;
  if (plan) card.querySelector(".ed-item__body").appendChild(buildStructuralRow(plan, item));
  return card;
}

function buildStructuralRow(plan, item) {
  const row = document.createElement("div");
  row.className = "ed-item__row";
  const isAdd = plan.operation === "addSlide";

  if (item.status === "applied" || item.status === "discarded") {
    row.dataset.rowStatus = item.status;
    row.innerHTML = item.status === "applied"
      ? `<span class="ed-item__row-check" aria-hidden="true">✓</span><span class="ed-item__row-label">${escapeHtml(item.outcome || `Layout → ${plan.templateName}`)}</span>`
      : `<span class="ed-item__row-label ed-item__row-label--struck">${escapeHtml(isAdd ? "New slide" : "Change layout")} — ${escapeHtml(plan.templateName)}</span>`;
    return row;
  }

  const fields = Object.keys(plan.content || {}).length;
  row.dataset.rowStatus = "pending";
  // Same What changes / Why anatomy as a rewrite row's facts — a structural
  // plan already carries a real reason from the model (plan.reason), so
  // nothing here is synthesized.
  row.innerHTML = `
    <div class="ed-item__row-head">
      <span class="ed-item__chipfield">${isAdd ? "New slide" : "Change layout"}</span>
    </div>
    <dl class="ed-item__row-facts">
      <div class="ed-item__row-fact"><dt>What changes</dt><dd>${escapeHtml(plan.templateName)} — ${fields} field${fields === 1 ? "" : "s"} drafted</dd></div>
      ${plan.reason ? `<div class="ed-item__row-fact"><dt>Why</dt><dd>${escapeHtml(plan.reason)}</dd></div>` : ""}
    </dl>
    <div class="ed-item__row-actions">
      <button type="button" class="ed-item__btn ed-item__btn--accept" data-act="apply">${isAdd ? "Add slide" : "Apply layout"}</button>
      <button type="button" class="ed-item__btn ed-item__btn--discard" data-act="discard">Discard</button>
    </div>`;
  row.querySelector('[data-act="apply"]').addEventListener("click", () => applyStructuralPlan(item));
  row.querySelector('[data-act="discard"]').addEventListener("click", () => {
    item.status = "discarded";
    settlePlanReviewLink(item);
    stateFor(ctx.iface.getSlides()[ctx.iface.getCurrentIndex()].id).phase = "idle";
    ctx.renderAiPanel();
  });
  return row;
}

/** Applies a planned layout change through the engine paths that already
 *  exist — swapSlideTemplate + updateSlide, or addSlide — so an AI-authored
 *  structural change is coerced and render-checked exactly like a manual one. */
export async function applyStructuralPlan(item) {
  const plan = item.payload.structural;
  const slide = ctx.iface.getSlides()[ctx.iface.getCurrentIndex()];
  const state = stateFor(slide.id);
  ctx.iface.setBusy(true);
  ctx.iface.beginSave();
  // Set only once the layout-swap branch's swapSlideTemplate call has
  // committed server-side but the follow-up content write hasn't landed
  // yet — the window in which a content-write failure would otherwise
  // leave the deck's real template silently changed under placeholder
  // content while the UI claims nothing was saved. See the revert in catch.
  let pendingSwapRevert = null;
  try {
    if (plan.operation === "addSlide") {
      const res = await api.addSlide(ctx.iface.presentationId, {
        templateName: plan.templateName,
        position: "after",
        relativeToSlideId: slide.id,
        content: plan.content,
      });
      ctx.iface.adoptSlides(res.presentation, res.index);
      const newId = res.slide.id;
      ctx.iface.pushHistory({
        label: "AI added a slide",
        slideId: slide.id,
        undo: async () => { const p = await api.deleteSlide(ctx.iface.presentationId, newId); ctx.iface.adoptSlides(p, Math.max(0, res.index - 1)); },
        redo: async () => {
          const again = await api.addSlide(ctx.iface.presentationId, {
            templateName: plan.templateName, position: "after", relativeToSlideId: slide.id, content: plan.content,
          });
          ctx.iface.adoptSlides(again.presentation, again.index);
        },
      });
      // No success toast — the row itself flips to a checkmarked "Slide
      // added" line (buildStructuralRow's applied branch), which is the
      // feedback now.
      item.outcome = "Slide added";
    } else {
      const beforeTemplate = slide.templateReference.templateName;
      const beforeContent = structuredClone(slide.content);
      await api.swapSlideTemplate(ctx.iface.presentationId, slide.id, { templateName: plan.templateName, allowOverride: true });
      // The swap call above already committed server-side — it fills the
      // new template's fields with safe carried-over/example content on
      // its own, independent of plan.content. Arm the revert now, before
      // the content write that can fail; disarm it the instant that write
      // succeeds.
      pendingSwapRevert = { beforeTemplate, beforeContent };
      const updated = await api.updateSlide(ctx.iface.presentationId, slide.id, { content: plan.content });
      pendingSwapRevert = null;
      const idx = ctx.iface.getSlides().findIndex((x) => x.id === updated.id);
      if (idx !== -1) ctx.iface.getSlides()[idx] = updated;
      ctx.iface.renderCanvas();
      ctx.iface.paintThumb(idx);
      ctx.iface.pushHistory({
        label: "AI changed the layout",
        slideId: slide.id,
        undo: async () => {
          await api.swapSlideTemplate(ctx.iface.presentationId, slide.id, { templateName: beforeTemplate, allowOverride: true });
          const back = await api.updateSlide(ctx.iface.presentationId, slide.id, { content: beforeContent });
          const i = ctx.iface.getSlides().findIndex((x) => x.id === back.id);
          if (i !== -1) ctx.iface.getSlides()[i] = back;
          ctx.iface.renderCanvas(); ctx.iface.paintThumb(i);
        },
        redo: async () => {
          await api.swapSlideTemplate(ctx.iface.presentationId, slide.id, { templateName: plan.templateName, allowOverride: true });
          const fwd = await api.updateSlide(ctx.iface.presentationId, slide.id, { content: plan.content });
          const i = ctx.iface.getSlides().findIndex((x) => x.id === fwd.id);
          if (i !== -1) ctx.iface.getSlides()[i] = fwd;
          ctx.iface.renderCanvas(); ctx.iface.paintThumb(i);
        },
      });
      // No success toast — see the addSlide branch above; the row's own
      // checkmark is the confirmation.
      item.outcome = `Layout → ${plan.templateName}`;
    }
    ctx.iface.endSave(true);
    item.status = "applied";
    settlePlanReviewLink(item);
    state.phase = "idle";
  } catch (err) {
    let message = ctx.iface.errText(err, "Could not apply that change.");
    if (pendingSwapRevert) {
      try {
        await api.swapSlideTemplate(ctx.iface.presentationId, slide.id, {
          templateName: pendingSwapRevert.beforeTemplate, allowOverride: true,
        });
        const restored = await api.updateSlide(ctx.iface.presentationId, slide.id, {
          content: pendingSwapRevert.beforeContent,
        });
        const i = ctx.iface.getSlides().findIndex((x) => x.id === restored.id);
        if (i !== -1) ctx.iface.getSlides()[i] = restored;
        ctx.iface.renderCanvas();
        ctx.iface.paintThumb(i);
      } catch {
        // The revert itself failed — the deck may now be sitting on the
        // new template with placeholder content. Say so plainly rather
        // than repeating "nothing was saved", which would be untrue.
        message = "This change could not be fully undone after it failed — reload to check the slide before editing it further.";
      }
    }
    ctx.iface.endSave(false);
    toast(message, "error");
  } finally {
    ctx.iface.setBusy(false);
    ctx.renderAiPanel();
  }
}

/** A layout operation row inside a rewrite card — reads as a design decision
 *  (what moves and why) and carries the same rowStatus lifecycle as a
 *  proposal row: pending (Apply/Discard), applied (muted checkmark), or
 *  discarded (struck), never removed from the card once touched. */
export function buildLayoutOpEl(op, item) {
  const row = document.createElement("div");
  row.className = "ed-item__row";
  row.dataset.rowStatus = op.rowStatus || "pending";

  if (op.rowStatus === "applied") {
    row.innerHTML = `
      <span class="ed-item__row-check" aria-hidden="true">✓</span>
      <span class="ed-item__row-label">${escapeHtml(op.label)}</span>`;
    return row;
  }
  if (op.rowStatus === "discarded") {
    row.innerHTML = `<span class="ed-item__row-label ed-item__row-label--struck">${escapeHtml(op.label)}</span>`;
    return row;
  }

  const bits = [];
  if (op.patch.dx || op.patch.dy) bits.push(`move ${op.patch.dx ?? 0}px, ${op.patch.dy ?? 0}px`);
  if (op.patch.size !== undefined) bits.push(`size ×${op.patch.size}`);
  if (op.patch.align) bits.push(`align ${op.patch.align}`);
  if (op.patch.weight) bits.push(`weight ${op.patch.weight}`);
  row.innerHTML = `
    <div class="ed-item__row-head">
      <span class="ed-item__chipfield">${escapeHtml(op.label)}</span>
      <span class="ed-item__row-summary">${escapeHtml(bits.join(" · "))}</span>
    </div>
    ${op.note ? `<p class="ed-structural__reason">${escapeHtml(op.note)}</p>` : ""}
    <div class="ed-item__row-actions">
      <button type="button" class="ed-item__btn ed-item__btn--accept" data-act="apply">Apply</button>
      <button type="button" class="ed-item__btn ed-item__btn--discard" data-act="discard">Discard</button>
    </div>`;
  row.querySelector('[data-act="apply"]').addEventListener("click", () => applyLayoutOp(op, item));
  row.querySelector('[data-act="discard"]').addEventListener("click", () => {
    const st = stateFor(ctx.iface.getSlides()[ctx.iface.getCurrentIndex()].id);
    op.rowStatus = "discarded";
    item.status = deriveItemStatus(item);
    settleReviewLink(item);
    settlePhase(st);
    ctx.renderAiPanel();
    if (ctx.dom.aiStatus) ctx.dom.aiStatus.textContent = "Suggestion discarded.";
  });
  return row;
}

async function applyLayoutOp(op, item) {
  const slide = ctx.iface.getSlides()[ctx.iface.getCurrentIndex()];
  const st = stateFor(slide.id);
  const prevMap = structuredClone(slide.styleOverrides || {});
  const nextMap = structuredClone(prevMap);
  const merged = { ...(nextMap[op.key] || {}) };
  if (op.patch.dx !== undefined || op.patch.dy !== undefined) {
    merged.dx = Math.round(((merged.dx || 0) + (op.patch.dx || 0)) * 10) / 10;
    merged.dy = Math.round(((merged.dy || 0) + (op.patch.dy || 0)) * 10) / 10;
  }
  if (op.patch.size !== undefined) merged.size = op.patch.size;
  if (op.patch.align !== undefined) merged.align = op.patch.align;
  if (op.patch.weight !== undefined) merged.weight = op.patch.weight;
  nextMap[op.key] = merged;
  slide.styleOverrides = nextMap;
  await ctx.iface.writeStyle(slide, nextMap, prevMap);
  ctx.iface.renderCanvas();
  op.rowStatus = "applied";
  item.status = deriveItemStatus(item);
  settleReviewLink(item);
  settlePhase(st);
  pushThread(st, slide.id, "user", `applied the ${op.label} layout change`);
  ctx.renderAiPanel();
  if (ctx.dom.aiStatus) ctx.dom.aiStatus.textContent = `${op.label} updated.`;
}
