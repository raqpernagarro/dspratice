// =============================================================================
// Presentation Editor — AI-native rebuild.
//
// MENTAL MODEL. Not "a form that edits a record" — a canvas you work on with
// an AI collaborator beside you.
//
//   · lib/editable-canvas.js decorates the rendered slide so its own text IS
//     the editing surface — click selects, double-click (or Enter) edits,
//     Esc reverts. No sidebar form, no template internals.
//   · The right panel is a persistent AI conversation, automatically scoped
//     to whatever is selected (or the current slide if nothing is). Every AI
//     rewrite lands as a proposal — Accept / Edit / Reject — never a silent
//     write.
//   · ⌘K opens a command palette for everything else: navigation, slide
//     actions, and free text that doesn't match a command falls through to
//     "Ask AI: …".
//
// WHAT DIDN'T CHANGE, AND WHY: the rail (thumbnails, drag-reorder, add/
// duplicate/delete/swap), zoom, autosave plumbing, and the undo/redo stack
// are the same mechanisms as before — none of that was what users pushed
// back on, and rebuilding it would be exactly the "duplicated architecture"
// this pass is supposed to avoid. What's new sits on top of it.
//
// LIVE-TYPING NEVER REBUILDS THE CANVAS. A keystroke inside a decorated span
// updates the in-memory model and schedules a debounced commit — it must
// NOT rebuild the stage from buildStage(), or the caret/focus the user is
// mid-edit in would be destroyed on every autosave tick. Only slide
// switches, undo/redo, and AI-proposal Accepts rebuild the canvas; a plain
// text commit only needs to repaint the (separate) rail thumbnail.
// =============================================================================
import { api, ApiError } from "./lib/api.js";
import { escapeHtml, cssEscape, trapFocus, toast } from "./lib/dom.js";
import { buildThemeSwitch } from "./lib/theme.js";
import { buildSceneGraph, sceneDigest } from "./lib/scene-graph.js";
import { requireSession } from "./lib/session.js";
import { editableFields } from "./lib/slide-fields.js";
import { decorateSlide, readListField, readStructuredField } from "./lib/editable-canvas.js";
import { buildStage } from "/js/render.js";
import {
  textKey, listKey, rowKey, applyStyleToElement, alignTarget, WEIGHTS, MIN_SIZE, MAX_SIZE, MIN_WIDTH, MAX_WIDTH,
} from "/js/style-overrides.js";
import { createAiPanel } from "./editor-ai/index.js";
import { QUICK_ACTIONS } from "./editor-ai/intents.js";

const $ = (id) => document.getElementById(id);

const content = $("editor-content");
const loadingSection = $("editor-loading");
const notFoundSection = $("not-found");
const notFoundMessage = $("not-found-message");

const backLink = $("back-link");
const titleEl = $("ed-title");
const doneBtn = $("done-btn");
const undoBtn = $("undo-btn");
const redoBtn = $("redo-btn");
const exportBtn = $("export-btn");
const exportMenu = $("export-menu");
const saveEl = $("ed-save");
const saveText = $("ed-save-text");

const rail = $("editor-rail");
const railCount = $("ed-rail-count");
const addSlideBtn = $("add-slide-btn");
const addMenu = $("add-menu");
const slideMenu = $("slide-menu");
const canvasMenu = $("canvas-menu");

const stage = $("ed-stage");
const canvas = $("ed-canvas");
const previewSkeleton = $("editor-preview-skeleton");
const counterEl = $("ed-counter");
const prevBtn = $("slide-prev");
const nextBtn = $("slide-next");
const zoomSelect = $("zoom-select");
const zoomIn = $("zoom-in");
const zoomOut = $("zoom-out");


const swapDialog = $("swap-dialog");
const swapClose = $("swap-close");
const swapPickerView = $("swap-picker-view");
const swapSearch = $("swap-search");
const swapCategory = $("swap-category");
const swapCount = $("swap-count");
const swapGrid = $("swap-grid");
const swapConfirmView = $("swap-confirm-view");
const swapConfirmBody = $("swap-confirm-body");
const swapBackBtn = $("swap-back");
const swapConfirmBtn = $("swap-confirm");

const conflictModal = $("conflict-modal");
const conflictModalBody = $("conflict-modal-body");
const conflictCancelBtn = $("conflict-cancel");
const conflictConfirmBtn = $("conflict-confirm");

const aiSlideModal = $("ai-slide-modal");
const aiSlideInput = $("ai-slide-input");
const aiSlideError = $("ai-slide-error");
const aiSlideCancel = $("ai-slide-cancel");
const aiSlideGenerateBtn = $("ai-slide-generate");

const deleteModal = $("delete-slide-modal");
const deleteBody = $("delete-slide-body");
const deleteCancel = $("delete-slide-cancel");
const deleteConfirm = $("delete-slide-confirm");

const floatBar = $("ed-float");
const floatAskAi = $("float-ask-ai");
const floatAiShorter = $("float-ai-shorter");
const floatAiImprove = $("float-ai-improve");
const floatAiExpand = $("float-ai-expand");
const floatDuplicate = $("float-duplicate");
const floatDelete = $("float-delete");
const floatSep1 = $("float-sep-1");

const stylePanel = $("ed-style");
const styleBtn = $("float-style");
const floatImageBtn = $("float-image");
const styleSizeValue = $("style-size-value");
const styleSizeUp = $("style-size-up");
const styleSizeDown = $("style-size-down");
const styleWeightGroup = $("style-weight");
const styleColorGroup = $("style-color");
const styleAlignGroup = $("style-align");
const styleAlignRow = $("style-align-row");
const styleResetBtn = $("style-reset");

const cmdkOverlay = $("cmdk-overlay");
const cmdkInput = $("cmdk-input");
const cmdkResults = $("cmdk-results");

const presentationId = new URLSearchParams(location.search).get("id");

let record = null;
let slides = [];
let templates = [];
let currentIndex = 0;
let fieldDefs = [];            // editableFields() for the selected slide
let scene = null;              // the slide's scene graph (lib/scene-graph.js)
// Read-only inspection hook for devtools and integration checks — the graph
// is otherwise module-internal. Returns the live object; do not mutate.
window.__sceneGraph = () => scene;
let rowRegistry = new Map();   // rowUid -> full row object, from the last decoration pass
let undoStack = [];
let redoStack = [];
let pendingSwapTemplate = null;
let pendingSwapMapping = null;
let addPosition = null;
let pickerMode = "swap";       // "swap" | "add"
let busy = false;
let spacePanning = false;      // Space held — next drag pans the stage instead of selecting
let panActive = false;

/** The current canvas selection, or null. `el` is the .ed-editable span. */
let selection = null;

let ai;

/* ---- Zoom ------------------------------------------------------------- */
const ZOOM_LEVELS = [
  { value: "fit", label: "Fit" },
  { value: "0.5", label: "50%" },
  { value: "0.75", label: "75%" },
  { value: "1", label: "100%" },
  { value: "1.25", label: "125%" },
  { value: "1.5", label: "150%" },
  { value: "2", label: "200%" },
];
const ZOOM_KEY = "editor:zoom";
let zoom = sessionStorage.getItem(ZOOM_KEY) || "fit";

/* ---- Boot ------------------------------------------------------------- */
(async function boot() {
  const session = await requireSession();
  if (!session) return;

  if (!presentationId) return showNotFound("Presentation not found.");

  try {
    [record, templates] = await Promise.all([api.getPresentation(presentationId), api.listTemplates()]);
  } catch (err) {
    return showNotFound(
      err instanceof ApiError && err.status === 404
        ? "Presentation not found."
        : err.message || "Could not load this presentation."
    );
  }

  if (record.slides.length === 0) {
    location.href = `index.html?id=${encodeURIComponent(presentationId)}`;
    return;
  }

  slides = record.slides.map((s) => structuredClone(s));
  const backHref = `index.html?id=${encodeURIComponent(presentationId)}`;
  backLink.href = backHref;
  doneBtn.href = backHref;
  titleEl.textContent = record.title;
  document.title = `Editing ${record.title} — Nagarro Presentations`;

  // Appearance sits at the foot of the slide rail, left-aligned — same
  // position as on every rail screen, and out of the document actions.
  const themeRow = document.createElement("div");
  themeRow.className = "ed__rail-theme";
  themeRow.appendChild(buildThemeSwitch());
  document.querySelector(".ed__rail-foot")?.appendChild(themeRow);
  ai = createAiPanel({
    getSlides: () => slides,
    getCurrentIndex: () => currentIndex,
    getSelection: () => selection,
    getFieldDefs: () => fieldDefs,
    getScene: () => scene,
    getBusy: () => busy,
    getCanvas: () => canvas,
    presentationId,
    getPresentation: () => ({ id: record.id, updatedAt: record.updatedAt, aiMemory: record.aiMemory || [] }),
    patchPresentation,
    setBusy, beginSave, endSave, writeField, writeStyle, pushHistory,
    renderCanvas, paintThumb, adoptSlides, selectSlide, styleKeyFor,
    deepEqual, errText,
    clearSelection: () => clearSelection(),
    highlightField,
  });
  wireToolbar();
  wireExitFlush();
  wireImagePopover();
  wireStage();
  wireSlideOps();
  wirePicker();
  wireConflictModal();
  wireDeleteModal();
  wireFloatingToolbar();
  wireCommandPalette();
  wireShortcuts();

  loadingSection.hidden = true;
  notFoundSection.hidden = true;
  content.hidden = false;

  renderZoomSelect();
  renderRail();
  selectSlide(0);
})();

/** Only ever called AFTER loading has finished — the loading state is what
 *  shows before that, never this. */
function showNotFound(message) {
  loadingSection.hidden = true;
  notFoundMessage.textContent = message;
  notFoundSection.hidden = false;
  content.hidden = true;
}

/* ---- Save status -------------------------------------------------------- */
let inFlight = 0;
let saveResetTimer = null;

function setSaveState(state, text) {
  saveEl.dataset.state = state;
  saveText.textContent = text;
}
function beginSave() {
  inFlight++;
  clearTimeout(saveResetTimer);
  setSaveState("saving", "Saving…");
}
function endSave(ok, message) {
  inFlight = Math.max(0, inFlight - 1);
  if (!ok) return setSaveState("error", message || "Not saved");
  // Every successful mutation path (writeField, footer, reorder, add/
  // duplicate/delete slide, template swap, style writes, AI-generated
  // slides) ends here — the single choke point for "the deck changed",
  // regardless of which specific write triggered it.
  ai?.notifyDeckChanged();
  if (inFlight > 0) return;
  setSaveState("saved", "Saved");
  saveResetTimer = setTimeout(() => {
    if (inFlight === 0 && saveEl.dataset.state === "saved") setSaveState("idle", "");
  }, 2200);
}
window.addEventListener("offline", () => setSaveState("error", "Offline"));
window.addEventListener("online", () => setSaveState("idle", ""));

/* ---- Undo / redo ---------------------------------------------------------- */
function pushHistory(entry) {
  // Every entry remembers which slide it belongs to, so undoing from a
  // different slide can navigate there first — an invisible mutation two
  // slides away is indistinguishable from a broken undo.
  entry.slideId = entry.slideId ?? slides[currentIndex]?.id;
  undoStack.push(entry);
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];
  renderHistoryButtons();
}

function revealHistorySlide(entry) {
  const idx = slides.findIndex((s) => s.id === entry.slideId);
  if (idx !== -1 && idx !== currentIndex) selectSlide(idx);
}
function renderHistoryButtons() {
  undoBtn.disabled = undoStack.length === 0 || busy;
  redoBtn.disabled = redoStack.length === 0 || busy;
}
// Serialized: holding ⌘Z must never overlap two slide operations — their
// responses would adopt server state out of order and corrupt the deck.
let historyBusy = false;
async function undo() {
  if (historyBusy) return;
  const entry = undoStack.pop();
  if (!entry) return;
  historyBusy = true;
  renderHistoryButtons();
  revealHistorySlide(entry);
  try { await entry.undo(); redoStack.push(entry); }
  catch (err) { undoStack.push(entry); toast(errText(err, "Could not undo."), "error"); }
  historyBusy = false;
  renderHistoryButtons();
}
async function redo() {
  if (historyBusy) return;
  const entry = redoStack.pop();
  if (!entry) return;
  historyBusy = true;
  renderHistoryButtons();
  revealHistorySlide(entry);
  // Push BEFORE awaiting: an entry whose redo() rebinds its own `.undo`
  // (add/duplicate capture the freshly created slide id) must already be
  // the stack top it mutates — pushing after the await rebound a different,
  // unrelated entry's undo and deleted the wrong slide.
  undoStack.push(entry);
  try { await entry.redo(); }
  catch (err) { undoStack.pop(); redoStack.push(entry); toast(errText(err, "Could not redo."), "error"); }
  historyBusy = false;
  renderHistoryButtons();
}

function wireToolbar() {
  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);
  exportBtn.addEventListener("click", (e) => { e.stopPropagation(); openExportMenu(); });
  document.addEventListener("click", () => closeMenu(exportMenu, exportBtn));
}

/** Format picker (PDF/PPTX are the only two the backend accepts). Reuses the
 *  same anchored-popover component as "Add slide" — a menu, not a modal, so
 *  it doesn't interrupt whatever the canvas or AI panel is doing. Choosing a
 *  format queues the export job, then hands off to Export Jobs (scoped to
 *  this presentation) to watch it finish and download — the editor itself
 *  has no job-polling machinery to duplicate. */
function openExportMenu() {
  exportMenu.innerHTML = `
    <button type="button" role="menuitem" data-fmt="pdf">Export as PDF</button>
    <button type="button" role="menuitem" data-fmt="pptx">Export as PowerPoint</button>`;
  placeMenu(exportMenu, exportBtn);
  exportBtn.setAttribute("aria-expanded", "true");
  wireMenuKeys(exportMenu, exportBtn);
  exportMenu.querySelector("button")?.focus();
  exportMenu.onclick = (e) => {
    const format = e.target.closest("[data-fmt]")?.dataset.fmt;
    if (!format) return;
    closeMenu(exportMenu, exportBtn);
    startExport(format);
  };
}

/* ---- First-visit editing hint ------------------------------------------------
 * The canvas is directly editable, and the only clue was a hover outline — so a
 * first-time user, who has no reason to hover, read it as a preview and went
 * looking for an edit mode that does not exist. Shown once per browser, then
 * never again. */
const HINT_SEEN_KEY = "nps.editor.hintSeen";

function showFirstVisitHint() {
  let seen = true;
  try { seen = localStorage.getItem(HINT_SEEN_KEY) === "1"; } catch { /* private mode */ }
  /* Mounted on the STAGE, not the canvas. #ed-canvas is the slide box itself,
   * so a pill positioned inside it sat on top of the slide's own footer — app
   * chrome printed over the deck's content, white on white. The stage is the
   * dark area the slide floats in, which is where chrome belongs. */
  const stage = canvas.parentElement || canvas;
  if (seen || stage.querySelector(".ed-hint")) return;

  canvas.classList.add("is-first-visit");
  const hint = document.createElement("p");
  hint.className = "ed-hint";
  hint.textContent = "Click any text on the slide to edit it.";
  stage.appendChild(hint);

  const dismiss = () => {
    canvas.classList.remove("is-first-visit");
    hint.remove();
    try { localStorage.setItem(HINT_SEEN_KEY, "1"); } catch { /* private mode */ }
  };
  canvas.addEventListener("pointerdown", dismiss, { once: true });
  setTimeout(dismiss, 8000);
}

async function startExport(format) {
  try {
    await api.requestExport(presentationId, format);
    /* Stay on the canvas. This used to navigate to the jobs list, throwing away
     * the user's editing context — scroll position, selection, the slide they
     * were working on — to show a table with one row in it. The workspace does
     * the same action in place and is the better of the two behaviours; a toast
     * says the work started, and the jobs list is one click away for anyone who
     * wants it. */
    toast(
      `Building your ${format.toUpperCase()}. It'll appear in export activity when it's ready.`,
      "success"
    );
  } catch (err) {
    // 409 = an export is already running for this presentation+format
    // (server-enforced) — its own message already says so; either way the
    // user stays on the canvas rather than bouncing to a job list that
    // wouldn't show anything new.
    toast(errText(err, "Could not start the export."), "error");
  }
}

/* ---- Slide rail (unchanged from the previous pass) ------------------------ */
/**
 * Storage-shape slide → the flat shape buildStage() renders.
 *
 * `styled` decides who applies the per-element style overrides. Thumbnails,
 * the picker and every non-editor surface let the RENDERER do it (buildStage
 * → js/style-overrides.js). The editable canvas passes `styled: false` and
 * applies them to its own decorated spans instead — otherwise the renderer
 * would wrap the text in a styled span, the decorator would wrap it AGAIN
 * for editing, and a relative size like 1.25em would compound to 1.56em.
 */
function flatten(slide, { styled = true } = {}) {
  const flat = { template: slide.templateReference.templateName, theme: slide.themeOverride, ...slide.content };
  if (styled) flat.styleOverrides = slide.styleOverrides || {};
  return flat;
}

function renderRail() {
  rail.innerHTML = "";
  railCount.textContent = slides.length === 1 ? "1" : String(slides.length);

  slides.forEach((slide, i) => {
    const row = document.createElement("div");
    row.className = "ed-slide";
    row.dataset.index = String(i);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ed-slide__btn";
    if (i === currentIndex) btn.setAttribute("aria-current", "true");
    /* Name the slide, not just its number — a rail of "Slide 1…Slide 12" is
     * unusable by ear, and the title is right there. */
    const heading = String(slide.content?.title || slide.content?.heading || "").trim();
    btn.setAttribute("aria-label", heading ? `Slide ${i + 1}: ${heading}` : `Slide ${i + 1}`);
    btn.addEventListener("click", () => selectSlide(i));

    const num = document.createElement("span");
    num.className = "ed-slide__num";
    num.textContent = String(i + 1);

    const thumb = document.createElement("div");
    thumb.className = "deck-card__thumb ed-slide__thumb";
    thumb.dataset.theme = slide.themeOverride || "light";
    const frame = document.createElement("div");
    frame.className = "deck-card__frame";
    thumb.appendChild(frame);

    btn.append(num, thumb);

    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "ed-slide__menu";
    menuBtn.setAttribute("aria-haspopup", "menu");
    /* Present from the start, not only once the menu has been closed. A button
     * that says it has a popup but never says whether it is open is announced
     * with no state at all until the first close sets it. */
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", `Actions for slide ${i + 1}`);
    menuBtn.textContent = "⋯";
    menuBtn.addEventListener("click", (e) => { e.stopPropagation(); openSlideMenu(menuBtn, i); });

    row.append(btn, menuBtn);
    wireDrag(row, i);
    rail.appendChild(row);

    paintThumb(i);
  });
  syncRailSelection();
}

let dragFromIndex = null;
function wireDrag(row, i) {
  row.draggable = true;
  row.addEventListener("dragstart", (e) => {
    dragFromIndex = i;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
    requestAnimationFrame(() => row.classList.add("is-dragging"));
    // Defensive: an element drag on the canvas draws its own alignment
    // guides (.ed-guide) and clears them on its own mouseup — but a native
    // HTML5 drag like this one intercepts the browser's normal mouse event
    // stream once it starts, so if a rail drag begins while an element drag
    // was somehow still mid-flight, that mouseup can be swallowed and never
    // reach onUp's cleanup. Reordering slides has nothing to do with
    // on-canvas alignment, so this is always safe to clear.
    canvas.querySelectorAll(".ed-guide").forEach((g) => g.remove());
  });
  row.addEventListener("dragend", () => {
    row.classList.remove("is-dragging");
    clearDropIndicators();
    dragFromIndex = null;
  });
  row.addEventListener("dragover", (e) => {
    if (dragFromIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const before = e.clientY < row.getBoundingClientRect().top + row.offsetHeight / 2;
    clearDropIndicators();
    row.classList.add(before ? "drag-over-top" : "drag-over-bottom");
  });
  row.addEventListener("dragleave", () => row.classList.remove("drag-over-top", "drag-over-bottom"));
  row.addEventListener("drop", (e) => {
    e.preventDefault();
    const from = dragFromIndex;
    clearDropIndicators();
    if (from === null || from === i) return;
    const before = e.clientY < row.getBoundingClientRect().top + row.offsetHeight / 2;
    moveSlide(from, before ? i : i + 1);
  });
}
function clearDropIndicators() {
  for (const row of rail.children) row.classList.remove("drag-over-top", "drag-over-bottom");
}
async function moveSlide(from, to) {
  const target = to > from ? to - 1 : to;
  if (target === from) return;
  const before = slides.map((s) => s.id);
  const after = [...before];
  const [moved] = after.splice(from, 1);
  after.splice(target, 0, moved);
  await commitReorder(after, before, slides[from].id);
}
async function commitReorder(nextIds, prevIds, focusSlideId) {
  beginSave();
  setBusy(true);
  try {
    const updated = await api.reorderSlides(presentationId, nextIds);
    adoptSlides(updated, updated.slides.findIndex((s) => s.id === focusSlideId));
    endSave(true);
    pushHistory({
      label: "reorder slides",
      undo: async () => { const p = await api.reorderSlides(presentationId, prevIds); adoptSlides(p, p.slides.findIndex((s) => s.id === focusSlideId)); },
      redo: async () => { const p = await api.reorderSlides(presentationId, nextIds); adoptSlides(p, p.slides.findIndex((s) => s.id === focusSlideId)); },
    });
  } catch (err) {
    endSave(false);
    toast(errText(err, "Could not reorder the slides."), "error");
  } finally {
    setBusy(false);
  }
}

function paintThumb(i) {
  const row = rail.children[i];
  if (!row) return;
  const thumb = row.querySelector(".ed-slide__thumb");
  const frame = row.querySelector(".deck-card__frame");
  if (!frame) return;
  try {
    // Identical meta to the canvas render — a thumb built without the deck's
    // footer showed default footer text while the canvas showed the edited one.
    const stageEl = buildStage(flatten(slides[i]), { title: record.title, footer: record.footer });
    stageEl.classList.add("is-thumb");
    /* A thumbnail is a PICTURE of a slide, not a copy of it. Left exposed, each
     * rail item put its whole rendered slide into the accessibility tree — so
     * "Slide 5" announced roughly twenty-five nested text nodes, and the
     * editor's a11y tree contained the entire deck twice. The button's own
     * aria-label carries the meaning. */
    stageEl.setAttribute("aria-hidden", "true");
    frame.innerHTML = "";
    frame.appendChild(stageEl);
    requestAnimationFrame(() => { frame.style.transform = `scale(${thumb.clientWidth / 1920})`; });
  } catch { /* keep whatever was there — one bad thumbnail must not blank the rail */ }
}

/** Keeps the rail thumbnail visually in step with in-progress typing —
 *  without this the thumb showed stale text until the autosave commit,
 *  which read as "the previews don't match the slides". */
let thumbSyncTimer = null;
function scheduleThumbSync() {
  clearTimeout(thumbSyncTimer);
  thumbSyncTimer = setTimeout(() => {
    const i = currentIndex;
    const slide = slides[i];
    if (!slide) return;
    // Paint from the LIVE DOM values (the model lags the debounced commit):
    // clone content and overlay what the canvas currently shows.
    const liveContent = structuredClone(slide.content);
    for (const el of canvas.querySelectorAll('.ed-editable[data-ed-kind="text"]')) {
      liveContent[el.dataset.edField] = readSpanText(el).trim();
    }
    for (const def of fieldDefs) {
      if (def.kind === "list") liveContent[def.key] = readListField(canvas, def.key).map((t) => t.trim());
    }
    paintThumbWithContent(i, liveContent);
  }, 250);
}

function paintThumbWithContent(i, content) {
  const row = rail.children[i];
  const frame = row?.querySelector(".deck-card__frame");
  const thumb = row?.querySelector(".ed-slide__thumb");
  if (!frame || !thumb) return;
  try {
    const stageEl = buildStage(
      { ...flatten(slides[i]), ...content },
      { title: record.title, footer: record.footer }
    );
    stageEl.classList.add("is-thumb");
    frame.innerHTML = "";
    frame.appendChild(stageEl);
    requestAnimationFrame(() => { frame.style.transform = `scale(${thumb.clientWidth / 1920})`; });
  } catch { /* one bad thumbnail must not blank the rail */ }
}

function syncRailSelection() {
  [...rail.children].forEach((row, idx) => {
    row.classList.toggle("is-active", idx === currentIndex);
    const btn = row.querySelector(".ed-slide__btn");
    if (idx === currentIndex) btn?.setAttribute("aria-current", "true");
    else btn?.removeAttribute("aria-current");
  });
}

/* ---- Slide selection + canvas decoration ---------------------------------- */
function selectSlide(i) {
  // Flush pending debounced edits against the slide they belong to BEFORE
  // the canvas re-renders for another slide — a timer firing later would
  // otherwise read stale DOM and write into the newly selected slide.
  flushPendingCommits();
  currentIndex = Math.max(0, Math.min(slides.length - 1, i));
  syncRailSelection();
  clearSelection();
  renderCanvas();
  renderCounter();
  scrollRailIntoView(currentIndex);
  ai.renderPanel();
  ai.renderScope();
  ai.syncSendState(); // the composer's disabled state follows the CURRENT slide's working item, not a global flag
}

function scrollRailIntoView(index) {
  const row = rail.children[index];
  if (!row) return;
  const rowTop = row.offsetTop - rail.offsetTop;
  const rowBottom = rowTop + row.offsetHeight;
  if (rowTop < rail.scrollTop) rail.scrollTop = rowTop;
  else if (rowBottom > rail.scrollTop + rail.clientHeight) rail.scrollTop = rowBottom - rail.clientHeight;
}

function renderCounter() {
  counterEl.textContent = `${currentIndex + 1} / ${slides.length}`;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === slides.length - 1;
}

/**
 * Rebuilds the canvas from the rendering engine and decorates it for direct
 * editing. Only called on slide switch, undo/redo, AI-proposal accept, and
 * structural ops (add/duplicate/delete/swap) — NEVER on a live keystroke
 * inside a decorated span (that would destroy the caret mid-edit).
 */
function renderCanvas() {
  const slide = slides[currentIndex];
  previewSkeleton.hidden = true;

  let stageEl = null;
  try {
    // `footer` must travel with the meta — the viewer and the exporter both
    // render the deck's real footer, so the editor showing DEFAULT_FOOTER
    // instead was a silent mismatch with what would actually ship.
    stageEl = buildStage(flatten(slide, { styled: false }), { title: record.title, footer: record.footer });
  } catch (err) {
    showCanvasNotice(`This slide can't be rendered yet — ${err.message}`);
    return;
  }

  const template = templates.find((t) => t.name === slide.templateReference.templateName);
  const decoration = decorateSlide(stageEl, slide.content, template?.schema || {});
  fieldDefs = decoration.fieldDefs;
  rowRegistry = decoration.rowRegistry;
  decorateChrome(stageEl);
  decorateImages(stageEl, slide.content, template?.schema || {});
  wireEditableSpans(stageEl);
  wireImageEls(stageEl);
  applyStylesToSpans(stageEl, slide.styleOverrides || {});

  // css/deck.css makes `.stage` pointer-events:none by default and only
  // `.stage.is-active` clickable — a crossfade-viewer rule (only the visible
  // slide should catch clicks). buildStage() is the shared rendering engine
  // (never modified here per the NON NEGOTIABLE rule) and knows nothing
  // about the editor, so this is the one place the editor must opt its own
  // canvas back into receiving clicks. Rail thumbnails and the swap-picker
  // grid (paintThumb/renderPickerGrid) deliberately do NOT add this — those
  // stay inert previews.
  stageEl.classList.add("is-thumb", "is-active");
  const frame = document.createElement("div");
  frame.className = "deck-card__frame";
  frame.appendChild(stageEl);

  canvas.dataset.theme = slide.themeOverride || "light";
  canvas.innerHTML = "";
  canvas.appendChild(frame);
  if (canvas.dataset.slideId !== slide.id) {
    canvas.dataset.slideId = slide.id;
    frame.classList.add("ed-canvas-enter"); // switch feels composed, not swapped
  }
  clearCanvasNotice();
  showFirstVisitHint();
  applyZoom();
  // The scene graph is the editing model (Phase 1): derived from the
  // rendered, decorated stage after every rebuild. Rendering and exports
  // are untouched — the graph consumes the render, it never produces it.
  scene = buildSceneGraph(stageEl, { slide, fieldDefs });
  wireInventoryEls(stageEl);
  restoreSelection();
  // A rebuild replaces the decorated spans, which silently dropped any
  // pending AI preview — the review bar still offered "Accept all" over a
  // canvas showing the OLD text. Repaint the preview onto the new spans.
  if (slides[currentIndex] && ai.stateFor(slides[currentIndex].id).phase === "review") ai.applyCanvasPreview();
}

/** A rebuild replaces every span, so a live selection would otherwise point
 *  at a detached node — the float bar froze in place and the style panel
 *  wrote overrides that painted nothing. Re-select the equivalent span in
 *  the new DOM, or honestly drop the selection when it no longer exists. */
function restoreSelection() {
  if (!selection) return;
  const s = selection;
  let sel = null;
  if (s.kind === "image") {
    const img = canvas.querySelector(`.ed-editable-img[data-ed-img-field="${cssEscape(s.field)}"]`);
    if (img) { selectImage(img); return; }
    clearSelection(); return;
  }
  if (s.kind === "deck") sel = canvas.querySelector(`.ed-editable[data-ed-kind="deck"][data-ed-deck-field="${cssEscape(s.deckField)}"]`);
  else if (s.kind === "text") sel = canvas.querySelector(`.ed-editable[data-ed-kind="text"][data-ed-field="${cssEscape(s.field)}"]`);
  else if (s.kind === "list-item") sel = canvas.querySelector(`.ed-editable[data-ed-field="${cssEscape(s.field)}"][data-ed-index="${s.index}"]`);
  else if (s.kind === "row-field" && s.rowIndex !== undefined) {
    sel = canvas.querySelector(`.ed-editable[data-ed-field="${cssEscape(s.field)}"][data-ed-rowindex="${s.rowIndex}"][data-ed-subkey="${cssEscape(s.subKey || "")}"]`);
  }
  if (sel) selectElement(sel);
  else clearSelection();
}

function showCanvasNotice(message) {
  clearCanvasNotice();
  const note = document.createElement("p");
  note.className = "ed__canvas-notice";
  note.id = "ed-canvas-notice";
  note.textContent = message;
  stage.appendChild(note);
}
function clearCanvasNotice() { $("ed-canvas-notice")?.remove(); }

/* ---- Zoom ------------------------------------------------------------- */
function renderZoomSelect() {
  zoomSelect.innerHTML = ZOOM_LEVELS.map((l) => `<option value="${l.value}">${l.label}</option>`).join("");
  zoomSelect.value = zoom;
}
function fitWidth() {
  const cs = getComputedStyle(stage);
  const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  return Math.max(160, Math.min(availW, (availH * 16) / 9));
}
function applyZoom() {
  const width = zoom === "fit" ? fitWidth() : 1920 * parseFloat(zoom);
  canvas.style.width = `${Math.round(width)}px`;
  canvas.style.height = `${Math.round((width * 9) / 16)}px`;
  const frame = canvas.querySelector(".deck-card__frame");
  if (frame && frame.firstChild) frame.style.transform = `scale(${width / 1920})`;
  zoomSelect.value = zoom;
  const i = ZOOM_LEVELS.findIndex((l) => l.value === zoom);
  zoomOut.disabled = i <= 0;
  zoomIn.disabled = i === ZOOM_LEVELS.length - 1;
  repositionFloatingToolbar();
}
function setZoom(next) { zoom = next; sessionStorage.setItem(ZOOM_KEY, next); applyZoom(); }
function stepZoom(delta) {
  const i = ZOOM_LEVELS.findIndex((l) => l.value === zoom);
  const nextIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, i + delta));
  if (nextIndex !== i) setZoom(ZOOM_LEVELS[nextIndex].value);
}
function wireStage() {
  prevBtn.addEventListener("click", () => selectSlide(currentIndex - 1));
  nextBtn.addEventListener("click", () => selectSlide(currentIndex + 1));
  zoomSelect.addEventListener("change", () => setZoom(zoomSelect.value));
  zoomIn.addEventListener("click", () => stepZoom(1));
  zoomOut.addEventListener("click", () => stepZoom(-1));
  stage.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    stepZoom(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  stage.addEventListener("scroll", repositionFloatingToolbar);
  // rAF-coalesced: resize fires in bursts and applyZoom both reads and
  // writes layout — once per frame is all that's ever visible.
  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      if (zoom === "fit") applyZoom();
    });
  });
  // Clicking empty canvas space (not a decorated element) deselects.
  stage.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".ed-editable")) clearSelection();
  });
}

/* ---- Direct canvas editing -------------------------------------------------
 * Every .ed-editable span behaves like a tiny inline text field:
 *   click        → select (floating toolbar, AI scope narrows to it)
 *   double-click / Enter while selected → edit (contenteditable, caret in)
 *   typing       → debounced autosave, live in the DOM already (no rebuild)
 *   blur / Enter while editing → commit immediately
 *   Esc while editing → revert to the value at the START of this edit
 *                       session (which also undoes any autosave already
 *                       sent — "cancel" IS "commit the original value")
 */
const commitTimers = new Map(); // signature -> { handle, target, slide }
let editSessionStart = null;    // text at the moment the current edit began
let editSessionUndoLen = 0;     // undo depth when it began (see revertEdit)

/** Runs every pending debounced commit immediately, against the slide each
 * one was scheduled for. Called before the canvas switches slides and
 * before the page is left — an edit made within the 900ms debounce of
 * pressing Done used to be silently lost. */
function flushPendingCommits() {
  // An in-progress inline edit hasn't even scheduled its commit yet.
  const editing = canvas.querySelector(".ed-editable.is-editing");
  if (editing) exitEdit(editing, { commit: true });
  for (const [sig, pending] of [...commitTimers.entries()]) {
    clearTimeout(pending.handle);
    commitTimers.delete(sig);
    commitTargetNow(pending.target, pending.slide);
  }
}
window.addEventListener("pagehide", flushPendingCommits);

/** Awaitable variant for deliberate exits (Done / Back): the PATCHes must
 * actually land before the document is torn down. */
async function flushPendingCommitsAndWait() {
  const editing = canvas.querySelector(".ed-editable.is-editing");
  if (editing) { editing.contentEditable = "false"; editing.classList.remove("is-editing"); }
  const jobs = [];
  if (editing) jobs.push(commitTargetNow(targetFromEl(editing)));
  for (const [sig, pending] of [...commitTimers.entries()]) {
    clearTimeout(pending.handle);
    commitTimers.delete(sig);
    jobs.push(commitTargetNow(pending.target, pending.slide));
  }
  await Promise.allSettled(jobs);
}

function wireExitFlush() {
  for (const link of [doneBtn, backLink]) {
    link.addEventListener("click", async (e) => {
      if (!commitTimers.size && !canvas.querySelector(".ed-editable.is-editing")) return; // nothing pending — plain navigation
      e.preventDefault();
      await flushPendingCommitsAndWait();
      location.href = link.href;
    });
  }
}

/** A multiline element-bound editable renders \n as <br> — innerText is the
 *  read that preserves those breaks; textContent would flatten them. */
function readSpanText(el) {
  return el.dataset.edMultiline ? el.innerText : el.textContent;
}

function targetSignature(t) {
  return t.kind === "text" ? `text:${t.field}`
    : t.kind === "list-item" ? `list:${t.field}`
    : t.kind === "deck" ? `deck:${t.field}`
    : `row:${t.field}`;
}
function targetFromEl(el) {
  const kind = el.dataset.edKind;
  if (kind === "deck") {
    const deckField = el.dataset.edDeckField;
    // Legacy chrome fields are bare footer cell names ("col1"); v2 chrome
    // fields arrive already dotted ("meta.studio", "footer.col1").
    return { el, kind, field: deckField.includes(".") ? deckField : `footer.${deckField}`, deckField };
  }
  return {
    el, field: el.dataset.edField, kind,
    index: el.dataset.edIndex !== undefined ? Number(el.dataset.edIndex) : undefined,
    rowUid: el.dataset.edRow,
    rowIndex: el.dataset.edRowindex !== undefined ? Number(el.dataset.edRowindex) : undefined,
    subKey: el.dataset.edSubkey,
  };
}

/* ---- Chrome (footer) editing ------------------------------------------------
 * The footer is deck-level content rendered by the engine's Chrome() block —
 * the one visible text the schema decorator can't reach, and previously the
 * only text on a slide that "just couldn't be edited". Each footer cell is
 * decorated like any other editable span; committing PATCHes the
 * presentation's `footer` (so every slide, the viewer, and both exporters see
 * it), rather than any single slide's content. */
const DECK_FOOTER_DEFAULTS = { col1: "Digital Design Strategy", col2: "Project Name", col3: "Month Year", copyright: "© 2026" };
const DECK_FIELD_LABELS = { col1: "Footer — left", col2: "Footer — middle", col3: "Footer — right", copyright: "Footer — copyright" };

function decorateChrome(stageEl) {
  const bind = (node, deckField) => {
    if (!node) return;
    const span = document.createElement("span");
    span.className = "ed-editable";
    span.dataset.edKind = "deck";
    span.dataset.edDeckField = deckField;
    span.tabIndex = 0;
    span.textContent = node.textContent;
    node.replaceWith(span);
  };
  const firstText = (el) => el && [...el.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());

  // Legacy Chrome() footer — deck-level record.footer, PATCHed on the
  // presentation (commitDeckFieldNow's legacy branch).
  const cols = stageEl.querySelectorAll(".footer .col");
  if (cols.length) {
    bind(firstText(cols[0]), "col1");
    bind(firstText(cols[1]), "col2");
    const split = cols[2]?.querySelectorAll("span");
    bind(firstText(split?.[0]), "col3");
    bind(firstText(split?.[1]), "copyright");
  }

  // v2 frame chrome (222 templates): the top bar's meta and the footer are
  // rendered from EACH SLIDE'S content.meta / content.footer, so these bind
  // to dotted deck fields ("meta.studio", "footer.col1") that
  // commitChromeFieldNow writes across every slide rendering that group —
  // except the page number, which stays per-slide. Binding the whole cell
  // (not just its first text node) keeps even short values like a page
  // number clickable at a usable size (min-size CSS on deck editables).
  // An empty cell renders no text node at all — give it one, so even a blank
  // footer column stays reachable (clickable) rather than silently dead.
  const cellText = (el) => {
    if (!el) return null;
    const existing = firstText(el);
    if (existing) return existing;
    const node = document.createTextNode("");
    el.appendChild(node);
    return node;
  };
  const metaSpans = stageEl.querySelectorAll(".v2f-meta > span");
  bind(cellText(metaSpans[0]), "meta.studio");
  bind(cellText(metaSpans[1]), "meta.name");
  bind(cellText(metaSpans[2]), "meta.page");
  const fcols = [...stageEl.querySelectorAll(".v2f-footer .v2f-fcol")].filter(
    (c) => !c.classList.contains("v2f-fcol--split")
  );
  bind(cellText(fcols[0]), "footer.col1");
  bind(cellText(fcols[1]), "footer.col2");
  const v2split = stageEl.querySelectorAll(".v2f-footer .v2f-fcol--split > span");
  bind(cellText(v2split[0]), "footer.col3");
  bind(cellText(v2split[1]), "footer.copyright");
}

function effectiveFooter() {
  return { ...DECK_FOOTER_DEFAULTS, ...(record.footer || {}) };
}

/* ---- Image editing ----------------------------------------------------------
 * Media fields render as `src=` attributes, so the text decorator can never
 * reach them — across 21 templates the photos, logos and icons were visible
 * but dead. Any <img> whose src comes from a content field (matched by
 * value, or by field-name heuristics when the field is empty and the
 * template fell back to its default) becomes selectable: click → selection
 * + floating toolbar with "Replace image". */
function decorateImages(stageEl, content, schema) {
  const claimed = new Set();
  const imgs = [...stageEl.querySelectorAll("img")].filter((img) => !img.closest(".logo"));
  const fields = Object.keys(schema).filter((k) =>
    /(image|photo|icon|logo|avatar|src)/i.test(k) || /image url|photo url/i.test(String(schema[k]).toLowerCase()));

  const bind = (img, field) => {
    img.classList.add("ed-editable-img");
    img.dataset.edImgField = field;
    img.tabIndex = 0;
    claimed.add(img);
  };

  // Pass 1 — src equals the field's current value (path or URL).
  for (const field of fields) {
    const v = content[field];
    if (typeof v !== "string" || !v.trim()) continue;
    const hit = imgs.find((img) => {
      if (claimed.has(img)) return false;
      const src = img.getAttribute("src") || "";
      return src === v || src.endsWith(v) || (src && v.endsWith(src));
    });
    if (hit) bind(hit, field);
  }
  // Pass 2 — an image field whose value is empty rendered the template's
  // default src, so nothing matches by value. Bind it to the best unclaimed
  // candidate: prefer an <img> whose class or src echoes the field's intent
  // (photo/portrait/avatar/image) over incidental chrome like inline logos.
  const empties = fields.filter((f) => !String(content[f] ?? "").trim());
  if (empties.length === 1) {
    const free = imgs.filter((img) => !claimed.has(img));
    const themed = free.filter((img) =>
      /photo|image|portrait|avatar|hero|picture/i.test(`${img.className} ${img.getAttribute("src") || ""}`));
    const pick = themed[0] ?? (free.length === 1 ? free[0] : null);
    if (pick) bind(pick, empties[0]);
  }
}

function wireImageEls(root) {
  for (const img of root.querySelectorAll(".ed-editable-img")) {
    img.addEventListener("click", (e) => { e.stopPropagation(); selectImage(img); });
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); selectImage(img); openImagePopover(); }
    });
  }
}

function selectImage(img) {
  clearSelection();
  img.classList.add("is-selected");
  selection = { el: img, kind: "image", field: img.dataset.edImgField, object: scene?.byEl.get(img) || null };
  showFloatingToolbar(img);
  ai.renderScope();
}

/* ---- Inventory objects (Phase 2) --------------------------------------------
 * Scene objects no decoration pass reached — template-hardcoded text, inline
 * logos, decorative graphics. They are SELECTABLE like everything else:
 * click gives the selection ring, the toolbar, and an AI scoped to that
 * object by name and position. What they can't yet offer is inline editing;
 * the AI path is the honest workflow until their adapters land, and no
 * visible element is ever a dead click. */
function wireInventoryEls(stageEl) {
  if (!scene) return;
  for (const el of stageEl.querySelectorAll("*")) {
    const obj = scene.byEl.get(el);
    if (!obj || obj.editable || el.dataset.edInv) continue;
    el.dataset.edInv = "1";
    el.classList.add("ed-inventory");
    el.tabIndex = 0;
    el.addEventListener("click", (e) => { e.stopPropagation(); selectInventory(el); });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); selectInventory(el); }
    });
  }
}

function selectInventory(el) {
  clearSelection();
  el.classList.add("is-selected");
  selection = { el, kind: "visual", object: scene?.byEl.get(el) || null };
  showFloatingToolbar(el);
  ai.renderScope();
}

const imagePop = $("ed-image-pop");
const imagePopInput = $("image-pop-input");
const imagePopFile = $("image-pop-file");
const imagePopUploadLabel = $("image-pop-upload-label");
const imagePopHint = $("image-pop-hint");

function openImagePopover() {
  if (selection?.kind !== "image") return;
  const slide = slides[currentIndex];
  imagePopInput.value = slide.content[selection.field] || selection.el.getAttribute("src") || "";
  imagePop.hidden = false;
  const r = selection.el.getBoundingClientRect();
  imagePop.style.visibility = "hidden";
  void imagePop.offsetHeight;
  imagePop.style.left = `${Math.max(12, Math.min(window.innerWidth - imagePop.offsetWidth - 12, r.left))}px`;
  imagePop.style.top = `${Math.min(window.innerHeight - imagePop.offsetHeight - 12, r.bottom + 10)}px`;
  imagePop.style.visibility = "";
  imagePopInput.focus();
  imagePopInput.select();
}

function closeImagePopover() { imagePop.hidden = true; }

/** Shared by both input methods (pasted URL/path and file upload) — the
 * one write path onto the slide, matching the "no second write path"
 * requirement: an upload's only job is to produce a path string, which
 * then flows through exactly this same function a pasted URL already did. */
async function applyImageValue(next) {
  if (selection?.kind !== "image") return;
  const field = selection.field;
  const slide = slides[currentIndex];
  const prev = slide.content[field] ?? "";
  if (!next || next === prev) return;
  slide.content[field] = next;
  await writeField(slide, field, next, prev, { rebuild: true });
}

async function applyImagePopover() {
  if (selection?.kind !== "image") return closeImagePopover();
  const next = imagePopInput.value.trim();
  closeImagePopover();
  await applyImageValue(next);
}

async function uploadImagePopoverFile(file) {
  if (selection?.kind !== "image" || !file) return;
  const restoreHint = imagePopHint.textContent;
  imagePopUploadLabel.classList.add("is-busy");
  imagePopHint.textContent = "Uploading…";
  try {
    const { path } = await api.uploadImage(presentationId, file);
    closeImagePopover();
    await applyImageValue(path);
  } catch (err) {
    toast(errText(err, "Could not upload the image."), "error");
  } finally {
    imagePopUploadLabel.classList.remove("is-busy");
    imagePopHint.textContent = restoreHint;
    imagePopFile.value = "";
  }
}

function wireImagePopover() {
  $("image-pop-apply").addEventListener("click", applyImagePopover);
  imagePopInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); applyImagePopover(); }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeImagePopover(); }
  });
  imagePopFile.addEventListener("change", () => uploadImagePopoverFile(imagePopFile.files?.[0]));
  floatImageBtn.addEventListener("click", openImagePopover);
  document.addEventListener("pointerdown", (e) => {
    if (!imagePop.hidden && !imagePop.contains(e.target) && e.target !== floatImageBtn) closeImagePopover();
  });
}

async function commitDeckFieldNow(target, { recordHistory = true } = {}) {
  // v2 chrome ("meta.studio", "footer.col1") lives in each slide's content,
  // not on the presentation record — different write path entirely.
  if (target.deckField.includes(".")) return commitChromeFieldNow(target, { recordHistory });
  const deckField = target.deckField;
  const prevFooter = record.footer || {};
  const shown = effectiveFooter();
  const nextText = (target.el ? target.el.textContent : shown[deckField]).trim();
  if (nextText === shown[deckField]) return;
  // Persist ONLY the edited cell on top of what the record already had —
  // merging the display defaults in would store all four defaults as if the
  // user had authored them.
  const nextFooter = { ...prevFooter, [deckField]: nextText };

  const write = async (footer) => {
    const updated = await api.updatePresentation(presentationId, { footer });
    record.footer = updated.footer;
    renderCanvas();
    slides.forEach((_, i) => paintThumb(i)); // the footer is on every slide
  };

  beginSave();
  try {
    record.footer = nextFooter; // optimistic — the span already shows it
    await api.updatePresentation(presentationId, { footer: nextFooter });
    slides.forEach((_, i) => paintThumb(i));
    endSave(true);
    if (!recordHistory) return;
    pushHistory({
      label: `edit ${target.field}`,
      undo: async () => { await write(prevFooter); },
      redo: async () => { await write(nextFooter); },
    });
  } catch (err) {
    endSave(false);
    record.footer = prevFooter;
    renderCanvas();
    toast(errText(err, "Could not save the footer."), "error");
  }
}

/* v2 frame chrome. Every v2 template renders its top bar and footer from the
 * slide's own `content.meta` / `content.footer`, so a chrome edit here writes
 * through api.updateSlide — and, because the chrome is deck identity rather
 * than slide content, it propagates to EVERY slide that renders that group.
 * The one exception is the page number, which is inherently per-slide. */
async function commitChromeFieldNow(target, { recordHistory = true } = {}) {
  const [group, key] = target.deckField.split(".");
  const current = slides[currentIndex];
  if (!current) return;
  const nextText = (target.el ? target.el.textContent : "").trim();
  const shown = String(current.content?.[group]?.[key] ?? "").trim();
  if (nextText === shown) return;

  const perSlide = group === "meta" && key === "page";
  const rendersGroup = (s) => {
    if (s.content && typeof s.content[group] === "object" && s.content[group] !== null) return true;
    const t = templates.find((x) => x.name === s.templateReference.templateName);
    return !!(t?.schema && group in t.schema);
  };
  const affected = perSlide ? [current] : slides.filter(rendersGroup);
  const prev = affected.map((s) => ({ id: s.id, value: structuredClone(s.content?.[group] ?? null) }));

  const write = async (valueFor) => {
    for (const p of prev) {
      const s = slides.find((x) => x.id === p.id);
      if (!s) continue;
      const updated = await api.updateSlide(presentationId, s.id, {
        content: { [group]: valueFor(s, p) },
        manualOverrides: { [group]: true },
      });
      const idx = slides.findIndex((x) => x.id === updated.id);
      if (idx !== -1) slides[idx] = updated;
    }
    slides.forEach((_, i) => paintThumb(i));
  };
  const applyEdit = (s) => ({ ...(s.content?.[group] || {}), [key]: nextText });

  beginSave();
  try {
    await write(applyEdit);
    endSave(true);
    if (!recordHistory) return;
    pushHistory({
      label: `edit ${target.deckField}`,
      undo: async () => {
        await write((s, p) => p.value ?? {});
        renderCanvas();
      },
      redo: async () => { await write(applyEdit); renderCanvas(); },
    });
  } catch (err) {
    endSave(false);
    // Slides written before the failure ARE persisted (the loop advanced
    // slide by slide) — repainting from the in-memory state, which the loop
    // kept in step with every successful write, shows exactly what saved.
    renderCanvas();
    toast(errText(err, "Could not save the header/footer."), "error");
  }
}

function wireEditableSpans(root) {
  const spans = root.matches?.(".ed-editable") ? [root] : root.querySelectorAll(".ed-editable");
  for (const el of spans) {
    // Idempotent: duplicating an item re-wires its container, and a second
    // set of handlers on the SIBLING spans meant doubled commits, doubled
    // history entries and doubled edit sessions — compounding per duplicate.
    if (el.dataset.edWired) continue;
    el.dataset.edWired = "1";
    el.addEventListener("click", (e) => { e.stopPropagation(); selectElement(el); });
    el.addEventListener("dblclick", (e) => { e.stopPropagation(); selectElement(el); enterEdit(el); });
    // Press and drag to move. Selecting first is deliberate: a plain click on
    // an unselected element still just selects it, so nothing moves by
    // accident while you are only looking around the slide.
    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || spacePanning || el.isContentEditable) return;
      if (selection?.el !== el) return;
      if (el.dataset.edKind === "deck") return; // chrome position is fixed by the brand system
      e.stopPropagation();
      beginDrag(el, e);
    });
    el.addEventListener("blur", () => { if (el.isContentEditable) exitEdit(el, { commit: true }); });
    el.addEventListener("input", () => { scheduleCommit(targetFromEl(el)); scheduleThumbSync(); });
    el.addEventListener("keydown", (e) => {
      if (el.isContentEditable) {
        if (e.key === "Enter") { e.preventDefault(); el.blur(); }
        else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation(); // one Escape = revert only; the window handler must not also clear the selection
          revertEdit(el);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        enterEdit(el);
      }
    });
  }
}

function selectElement(el) {
  clearSelection();
  el.classList.add("is-selected");
  selection = targetFromEl(el);
  selection.object = scene?.byEl.get(el) || null;
  showFloatingToolbar(el);
  ai.renderScope();
}

function clearSelection() {
  if (selection?.el?.isContentEditable) exitEdit(selection.el, { commit: true });
  if (styleUndoBaseline !== null) commitStyleNow(); // never lose a pending style burst
  canvas.querySelector(".ed-editable.is-selected")?.classList.remove("is-selected");
  canvas.querySelector(".ed-editable-img.is-selected")?.classList.remove("is-selected");
  canvas.querySelector(".ed-inventory.is-selected")?.classList.remove("is-selected");
  closeImagePopover();
  selection = null;
  closeStylePanel();
  hideFloatingToolbar();
  ai.renderScope();
}

/** AI context-chip hover → canvas outline. Presentation only, no selection
 *  change — toggles a transient class the AI panel turns on/off directly. */
function highlightField(field, on) {
  for (const el of canvas.querySelectorAll(`.ed-editable[data-ed-field="${cssEscape(field)}"]`)) {
    el.classList.toggle("is-ai-hint", on);
  }
}

function enterEdit(el) {
  // Direct editing and an in-place AI preview can't share the same span —
  // restore the real text first so a manual edit never silently commits
  // previewed (not-yet-accepted) AI text. The diffs stay in the sidebar.
  if (ai.hasPreview()) ai.clearCanvasPreview();
  editSessionStart = readSpanText(el);
  editSessionUndoLen = undoStack.length; // so an escaped edit can tell its own autosaves from older history
  el.contentEditable = "plaintext-only";
  // Firefox doesn't support "plaintext-only" and falls back to rich
  // contenteditable — a paste would then show markup on the canvas until
  // the next rebuild (the save was already clean; the DISPLAY wasn't).
  if (!el.isContentEditable) {
    el.contentEditable = "true";
    if (!el.dataset.edPastePlain) {
      el.dataset.edPastePlain = "1";
      el.addEventListener("paste", (e) => {
        if (!el.isContentEditable) return;
        e.preventDefault();
        const text = e.clipboardData?.getData("text/plain") ?? "";
        const sel = window.getSelection();
        if (!sel?.rangeCount) return;
        sel.getRangeAt(0).deleteContents();
        sel.getRangeAt(0).insertNode(document.createTextNode(text));
        sel.collapseToEnd();
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  }
  el.classList.add("is-editing");
  // Preserve the word/segment the double-click just selected — focus()
  // collapses it, so typing appended instead of replacing. Figma/Notion
  // behavior: double-click a word, type, the word is replaced.
  const sel = window.getSelection();
  const ranges = [];
  for (let i = 0; i < (sel?.rangeCount || 0); i++) {
    const r = sel.getRangeAt(i);
    if (el.contains(r.commonAncestorContainer)) ranges.push(r.cloneRange());
  }
  el.focus();
  if (ranges.length && sel) {
    sel.removeAllRanges();
    for (const r of ranges) sel.addRange(r);
  }
  hideFloatingToolbar();
}

function exitEdit(el, { commit }) {
  el.contentEditable = "false";
  el.classList.remove("is-editing");
  if (commit) commitTargetNow(targetFromEl(el));
  editSessionStart = null;
  if (selection?.el === el) showFloatingToolbar(el);
}

/** Escape = abandon this edit session entirely: the DOM text reverts, any
 *  pending debounce is cancelled, and if an autosave already committed the
 *  abandoned text mid-session, the server is quietly restored WITHOUT
 *  history entries — an escaped edit must leave the undo stack exactly as
 *  it found it (it used to leave two entries whose undo re-applied the
 *  abandoned text). */
function revertEdit(el) {
  const target = targetFromEl(el);
  const slide = slides[currentIndex];
  const original = editSessionStart ?? el.textContent;

  if (slide) {
    const sig = `${slide.id}:${targetSignature(target)}`;
    const pending = commitTimers.get(sig);
    if (pending) { clearTimeout(pending.handle); commitTimers.delete(sig); }
  }

  el.textContent = original;
  el.contentEditable = "false";
  el.classList.remove("is-editing");
  editSessionStart = null;
  if (selection?.el === el) showFloatingToolbar(el);
  clearTimeout(thumbSyncTimer);
  paintThumb(currentIndex); // the live-synced thumb may still show the abandoned text

  // commitTargetNow deep-compares against the model: if no autosave fired
  // this is a no-op; if one did, this writes the original back silently and
  // drops only the entries THIS session's autosaves pushed.
  const sessionLen = editSessionUndoLen;
  commitTargetNow(target, slide, { recordHistory: false }).then(() => {
    while (
      undoStack.length > sessionLen &&
      undoStack[undoStack.length - 1]?.label === `edit ${target.field}`
    ) {
      undoStack.pop();
    }
    renderHistoryButtons();
  });
}

function scheduleCommit(target) {
  // The slide is captured NOW: by the time the timer fires the user may be
  // on a different slide, and the write must land on the one they edited.
  const slide = slides[currentIndex];
  const sig = `${slide?.id}:${targetSignature(target)}`;
  const prior = commitTimers.get(sig);
  if (prior) clearTimeout(prior.handle);
  commitTimers.set(sig, {
    target,
    slide,
    handle: setTimeout(() => commitTargetNow(target, slide), 900),
  });
}

/** Reads the field's CURRENT full value back out of the DOM (the DOM is the
 *  source of truth for arrays — see editable-canvas.js) and writes it. */
async function commitTargetNow(target, forSlide, { recordHistory = true } = {}) {
  if (!target?.field) return; // malformed target — refuse to write an undefined key
  const slide = forSlide ?? slides[currentIndex];
  if (!slide) return;
  const sig = `${slide.id}:${targetSignature(target)}`;
  const pending = commitTimers.get(sig);
  if (pending) clearTimeout(pending.handle);
  commitTimers.delete(sig);

  // Deck-level chrome writes to the presentation, not to this slide.
  if (target.kind === "deck") return commitDeckFieldNow(target, { recordHistory });

  const prevValue = structuredClone(slide.content[target.field]);
  // Committed values are trimmed: templates whose interpolation sits on its
  // own source line would otherwise write that indentation into the stored
  // content — and ship it to PPTX/PDF. The span keeps its display whitespace.
  let nextValue;
  if (target.kind === "text") nextValue = target.el ? readSpanText(target.el).trim() : slide.content[target.field];
  else if (target.kind === "list-item") nextValue = readListField(canvas, target.field).map((s) => s.trim());
  else nextValue = readStructuredField(canvas, target.field, rowRegistry);

  if (deepEqual(prevValue, nextValue)) return;
  slide.content[target.field] = nextValue;

  // Style overrides on a list/row are keyed by INDEX ("bullets[2]"). If the
  // user just added or removed an item, every index after it shifts, and a
  // kept override would silently re-attach to a different bullet. Dropping
  // that field's overrides is the honest resolution — the alternative is
  // styling that appears to jump to text nobody styled.
  const lengthChanged =
    Array.isArray(prevValue) && Array.isArray(nextValue) && prevValue.length !== nextValue.length;
  let styleOverrides;
  if (lengthChanged) {
    const prevStyles = slide.styleOverrides || {};
    const kept = Object.fromEntries(
      Object.entries(prevStyles).filter(([key]) => !key.startsWith(`${target.field}[`))
    );
    if (!deepEqual(kept, prevStyles)) styleOverrides = kept;
  }

  await writeField(slide, target.field, nextValue, prevValue, { rebuild: false, styleOverrides, recordHistory });
}

/** The single write path for a field, used by direct edits, AI-proposal
 *  Accepts, and undo/redo alike — so every one of them is autosaved and
 *  undo-able identically. `rebuild:false` skips rebuilding the canvas DOM
 *  (used while the user might still be interacting with it in place);
 *  undo/redo and AI accepts pass `rebuild:true`. */
async function writeField(slide, field, value, prevValue, { rebuild, styleOverrides, recordHistory = true }) {
  const prevStyleOverrides = structuredClone(slide.styleOverrides || {});
  const write = async (v, { rebuildAfter, styles }) => {
    const updated = await api.updateSlide(presentationId, slide.id, {
      content: { [field]: v },
      manualOverrides: { [field]: true },
      // Only sent when this edit invalidated index-keyed styles, so an
      // ordinary text edit still PATCHes exactly what it used to.
      ...(styles ? { styleOverrides: styles } : {}),
    });
    const idx = slides.findIndex((s) => s.id === updated.id);
    if (idx !== -1) slides[idx] = updated;
    if (rebuildAfter && idx === currentIndex) renderCanvas();
    paintThumb(idx);
  };

  beginSave();
  try {
    await write(value, { rebuildAfter: rebuild, styles: styleOverrides });
    endSave(true);
    if (!recordHistory) return true; // an Escape-revert restores the server silently
    pushHistory({
      label: `edit ${field}`,
      undo: async () => {
        await write(prevValue, {
          rebuildAfter: true,
          styles: styleOverrides ? prevStyleOverrides : undefined, // restore the styles this edit dropped
        });
      },
      redo: async () => { await write(value, { rebuildAfter: true, styles: styleOverrides }); },
    });
    return true;
  } catch (err) {
    endSave(false, err instanceof ApiError && err.status === 422 ? "Change rejected" : "Not saved");
    // Revert unconditionally, not just on 422: a network/server failure
    // leaves the canvas showing an edit (e.g. a duplicated list item) that
    // was never persisted, with no undo entry to recover it — the next
    // reload then silently drops it. writeStyle() and commitDeckFieldNow()
    // already roll back on any error; this path must match.
    slide.content[field] = prevValue;
    renderCanvas();
    toast(errText(err, "Could not save your edit."), "error");
    return false;
  }
}

function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* ---- Floating toolbar ------------------------------------------------------ */
function showFloatingToolbar(el) {
  const repeatable = selection?.kind === "list-item" || selection?.kind === "row-field";
  const isDeck = selection?.kind === "deck";
  const isImage = selection?.kind === "image";
  const isVisual = selection?.kind === "visual";
  floatImageBtn.hidden = !isImage;
  floatDuplicate.hidden = !repeatable;
  floatDelete.hidden = !repeatable;
  floatSep1.hidden = !repeatable;
  // Chrome is brand-locked typography and an image has no typography —
  // hiding the control beats a dead one.
  styleBtn.hidden = isDeck || isImage || isVisual;
  // State at show time is sufficient — re-checked every time the toolbar is
  // (re)shown, not live-updated mid-hover.
  refreshFloatingAiBusyState();
  floatBar.hidden = false;
  syncStyleButtonState();
  positionFloatingToolbar(el);
  // Resize is direct manipulation of the same `size` override the style
  // panel edits — offered exactly where typography is offered.
  resizeHandle.hidden = styleBtn.hidden;
  widthHandle.hidden = styleBtn.hidden;
  if (!resizeHandle.hidden) positionResizeHandle(el);
}
/** Disables/re-enables the three quick-action buttons and swaps their title
 *  to reflect ai.slideBusy() right now. Called both when the toolbar is
 *  (re)shown and right after a quick-action click sends — otherwise a
 *  second click while the first request is still in flight is a silent
 *  no-op with no visible feedback. */
function refreshFloatingAiBusyState() {
  const busy = ai.slideBusy();
  for (const btn of [floatAiShorter, floatAiImprove, floatAiExpand]) {
    btn.disabled = busy;
    btn.title = busy ? "AI is working on this slide" : btn.dataset.baseTitle || btn.title;
  }
}
function hideFloatingToolbar() { floatBar.hidden = true; resizeHandle.hidden = true; widthHandle.hidden = true; }
function repositionFloatingToolbar() {
  if (floatBar.hidden || !selection?.el || !document.contains(selection.el)) return;
  positionFloatingToolbar(selection.el);
  if (!resizeHandle.hidden) positionResizeHandle(selection.el);
  positionStylePanel();
}

/* ---- Resize handle (Phase 5) ------------------------------------------------
 * A corner grip on the selection: dragging it scales the text via the SAME
 * `size` style override the panel writes, so live preview, autosave, undo and
 * export parity all come for free from the existing write path. */
const resizeHandle = document.createElement("div");
resizeHandle.className = "ed-resize-handle";
resizeHandle.hidden = true;
resizeHandle.setAttribute("aria-hidden", "true");
resizeHandle.title = "Drag to resize";
document.body.appendChild(resizeHandle);

/* The second grip: the RIGHT EDGE resizes the text's BOX (its wrap width)
 * instead of its type size — a `w` override in slide px. Corner = "make the
 * text bigger", edge = "give the text more/less room", the same split every
 * design tool teaches. Double-click returns the box to the template's width. */
const widthHandle = document.createElement("div");
widthHandle.className = "ed-resize-handle ed-resize-handle--w";
widthHandle.hidden = true;
widthHandle.setAttribute("aria-hidden", "true");
widthHandle.title = "Drag to resize the text box — double-click to reset";
document.body.appendChild(widthHandle);

function positionResizeHandle(el) {
  const r = el.getBoundingClientRect();
  resizeHandle.style.top = `${r.bottom - 5}px`;
  resizeHandle.style.left = `${r.right - 5}px`;
  widthHandle.style.top = `${r.top + r.height / 2 - 9}px`;
  widthHandle.style.left = `${r.right - 3}px`;
}

resizeHandle.addEventListener("mousedown", (e) => {
  if (!selection?.el || e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  const el = selection.el;
  const startX = e.clientX;
  const startSize = styleForSelection().size || 1;
  const startW = el.getBoundingClientRect().width;
  if (!startW) return;
  document.body.classList.add("is-resizing-element");
  const onMove = (ev) => {
    const factor = (startW + (ev.clientX - startX)) / startW;
    const size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(startSize * factor * 100) / 100));
    setStyleForSelection({ size });
    positionResizeHandle(el);
    positionFloatingToolbar(el);
  };
  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    document.body.classList.remove("is-resizing-element");
    commitStyleNow();
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
});

widthHandle.addEventListener("mousedown", (e) => {
  if (!selection?.el || e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  const el = selection.el;
  const startX = e.clientX;
  const sc = stageScale() || 1;
  const startW = el.getBoundingClientRect().width / sc; // current box, slide units
  if (!startW) return;
  document.body.classList.add("is-resizing-width");
  const onMove = (ev) => {
    const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(startW + (ev.clientX - startX) / sc)));
    setStyleForSelection({ w });
    positionResizeHandle(el);
    positionFloatingToolbar(el);
  };
  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    document.body.classList.remove("is-resizing-width");
    commitStyleNow();
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
});

widthHandle.addEventListener("dblclick", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!selection?.el) return;
  setStyleForSelection({ w: undefined }); // stripped as a default → the template's width returns
  positionResizeHandle(selection.el);
  positionFloatingToolbar(selection.el);
  commitStyleNow();
});

function positionFloatingToolbar(el) {
  const r = el.getBoundingClientRect();
  const barR = floatBar.getBoundingClientRect();
  let top = r.top - barR.height - 10;
  let left = r.left + r.width / 2 - barR.width / 2;
  if (top < 8) top = r.bottom + 10; // flip below if there's no room above
  left = Math.max(8, Math.min(window.innerWidth - barR.width - 8, left));
  floatBar.style.top = `${top}px`;
  floatBar.style.left = `${left}px`;
}

function wireFloatingToolbar() {
  // Every control here acts on the selection for real — typography and
  // movement included (see the VISUAL EDITING section). Duplicate/Delete are
  // capability-detected in showFloatingToolbar(): they appear only for
  // repeatable items, because only those can be added to or removed from.
  floatAskAi.addEventListener("click", () => { ai.focusComposer(); });
  for (const [btn, prompt] of [
    [floatAiShorter, QUICK_ACTIONS.shorter],
    [floatAiImprove, QUICK_ACTIONS.improve],
    [floatAiExpand, QUICK_ACTIONS.expand],
  ]) {
    btn.dataset.baseTitle = btn.title;
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      ai.sendAi(prompt, "rewrite");
      refreshFloatingAiBusyState();
    });
  }
  floatDuplicate.addEventListener("click", duplicateSelectedItem);
  floatDelete.addEventListener("click", deleteSelectedItem);
  wireStylePanel();
}

/** Finds the "repeated item" ancestor to operate on — the element whose
 *  siblings (of the same tag) suggest it's one entry in a list/row group.
 *  Falls back to the span's own parent if no such ancestor is found within a
 *  few levels, which still works for templates that render one item per
 *  element with no extra wrapper. */
/**
 * The DOM element that IS "this repeatable item" — what duplicate/delete
 * clone or remove. The old heuristic (climb until a level has 2+ siblings
 * of the same tag) assumed every item has at least one sibling to compare
 * against. A list/row with exactly ONE entry has none, so it kept climbing
 * past the field's own wrapper, past the slide's content root, into the
 * stage itself — where the engine's Chrome (logo + footer divs) supplied
 * the "2+ siblings" it was looking for. The bug this caused: duplicating a
 * SLIDE's entire content as an overlapping, half-wired ghost, and deleting
 * it then removed the wrong thing — exactly the glitch reported (a phantom
 * duplicate of a single-item body paragraph that couldn't be cleanly
 * deleted). Bounding the climb by FIELD OWNERSHIP — never step into an
 * ancestor that also contains another field's (or another row's) content —
 * fixes the singleton case without changing the multi-item case, where the
 * sibling-count shortcut still fires immediately, before ownership even
 * needs to be checked.
 */
function findItemRoot(span) {
  return span.dataset.edKind === "row-field" ? findRowRoot(span) : findListItemRoot(span);
}

/** A row-field's root is bounded by ROW identity alone: climb while every
 *  `.ed-editable` under the candidate ancestor still belongs to this same
 *  row (any subKey), and stop the instant one belonging to a DIFFERENT row
 *  or field appears. This naturally lands on the row's own wrapper whether
 *  the field has one row or fifty — no sibling-counting needed. */
function findRowRoot(span) {
  const mine = (el) => !el.classList?.contains("ed-editable") || el.dataset.edRow === span.dataset.edRow;
  let el = span;
  for (let depth = 0; depth < 8 && el.parentElement; depth++) {
    const parent = el.parentElement;
    if (parent.classList?.contains("stage")) break; // never escape the slide's own content into chrome
    if ([...parent.querySelectorAll(".ed-editable")].some((e) => !mine(e))) break;
    el = parent;
  }
  return el;
}

/** A list-item's root is bounded by FIELD ownership (siblings of the same
 *  list are expected and safe to climb through) — but unlike a row, a list
 *  item's own wrapper must be found via the sibling-count shortcut, because
 *  "same field" stays true all the way up through the WHOLE list container.
 *  When that shortcut never fires (a list with exactly one entry has no
 *  sibling to detect), the field-ownership boundary is the fallback: return
 *  the deepest safe ancestor's IMMEDIATE PARENT of the starting point — the
 *  item's own direct wrapper — rather than whatever the climb reached. */
function findListItemRoot(span) {
  const sameField = (el) => !el.classList?.contains("ed-editable") || el.dataset.edField === span.dataset.edField;
  const fallback = span.parentElement || span;
  let el = span;
  for (let depth = 0; depth < 6 && el.parentElement; depth++) {
    const parent = el.parentElement;
    if (parent.classList?.contains("stage")) break;
    if ([...parent.querySelectorAll(".ed-editable")].some((e) => !sameField(e))) break;
    const siblingsOfSameTag = [...parent.children].filter((c) => c.tagName === el.tagName);
    if (siblingsOfSameTag.length >= 2) return el;
    el = parent;
  }
  return fallback;
}

async function duplicateSelectedItem() {
  if (!selection || (selection.kind !== "list-item" && selection.kind !== "row-field")) return;
  // A pending AI preview paints proposed text into the live spans; the
  // commit below reads the DOM back, so the preview MUST be lifted first or
  // un-accepted AI text gets silently persisted.
  if (ai.hasPreview()) ai.clearCanvasPreview();
  // Captured BEFORE clearSelection() — that call sets module-level
  // `selection` to null, so reading it after (as this used to) silently
  // committed a target with no field name, and the duplicate never reached
  // the server despite looking right in the DOM.
  const target = { ...selection, el: null };
  const root = findItemRoot(selection.el);
  const clone = root.cloneNode(true);

  if (selection.kind === "row-field") {
    // The clone's row-field spans still carry the ORIGINAL row-uid — give
    // them a fresh one and register a copy of that row's full object so
    // untouched (non-editable) keys survive the duplication too.
    const oldUid = selection.rowUid;
    const newUid = `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    rowRegistry.set(newUid, structuredClone(rowRegistry.get(oldUid) || {}));
    for (const spanEl of clone.querySelectorAll(`.ed-editable[data-ed-row="${cssEscape(oldUid)}"]`)) {
      spanEl.dataset.edRow = newUid;
    }
  }

  // The clone copied data-ed-wired from its source but cloneNode carries no
  // listeners — strip the flag so wireEditableSpans treats it as fresh, then
  // wire ONLY the clone's subtree (re-wiring the parent double-bound every
  // sibling's handlers, compounding with each duplicate).
  for (const s of clone.matches?.(".ed-editable") ? [clone] : clone.querySelectorAll(".ed-editable")) {
    delete s.dataset.edWired;
  }
  root.after(clone);
  wireEditableSpans(clone);
  clearSelection();
  await commitTargetNow(target);
  paintThumb(currentIndex);
  // No success toast: the new item appearing on the canvas already says
  // "duplicated" — a toast here only competed with the AI panel's input,
  // which sits in the same bottom-right corner.
}

async function deleteSelectedItem() {
  if (!selection || (selection.kind !== "list-item" && selection.kind !== "row-field")) return;
  if (ai.hasPreview()) ai.clearCanvasPreview(); // never persist an un-accepted AI preview
  const target = { ...selection, el: null };
  const root = findItemRoot(selection.el);
  if (selection.kind === "row-field") rowRegistry.delete(selection.rowUid);
  root.remove();
  clearSelection();
  await commitTargetNow(target);
  paintThumb(currentIndex);
  // No success toast — see duplicateSelectedItem() above.
}


/* ---- Slide operations: add / duplicate / delete ---------------------------- */
function wireSlideOps() {
  addSlideBtn.addEventListener("click", (e) => { e.stopPropagation(); openAddMenu(); });
  document.addEventListener("click", () => { closeMenu(addMenu, addSlideBtn); closeMenu(slideMenu); });
  // The context menu closes on the NEXT press outside it (pointerdown, not
  // click) — a right-click's own event sequence must not dismiss the menu it
  // just opened.
  document.addEventListener("pointerdown", (e) => {
    if (!canvasMenu.hidden && !canvasMenu.contains(e.target)) closeMenu(canvasMenu);
  });
  stage.addEventListener("contextmenu", openCanvasMenu);
  wireAiSlideModal();
}
function closeMenu(menu, trigger) {
  if (menu.hidden) return;
  menu.hidden = true;
  trigger?.setAttribute("aria-expanded", "false");
  // Keyboard users get their place back; mouse users aren't disturbed
  // (focus only returns if it was inside the menu).
  if (trigger && menu.contains(document.activeElement)) trigger.focus();
}

/** Arrow-key navigation for anchored menus — every menu behaves like a menu:
 *  ↑/↓ cycle, Home/End jump, Escape closes and restores focus. */
function wireMenuKeys(menu, trigger) {
  if (menu.dataset.keysWired) return;
  menu.dataset.keysWired = "1";
  menu.addEventListener("keydown", (e) => {
    const items = [...menu.querySelectorAll('[role="menuitem"]:not([disabled])')];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(menu, trigger); }
  });
}

/* ---- Canvas context menu ----------------------------------------------------
 * Right-click anywhere on the canvas gets a menu instead of the browser's:
 * element actions when the click lands on an editable (it is selected first,
 * exactly as a left-click would), slide actions always. Menu items reuse the
 * same handlers as the floating toolbar and rail menu — this is a third door
 * to the same rooms, not new rooms. */
function openCanvasMenu(e) {
  // While typing, the native menu (paste, spell-check) is the useful one.
  if (e.target.closest?.(".ed-editable")?.isContentEditable) return;
  e.preventDefault();
  closeMenu(addMenu, addSlideBtn); closeMenu(slideMenu);
  const el = e.target.closest?.(".ed-editable");
  if (el) selectElement(el);
  else clearSelection();

  const repeatable = el && (el.dataset.edKind === "list-item" || el.dataset.edKind === "row-field");
  const isDeck = el?.dataset.edKind === "deck";
  const busy = ai.slideBusy();
  const busyAttrs = busy ? `disabled title="AI is working on this slide"` : "";
  const parts = [];
  if (el) {
    parts.push(`<button type="button" role="menuitem" data-cv="edit">Edit text</button>`);
    parts.push(`<button type="button" role="menuitem" data-cv="ai">Ask AI about this</button>`);
    parts.push(`<button type="button" role="menuitem" data-cv="ai-shorter" ${busyAttrs}>Shorter</button>`);
    parts.push(`<button type="button" role="menuitem" data-cv="ai-improve" ${busyAttrs}>Improve</button>`);
    parts.push(`<button type="button" role="menuitem" data-cv="ai-expand" ${busyAttrs}>Expand</button>`);
    if (!isDeck) parts.push(`<button type="button" role="menuitem" data-cv="style">Style &amp; position…</button>`);
    if (repeatable) {
      parts.push(`<button type="button" role="menuitem" data-cv="dup-item">Duplicate item</button>`);
      parts.push(`<button type="button" role="menuitem" class="danger" data-cv="del-item">Delete item</button>`);
    }
    parts.push(`<hr class="card-menu__sep">`);
  }
  parts.push(`<button type="button" role="menuitem" data-cv="add-slide">New slide…</button>`);
  parts.push(`<button type="button" role="menuitem" data-cv="dup-slide">Duplicate slide</button>`);
  parts.push(`<button type="button" role="menuitem" data-cv="swap">Swap template…</button>`);
  if (slides.length > 1) parts.push(`<button type="button" role="menuitem" class="danger" data-cv="del-slide">Delete slide</button>`);

  canvasMenu.innerHTML = parts.join("");
  placeMenuAt(canvasMenu, e.clientX, e.clientY);
  wireMenuKeys(canvasMenu);
  canvasMenu.querySelector("button")?.focus();
  canvasMenu.onclick = (ev) => {
    const target = ev.target.closest("[data-cv]");
    const act = target?.dataset.cv;
    if (!act || target?.disabled) return;
    closeMenu(canvasMenu);
    if (act === "edit" && el) enterEdit(el);
    if (act === "ai") ai.focusComposer();
    if (act === "ai-shorter" || act === "ai-improve" || act === "ai-expand") {
      const prompt = act === "ai-shorter" ? QUICK_ACTIONS.shorter : act === "ai-improve" ? QUICK_ACTIONS.improve : QUICK_ACTIONS.expand;
      ai.sendAi(prompt, "rewrite");
      refreshFloatingAiBusyState();
    }
    if (act === "style") openStylePanel();
    if (act === "dup-item") duplicateSelectedItem();
    if (act === "del-item") deleteSelectedItem();
    if (act === "add-slide") { addPosition = "after"; openPicker("add"); }
    if (act === "dup-slide") duplicateSlide(currentIndex);
    if (act === "swap") openPicker("swap");
    if (act === "del-slide") askDeleteSlide(currentIndex);
  };
}

function placeMenuAt(menu, x, y) {
  menu.style.visibility = "hidden";
  menu.hidden = false;
  const w = menu.offsetWidth, h = menu.offsetHeight;
  menu.style.left = `${Math.max(12, Math.min(window.innerWidth - w - 12, x))}px`;
  menu.style.top = `${Math.max(12, Math.min(window.innerHeight - h - 12, y))}px`;
  menu.style.visibility = "";
}
function placeMenu(menu, anchor) {
  const r = anchor.getBoundingClientRect();
  menu.hidden = false;
  // closeMenu() sets this back to "false"; nothing was setting it to "true".
  if (anchor.hasAttribute("aria-haspopup")) anchor.setAttribute("aria-expanded", "true");
  menu.style.top = `${Math.min(window.innerHeight - menu.offsetHeight - 12, r.bottom + 6)}px`;
  menu.style.left = `${Math.max(12, Math.min(window.innerWidth - menu.offsetWidth - 12, r.left))}px`;
}
/** Two ways to add a slide: pick a template, or describe one and let Claude
 *  pick. There is no "blank" — every slide in this system is a template with
 *  content, so a blank one would just be a template chosen arbitrarily on the
 *  user's behalf. New slides insert right after the current one. */
function openAddMenu() {
  addMenu.innerHTML = `
    <button type="button" role="menuitem" data-add="template">From template</button>
    <button type="button" role="menuitem" data-add="ai">Generate with AI</button>`;
  placeMenu(addMenu, addSlideBtn);
  addSlideBtn.setAttribute("aria-expanded", "true");
  wireMenuKeys(addMenu, addSlideBtn);
  addMenu.querySelector("button")?.focus();
  addMenu.onclick = (e) => {
    const kind = e.target.closest("[data-add]")?.dataset.add;
    if (!kind) return;
    closeMenu(addMenu, addSlideBtn);
    addPosition = "after";
    if (kind === "template") {
      if (templates.length === 1) addSlide(templates[0].name, "after");
      else openPicker("add");
    } else if (kind === "ai") {
      openAiSlideModal();
    }
  };
}

/* ---- "Generate slide with AI" — Claude picks the template, the user only
 * states intent. Never a form field-by-field pick; a single question. */
function openAiSlideModal() {
  aiSlideInput.value = "";
  aiSlideError.hidden = true;
  aiSlideModal.hidden = false;
  aiSlideGenerateBtn.disabled = false;
  aiSlideGenerateBtn.textContent = "Generate";
  aiSlideInput.focus();
}
function closeAiSlideModal() { aiSlideModal.hidden = true; }
function wireAiSlideModal() {
  aiSlideCancel.addEventListener("click", closeAiSlideModal);
  aiSlideModal.addEventListener("click", (e) => { if (e.target === aiSlideModal) closeAiSlideModal(); });
  aiSlideGenerateBtn.addEventListener("click", generateSlideWithAi);
  document.addEventListener("keydown", (e) => {
    if (aiSlideModal.hidden) return;
    if (e.key === "Escape") closeAiSlideModal();
    if (e.key === "Tab") trapFocus(e, aiSlideModal);
  });
}
async function generateSlideWithAi() {
  const intent = aiSlideInput.value.trim();
  if (!intent) { aiSlideError.textContent = "Describe what this slide should communicate."; aiSlideError.hidden = false; return; }
  aiSlideError.hidden = true;
  aiSlideGenerateBtn.disabled = true;
  aiSlideGenerateBtn.textContent = "Generating…";
  const relativeToSlideId = slides[currentIndex]?.id;
  beginSave();
  setBusy(true);
  try {
    const res = await api.generateSlideWithAi(presentationId, { intent, position: "after", relativeToSlideId });
    closeAiSlideModal();
    adoptSlides(res.presentation, res.index);
    endSave(true);
    const newId = res.slide.id;
    pushHistory({
      label: "generate slide with AI",
      undo: async () => { const p = await api.deleteSlide(presentationId, newId); adoptSlides(p, Math.max(0, res.index - 1)); },
      redo: async () => {
        const again = await api.generateSlideWithAi(presentationId, { intent, position: "after", relativeToSlideId });
        adoptSlides(again.presentation, again.index);
      },
    });
    toast("Slide generated.", "success");
  } catch (err) {
    aiSlideError.textContent = errText(err, "Could not generate a slide.");
    aiSlideError.hidden = false;
    endSave(false);
  } finally {
    setBusy(false);
    aiSlideGenerateBtn.disabled = false;
    aiSlideGenerateBtn.textContent = "Generate";
  }
}
function openSlideMenu(anchor, index) {
  closeMenu(addMenu, addSlideBtn);
  slideMenu.innerHTML = `
    <button type="button" role="menuitem" data-act="swap">Swap template</button>
    <button type="button" role="menuitem" data-act="duplicate">Duplicate slide</button>
    <button type="button" role="menuitem" class="danger" data-act="delete">Delete slide</button>`;
  placeMenu(slideMenu, anchor);
  wireMenuKeys(slideMenu, anchor);
  slideMenu.querySelector("button")?.focus();
  slideMenu.onclick = (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    closeMenu(slideMenu);
    if (act === "swap") {
      // The swap flow always operates on the currently selected slide
      // (its fieldDefs) — select this row first if the menu was opened on
      // a slide other than the one already showing on the canvas.
      if (index !== currentIndex) selectSlide(index);
      openPicker("swap");
    }
    if (act === "duplicate") duplicateSlide(index);
    if (act === "delete") askDeleteSlide(index);
  };
}
function adoptSlides(presentation, nextIndex) {
  record = presentation;
  slides = presentation.slides.map((s) => structuredClone(s));
  renderRail();
  selectSlide(Math.max(0, Math.min(slides.length - 1, nextIndex)));
}

/** Presentation-level (not slide) fields — today just `aiMemory`. Returns
 *  the server-normalized record fields (ids assigned server-side for new
 *  entries, createdAt preserved for existing ones) so the caller's next
 *  getPresentation() read reflects reality. No global busy/save-indicator
 *  hooks: memory edits are advisory metadata, not slide content, and don't
 *  belong to the undo/redo or save-state machinery. Throws on failure — the
 *  caller (memory.js) is responsible for rollback + toast. */
async function patchPresentation(fields) {
  const updated = await api.updatePresentation(presentationId, fields);
  record = { ...record, ...updated };
  return record;
}
async function addSlide(templateName, position) {
  const relativeToSlideId = slides[currentIndex]?.id;
  beginSave();
  setBusy(true);
  try {
    const res = await api.addSlide(presentationId, { templateName, position, relativeToSlideId });
    adoptSlides(res.presentation, res.index);
    endSave(true);
    const newId = res.slide.id;
    // Rebinds ITS OWN undo after a redo (the recreated slide has a new id)
    // — never via undoStack[length-1], which may be a different entry.
    const entry = {
      label: "add slide",
      undo: async () => { const p = await api.deleteSlide(presentationId, newId); adoptSlides(p, Math.max(0, res.index - 1)); },
      redo: async () => {
        const again = await api.addSlide(presentationId, { templateName, position, relativeToSlideId });
        adoptSlides(again.presentation, again.index);
        const id = again.slide.id;
        entry.undo = async () => {
          const p = await api.deleteSlide(presentationId, id);
          adoptSlides(p, Math.max(0, again.index - 1));
        };
      },
    };
    pushHistory(entry);
    toast("Slide added.", "success");
  } catch (err) {
    endSave(false);
    toast(errText(err, "Could not add the slide."), "error");
  } finally {
    setBusy(false);
  }
}
async function duplicateSlide(index) {
  const source = slides[index];
  beginSave();
  setBusy(true);
  try {
    const res = await api.duplicateSlide(presentationId, source.id);
    adoptSlides(res.presentation, res.index);
    endSave(true);
    const copyId = res.slide.id;
    const entry = {
      label: "duplicate slide",
      undo: async () => { const p = await api.deleteSlide(presentationId, copyId); adoptSlides(p, index); },
      redo: async () => {
        const again = await api.duplicateSlide(presentationId, source.id);
        adoptSlides(again.presentation, again.index);
        const id = again.slide.id;
        entry.undo = async () => {
          const p = await api.deleteSlide(presentationId, id);
          adoptSlides(p, index);
        };
      },
    };
    pushHistory(entry);
    toast("Slide duplicated.", "success");
  } catch (err) {
    endSave(false);
    toast(errText(err, "Could not duplicate the slide."), "error");
  } finally {
    setBusy(false);
  }
}
let pendingDeleteIndex = null;
function askDeleteSlide(index) {
  if (slides.length <= 1) { toast("A presentation must keep at least one slide.", "error"); return; }
  pendingDeleteIndex = index;
  deleteBody.textContent = `Delete slide ${index + 1}? You can undo this straight afterwards.`;
  deleteModal.hidden = false;
  deleteCancel.focus();
}
function wireDeleteModal() {
  deleteCancel.addEventListener("click", () => { deleteModal.hidden = true; });
  deleteConfirm.addEventListener("click", doDeleteSlide);
  document.addEventListener("keydown", (e) => {
    if (deleteModal.hidden) return;
    if (e.key === "Escape") deleteModal.hidden = true;
    if (e.key === "Tab") trapFocus(e, deleteModal);
  });
}
async function doDeleteSlide() {
  const index = pendingDeleteIndex;
  if (index == null) return;
  const removed = structuredClone(slides[index]);
  deleteModal.hidden = true;
  beginSave();
  setBusy(true);
  try {
    const p = await api.deleteSlide(presentationId, removed.id);
    adoptSlides(p, Math.max(0, index - 1));
    endSave(true);
    pushHistory({
      label: "delete slide",
      // `restoredId` keeps the pair id-stable: redo must delete exactly the
      // slide undo recreated, not whatever sits at the old index after
      // intervening reorders/adds.
      restoredId: null,
      undo: async function () {
        const anchor = slides[index] || slides[slides.length - 1];
        const res = await api.addSlide(presentationId, {
          templateName: removed.templateReference.templateName,
          position: anchor ? "before" : "end",
          relativeToSlideId: anchor?.id,
        });
        const restored = await api.updateSlide(presentationId, res.slide.id, {
          content: removed.content, manualOverrides: removed.manualOverrides,
        });
        this.restoredId = restored.id;
        const fresh = await api.getPresentation(presentationId);
        adoptSlides(fresh, fresh.slides.findIndex((s) => s.id === restored.id));
      },
      redo: async function () {
        const targetId = this.restoredId ?? slides[index]?.id;
        if (!targetId) return;
        const at = slides.findIndex((s) => s.id === targetId);
        const p2 = await api.deleteSlide(presentationId, targetId);
        adoptSlides(p2, Math.max(0, (at === -1 ? index : at) - 1));
      },
    });
    toast("Slide deleted.", "success");
  } catch (err) {
    endSave(false);
    toast(errText(err, "Could not delete the slide."), "error");
  } finally {
    setBusy(false);
    pendingDeleteIndex = null;
  }
}
// Counted, not boolean: an AI request and a slide operation can overlap, and
// the first to finish must not re-enable the toolbar mid-write of the other.
let busyCount = 0;
function setBusy(v) {
  busyCount = Math.max(0, busyCount + (v ? 1 : -1));
  busy = busyCount > 0;
  document.body.classList.toggle("is-busy", busy);
  addSlideBtn.disabled = busy;
  renderHistoryButtons();
  ai.syncSendState();
}

/* ---- Template picker (add + swap share it) --------------------------------
 * Auto-applies when every field of the new template resolves to an exact
 * name match (a "high-confidence" mapping, per spec) — the mapping dialog
 * only appears when something is genuinely ambiguous. */
function wirePicker() {
  swapClose.addEventListener("click", closePicker);
  swapDialog.addEventListener("click", (e) => { if (e.target === swapDialog) closePicker(); });
  swapBackBtn.addEventListener("click", showPickerView);
  swapConfirmBtn.addEventListener("click", () => commitSwap(false));
  let handle;
  swapSearch.addEventListener("input", () => { clearTimeout(handle); handle = setTimeout(renderPickerGrid, 250); });
  swapCategory.addEventListener("change", renderPickerGrid);
  document.addEventListener("keydown", (e) => {
    if (swapDialog.hidden || !conflictModal.hidden) return;
    if (e.key === "Escape") closePicker();
    if (e.key === "Tab") trapFocus(e, swapDialog);
  });
}
function openPicker(mode) {
  pickerMode = mode;
  $("swap-dialog-title").textContent = mode === "add" ? "Choose a template" : "Swap template";
  if (swapCategory.options.length <= 1) {
    const cats = [...new Set(templates.map((t) => t.category))].sort((a, b) => a.localeCompare(b));
    swapCategory.innerHTML = `<option value="">All categories</option>` +
      cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }
  // Unhide FIRST: showPickerView() renders the grid and measures every
  // card's width to compute its scale — while swapDialog was still hidden
  // (display:none), that measured 0 for all 103 cards, so every preview
  // rendered its RAW 1920×1080 stage at native size instead of scaled down.
  // The old code deferred the scale to requestAnimationFrame hoping the
  // dialog would be visible by the next frame — it usually was, but a big
  // dialog like this one can render before that frame ever fires, and then
  // it stayed broken until closed and reopened. Same fix as
  // openStylePanel(): do the visibility flip before the measurement, not
  // after, so there's no frame to race in the first place.
  swapDialog.hidden = false;
  showPickerView();
  swapSearch.focus();
}
function closePicker() { swapDialog.hidden = true; pendingSwapTemplate = null; pendingSwapMapping = null; }
function showPickerView() {
  pendingSwapTemplate = null;
  pendingSwapMapping = null;
  swapPickerView.hidden = false;
  swapConfirmView.hidden = true;
  renderPickerGrid();
}
function renderPickerGrid() {
  const q = swapSearch.value.trim().toLowerCase();
  const cat = swapCategory.value;
  const results = templates.filter((t) => {
    if (cat && t.category !== cat) return false;
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });
  swapCount.textContent = results.length === 1 ? "1 template" : `${results.length} templates`;
  swapGrid.innerHTML = "";
  for (const t of results) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "deck-card tpl-card editor-swap-card";
    card.setAttribute("aria-label", t.name);
    card.addEventListener("click", () => {
      if (pickerMode === "add") { closePicker(); addSlide(t.name, addPosition || "end"); }
      else beginSwap(t);
    });
    const thumb = document.createElement("div");
    thumb.className = "deck-card__thumb";
    thumb.dataset.theme = t.theme;
    const frame = document.createElement("div");
    frame.className = "deck-card__frame";
    thumb.appendChild(frame);
    const meta = document.createElement("div");
    meta.className = "deck-card__meta";
    meta.innerHTML = `<h3 class="deck-card__title">${escapeHtml(t.name)}</h3><span class="tpl-category">${escapeHtml(t.category)}</span>`;
    card.append(thumb, meta);
    swapGrid.appendChild(card);
    try {
      const s = buildStage({ template: t.name, ...t.example }, { title: t.name });
      s.classList.add("is-thumb");
      frame.appendChild(s);
      // Scaled synchronously, not on the next rAF: `thumb` is already laid
      // out the instant it's appended (its width comes from CSS grid, not
      // from anything this code has to wait a frame for), so deferring to
      // rAF bought nothing — and under a big dialog like this one (103
      // synchronous template renders in one tick) that rAF sometimes never
      // fires at all, leaving every card showing its RAW 1920×1080 stage,
      // uncropped and unscaled, at native size inside a 259px box. That's
      // exactly the "badly rendered" picker that was reported.
      frame.style.transform = `scale(${thumb.clientWidth / 1920})`;
    } catch { /* one preview failing must not break the picker */ }
  }
}

/** "structured" is a coarse bucket — it covers array-of-{title,items} just as
 *  much as array-of-[a,b,c] row tuples, which read each other's elements as
 *  the wrong shape (a row tuple has no `.bullets`) and fail the exact same
 *  way a scalar would. Two structured fields are only a safe AUTOMATIC guess
 *  when their declared sub-keys actually overlap; otherwise this can't tell
 *  them apart from the outside and must not pretend it can. list/text kinds
 *  have no sub-shape to compare, so kind equality alone is enough for them. */
function structurallyCompatible(nd, od) {
  if (nd.kind !== "structured") return true;
  if (!nd.subKeys.length || !od.subKeys.length) return false;
  return nd.subKeys.some((k) => od.subKeys.includes(k));
}

/** Guesses the field mapping (exact name, then same-kind by position) and
 *  either applies it straight away when every new field resolved with high
 *  confidence, or opens the mapping dialog when it didn't. */
function beginSwap(template) {
  pendingSwapTemplate = template;
  const oldDefs = fieldDefs;
  const newDefs = editableFields(template.schema || {});

  const used = new Set();
  const guess = {};
  let allExact = newDefs.length > 0;
  for (const nd of newDefs) {
    // Same name is not enough: two templates can both call a field "columns"
    // while meaning different shapes (a fixed string[3] of header labels vs.
    // an array of {title, items[]} objects). Requiring the kind to match too
    // is what stops a text value from ever landing in an array-shaped field —
    // without this, "exact" matches skipped the confirmation dialog entirely
    // and produced exactly the render-validation crash this guards against.
    const exact = oldDefs.find((od) => od.key === nd.key && od.kind === nd.kind && structurallyCompatible(nd, od) && !used.has(od.key));
    if (exact) { guess[nd.key] = exact.key; used.add(exact.key); continue; }
    allExact = false;
    const sameKind = oldDefs.find((od) => od.kind === nd.kind && structurallyCompatible(nd, od) && !used.has(od.key));
    guess[nd.key] = sameKind ? sameKind.key : "";
    if (sameKind) used.add(sameKind.key);
  }
  pendingSwapMapping = guess;

  if (allExact) { commitSwap(false); return; }
  openSwapMapping(template, oldDefs, newDefs, guess);
}

function openSwapMapping(template, oldDefs, newDefs, guess) {
  // Only ever offer a source field whose kind matches the destination field's
  // kind — a "text" field must never be selectable for a "list"/"structured"
  // destination (that's what let the user manually pick a mapping that made
  // the slide fail to render). "Leave template default" is always offered as
  // the safe fallback (an empty array/string, per the template's own render).
  const options = (nd) =>
    [`<option value="">— leave template default —</option>`]
      .concat(oldDefs.filter((od) => od.kind === nd.kind).map((od) =>
        `<option value="${escapeHtml(od.key)}"${od.key === guess[nd.key] ? " selected" : ""}>${escapeHtml(od.label)}</option>`))
      .join("");
  const dropped = oldDefs.filter((od) => !Object.values(guess).includes(od.key));

  swapConfirmBody.innerHTML =
    `<p class="hint">Choose what each field of <strong>${escapeHtml(template.name)}</strong> should use.</p>` +
    `<div class="ed-map">` +
    newDefs.map((nd) => `
      <div class="ed-map__row">
        <span class="ed-map__to">${escapeHtml(nd.label)}</span>
        <select class="ed-map__select" data-to="${escapeHtml(nd.key)}" aria-label="Source for ${escapeHtml(nd.label)}">
          ${options(nd)}
        </select>
      </div>`).join("") +
    `</div>` +
    `<p class="ed-map__ai-status" id="ed-map-ai-status">Asking Claude for a better mapping…</p>` +
    (dropped.length
      ? `<p class="ed-map__warn">Not carried over: ${dropped.map((d) => escapeHtml(d.label)).join(", ")}.</p>`
      : "");

  swapConfirmBody.querySelectorAll(".ed-map__select").forEach((sel) => {
    sel.addEventListener("change", () => { pendingSwapMapping[sel.dataset.to] = sel.value; });
  });
  swapPickerView.hidden = true;
  swapConfirmView.hidden = false;

  requestClaudeMapping(template, guess);
}

/** Claude proposes the mapping (per spec) for whatever the deterministic
 *  heuristic left unresolved ("" / leave-default). Only fills gaps — a
 *  field the user has already changed by the time this resolves is left
 *  alone, checked by comparing against the ORIGINAL heuristic guess. */
async function requestClaudeMapping(template, originalGuess) {
  const statusEl = $("ed-map-ai-status");
  const slide = slides[currentIndex];
  try {
    const { mapping } = await api.suggestFieldMapping(presentationId, slide.id, template.name);
    if (swapConfirmView.hidden || pendingSwapTemplate !== template) return; // dialog moved on
    let filled = 0;
    for (const [to, from] of Object.entries(mapping || {})) {
      if (!from) continue;
      const sel = swapConfirmBody.querySelector(`.ed-map__select[data-to="${cssEscape(to)}"]`);
      if (!sel) continue;
      // Only apply where the field is still exactly what the heuristic
      // guessed (unresolved "" or its own same-kind guess) — never override
      // a value the user picked themselves while this request was in flight.
      if (sel.value !== (originalGuess[to] || "")) continue;
      const hasOption = [...sel.options].some((o) => o.value === from);
      if (!hasOption) continue;
      sel.value = from;
      pendingSwapMapping[to] = from;
      filled++;
    }
    if (statusEl) statusEl.textContent = filled ? `Claude suggested ${filled} additional mapping${filled === 1 ? "" : "s"}.` : "Claude had no further suggestions.";
  } catch {
    if (statusEl) statusEl.textContent = "";
  }
}

async function commitSwap(allowOverride) {
  if (!pendingSwapTemplate) return;
  const slide = slides[currentIndex];
  const before = structuredClone(slide);
  swapConfirmBtn.disabled = true;
  beginSave();
  try {
    const result = await api.swapSlideTemplate(presentationId, slide.id, {
      templateName: pendingSwapTemplate.name, allowOverride,
    });
    const mapped = {};
    for (const [to, from] of Object.entries(pendingSwapMapping || {})) {
      if (from && before.content[from] !== undefined) mapped[to] = before.content[from];
    }
    let finalSlide = result.slide;
    if (Object.keys(mapped).length) {
      finalSlide = await api.updateSlide(presentationId, slide.id, { content: mapped });
    }
    const idx = slides.findIndex((s) => s.id === finalSlide.id);
    if (idx !== -1) slides[idx] = finalSlide;
    if (idx === currentIndex) renderCanvas();
    paintThumb(idx);
    endSave(true);
    closePicker();
    conflictModal.hidden = true;

    pushHistory({
      label: "swap template",
      undo: async () => {
        await api.swapSlideTemplate(presentationId, slide.id, { templateName: before.templateReference.templateName, allowOverride: true });
        const restored = await api.updateSlide(presentationId, slide.id, { content: before.content });
        const i2 = slides.findIndex((s) => s.id === restored.id);
        if (i2 !== -1) slides[i2] = restored;
        if (i2 === currentIndex) renderCanvas();
        paintThumb(i2);
      },
      redo: async () => {
        await api.swapSlideTemplate(presentationId, slide.id, { templateName: pendingSwapTemplate.name, allowOverride: true });
        let f2 = null;
        if (Object.keys(mapped).length) f2 = await api.updateSlide(presentationId, slide.id, { content: mapped });
        if (f2) {
          const i3 = slides.findIndex((s) => s.id === f2.id);
          if (i3 !== -1) slides[i3] = f2;
          if (i3 === currentIndex) renderCanvas();
          paintThumb(i3);
        }
      },
    });
    toast("Template applied.", "success");
  } catch (err) {
    endSave(false);
    if (err instanceof ApiError && err.status === 409) openConflictModal(err.message);
    else toast(errText(err, "Could not apply the template."), "error");
  } finally {
    swapConfirmBtn.disabled = false;
  }
}
function wireConflictModal() {
  conflictCancelBtn.addEventListener("click", () => { conflictModal.hidden = true; });
  conflictConfirmBtn.addEventListener("click", () => commitSwap(true));
  document.addEventListener("keydown", (e) => {
    if (conflictModal.hidden) return;
    if (e.key === "Escape") conflictModal.hidden = true;
    if (e.key === "Tab") trapFocus(e, conflictModal);
  });
}
function openConflictModal(message) {
  conflictModalBody.innerHTML = `<p>${escapeHtml(message)} Applying will keep your existing value for that field.</p>`;
  conflictModal.hidden = false;
  conflictCancelBtn.focus();
}

/* ============================================================================
   VISUAL EDITING — real per-element control, not a template excuse.

   Selecting text on the canvas gives you its typography (size, weight,
   color, alignment) and lets you MOVE it by dragging or nudging with the
   arrow keys. Every change is a persisted style override on the slide
   (product/domain/slide-style.js validates it, js/style-overrides.js applies
   it), so the same edit shows in the rail thumbnail, in Present mode, and in
   the PowerPoint/PDF export — not just here.

   Sizes are RELATIVE (1 = whatever the template chose) and colors are brand
   tokens, so this cannot take a slide off-brand — it can only re-balance it.
   ========================================================================= */
const SIZE_STEPS = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2, 2.4];
const NUDGE = 2;        // stage px per arrow press
const NUDGE_FAST = 16;  // with Shift
const DRAG_THRESHOLD = 3; // client px before a mousedown becomes a drag, not a click

/** The persisted identity of a styleable element — must match exactly what
 *  js/style-overrides.js computes when it applies styles outside the editor. */
function styleKeyFor(target) {
  if (!target?.field) return null;
  if (target.kind === "text") return textKey(target.field);
  if (target.kind === "list-item") return listKey(target.field, target.index);
  if (target.kind === "row-field" && target.rowIndex !== undefined && target.subKey) {
    return rowKey(target.field, target.rowIndex, target.subKey);
  }
  return null;
}

function currentOverrides() {
  return slides[currentIndex]?.styleOverrides || {};
}
function styleForSelection() {
  const key = styleKeyFor(selection);
  return key ? currentOverrides()[key] || {} : {};
}

/** Inline properties this module owns. Cleared before every re-apply so a
 *  removed property actually disappears instead of lingering from the last
 *  paint. */
const MANAGED_PROPS = ["fontSize", "fontWeight", "fontStyle", "color", "display", "translate", "width", "marginRight"];

function restyleElement(el, style) {
  for (const prop of MANAGED_PROPS) el.style[prop] = "";
  const block = alignTarget(el);
  if (block) block.style.textAlign = "";
  if (style && Object.keys(style).length) applyStyleToElement(el, style);
}

/** Applies the slide's whole override map to the decorated spans. The editor
 *  does this itself rather than letting buildStage() do it — see flatten(). */
function applyStylesToSpans(root, overrides) {
  if (!overrides || !Object.keys(overrides).length) return;
  for (const el of root.querySelectorAll(".ed-editable")) {
    const style = overrides[styleKeyFor(targetFromEl(el))];
    if (style) applyStyleToElement(el, style);
  }
}

/* ---- Writing ---------------------------------------------------------------
 * One write path for every style change (panel, drag, nudge, reset), so all
 * of them are autosaved and undoable identically — the same shape writeField()
 * gives content edits. Rapid changes (a drag, holding an arrow key) coalesce
 * into a single debounced save and a single undo entry. */
let styleCommitTimer = null;
let styleUndoBaseline = null; // the map as it was before the current burst

function setStyleForSelection(patch) {
  const key = styleKeyFor(selection);
  if (!key) return;
  const slide = slides[currentIndex];
  const before = structuredClone(slide.styleOverrides || {});
  if (styleUndoBaseline === null) styleUndoBaseline = before;

  const next = structuredClone(before);
  const merged = { ...(next[key] || {}), ...patch };
  // A property set back to its template default is REMOVED, not stored as a
  // no-op: the stored map stays a description of what the user actually
  // changed, which is what makes "Reset" and the has-overrides dot honest.
  for (const [prop, value] of Object.entries(merged)) {
    const isDefault =
      value === undefined || value === null || value === "" || value === false ||
      (prop === "size" && value === 1) ||
      ((prop === "dx" || prop === "dy") && value === 0);
    if (isDefault) delete merged[prop];
  }
  if (Object.keys(merged).length) next[key] = merged;
  else delete next[key];

  slide.styleOverrides = next;
  if (selection.el) restyleElement(selection.el, next[key]);
  renderStylePanel();

  clearTimeout(styleCommitTimer);
  styleCommitTimer = setTimeout(commitStyleNow, 450);
}

async function commitStyleNow() {
  clearTimeout(styleCommitTimer);
  const slide = slides[currentIndex];
  const baseline = styleUndoBaseline;
  styleUndoBaseline = null;
  if (!slide || baseline === null) return;
  const next = structuredClone(slide.styleOverrides || {});
  if (deepEqual(baseline, next)) return;
  await writeStyle(slide, next, baseline);
}

async function writeStyle(slide, nextMap, prevMap) {
  const write = async (map, { rebuild }) => {
    const updated = await api.updateSlide(presentationId, slide.id, { styleOverrides: map });
    const idx = slides.findIndex((s) => s.id === updated.id);
    if (idx !== -1) slides[idx] = updated;
    if (rebuild && idx === currentIndex) renderCanvas();
    paintThumb(idx);
  };

  beginSave();
  try {
    await write(nextMap, { rebuild: false }); // already painted live; don't disturb the selection
    endSave(true);
    pushHistory({
      label: "restyle element",
      undo: async () => { await write(prevMap, { rebuild: true }); },
      redo: async () => { await write(nextMap, { rebuild: true }); },
    });
  } catch (err) {
    endSave(false, err instanceof ApiError && err.status === 422 ? "Change rejected" : "Not saved");
    slide.styleOverrides = prevMap;
    renderCanvas();
    toast(errText(err, "Could not save that style change."), "error");
  }
}

/* ---- The panel -------------------------------------------------------------- */
function styleCapabilities() {
  // Alignment only when the selected text owns its own block — otherwise
  // aligning it would move sibling text the user never selected. Asking the
  // DOM instead of guessing is what keeps the control off the panel when it
  // genuinely cannot work.
  return { align: Boolean(selection?.el && alignTarget(selection.el)) };
}

function openStylePanel() {
  if (!selection?.el) return;
  // Unhide FIRST: renderStylePanel() no-ops while the panel is hidden (so a
  // background style change doesn't do pointless layout work), so calling it
  // before unhiding skipped the very update that should have populated the
  // panel — it opened showing stale/default text until some other change
  // triggered a re-render. The size stepper "jumping" to the real value was
  // that hidden state finally getting painted, not a computation bug.
  stylePanel.hidden = false;
  renderStylePanel();
  styleBtn.setAttribute("aria-expanded", "true");
  positionStylePanel();
  // Both handles are position:fixed at the same z-index as this panel, so
  // whichever was appended to <body> LAST wins the tie and shows through —
  // the panel opening on top of the selection otherwise left the resize
  // grips floating over its own controls. The panel's own Size field
  // already covers what the corner handle does; hide both while it's open.
  resizeHandle.hidden = true;
  widthHandle.hidden = true;
}
function closeStylePanel() {
  stylePanel.hidden = true;
  styleBtn?.setAttribute("aria-expanded", "false");
  if (selection?.el && !floatBar.hidden && !styleBtn.hidden) {
    resizeHandle.hidden = false;
    widthHandle.hidden = false;
    positionResizeHandle(selection.el);
  }
}
function positionStylePanel() {
  if (stylePanel.hidden || !selection?.el) return;
  const anchor = floatBar.getBoundingClientRect();
  const panel = stylePanel.getBoundingClientRect();
  let top = anchor.bottom + 8;
  if (top + panel.height > window.innerHeight - 8) top = Math.max(8, anchor.top - panel.height - 8);
  const left = Math.max(8, Math.min(window.innerWidth - panel.width - 8, anchor.left + anchor.width / 2 - panel.width / 2));
  stylePanel.style.top = `${top}px`;
  stylePanel.style.left = `${left}px`;
}

function renderStylePanel() {
  if (stylePanel.hidden) { syncStyleButtonState(); return; }
  const style = styleForSelection();
  const size = typeof style.size === "number" ? style.size : 1;

  styleSizeValue.textContent = `${Math.round(size * 100)}%`;
  styleSizeDown.disabled = size <= SIZE_STEPS[0];
  styleSizeUp.disabled = size >= SIZE_STEPS[SIZE_STEPS.length - 1];

  for (const btn of styleWeightGroup.querySelectorAll("[data-weight]")) {
    btn.classList.toggle("is-on", Number(btn.dataset.weight) === style.weight);
  }
  for (const btn of styleColorGroup.querySelectorAll("[data-color]")) {
    btn.classList.toggle("is-on", (btn.dataset.color || "") === (style.color || ""));
  }
  for (const btn of styleAlignGroup.querySelectorAll("[data-align]")) {
    btn.classList.toggle("is-on", btn.dataset.align === style.align);
  }

  styleAlignRow.hidden = !styleCapabilities().align;
  styleResetBtn.hidden = !Object.keys(style).length;
  syncStyleButtonState();
}

/** A dot on the toolbar button whenever the selected element carries any
 *  override — so "this isn't the template default" is visible without
 *  opening anything. */
function syncStyleButtonState() {
  styleBtn?.classList.toggle("has-style", Object.keys(styleForSelection()).length > 0);
}

function stepSize(delta) {
  const current = styleForSelection().size ?? 1;
  let i = SIZE_STEPS.findIndex((s) => Math.abs(s - current) < 0.001);
  if (i === -1) i = SIZE_STEPS.findIndex((s) => s >= current); // a value from an older map
  const next = SIZE_STEPS[Math.max(0, Math.min(SIZE_STEPS.length - 1, (i === -1 ? 4 : i) + delta))];
  setStyleForSelection({ size: Math.max(MIN_SIZE, Math.min(MAX_SIZE, next)) });
}

function wireStylePanel() {
  styleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    stylePanel.hidden ? openStylePanel() : closeStylePanel();
  });

  styleSizeUp.addEventListener("click", () => stepSize(1));
  styleSizeDown.addEventListener("click", () => stepSize(-1));

  styleWeightGroup.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-weight]");
    if (!btn) return;
    const weight = Number(btn.dataset.weight);
    if (!WEIGHTS.includes(weight)) return;
    // Clicking the active weight clears it, back to the template's own.
    setStyleForSelection({ weight: styleForSelection().weight === weight ? undefined : weight });
  });

  styleColorGroup.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-color]");
    if (!btn) return;
    setStyleForSelection({ color: btn.dataset.color || undefined });
  });

  styleAlignGroup.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-align]");
    if (!btn) return;
    setStyleForSelection({ align: styleForSelection().align === btn.dataset.align ? undefined : btn.dataset.align });
  });

  styleResetBtn.addEventListener("click", () => {
    setStyleForSelection({ size: undefined, weight: undefined, italic: false, color: undefined, align: undefined, dx: 0, dy: 0 });
  });

  stylePanel.addEventListener("mousedown", (e) => e.stopPropagation()); // never deselects the canvas
  window.addEventListener("resize", positionStylePanel);
  stage.addEventListener("scroll", positionStylePanel);
}

/* ---- Moving ----------------------------------------------------------------
 * Direct manipulation: drag the selected text, or nudge it with the arrow
 * keys. Offsets are stored in 1920×1080 stage coordinates, so a move made at
 * 50% zoom lands in the same place at 100% and in the export. */
function stageScale() {
  return (canvas.clientWidth || 1920) / 1920;
}

function nudgeSelection(dxStep, dyStep) {
  if (selection?.kind === "deck" || selection?.kind === "image") return; // no positional styling for chrome/images
  const style = styleForSelection();
  setStyleForSelection({
    dx: Math.round(((style.dx || 0) + dxStep) * 10) / 10,
    dy: Math.round(((style.dy || 0) + dyStep) * 10) / 10,
  });
}

function beginDrag(el, startEvent) {
  if (el.isContentEditable || spacePanning) return;
  const scale = stageScale() || 1;
  const style = styleForSelection();
  const originX = style.dx || 0;
  const originY = style.dy || 0;
  const startX = startEvent.clientX;
  const startY = startEvent.clientY;
  let dragging = false;

  // The element must stay reachable: clamp the drag so a real handle of it
  // (80 slide-px) always remains inside the 1920×1080 slide. Off-canvas
  // text was unclickable and unrecoverable except by undo. All math in
  // slide units — immune to zoom/scale conversion drift.
  const stageEl = canvas.querySelector(".stage");
  const stageRect = stageEl?.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const sc = stageRect ? stageRect.width / 1920 : scale;
  const baseLeft = stageRect ? (elRect.left - stageRect.left) / sc - originX : 0;
  const baseTop = stageRect ? (elRect.top - stageRect.top) / sc - originY : 0;
  const elW = elRect.width / sc, elH = elRect.height / sc;
  const HANDLE = 80;
  const dxMin = -baseLeft - elW + HANDLE, dxMax = 1920 - baseLeft - HANDLE;
  const dyMin = -baseTop - elH + Math.min(HANDLE, elH), dyMax = 1080 - baseTop - Math.min(HANDLE, elH);

  // Snapping (Phase 5): the scene graph already knows every other object's
  // edges and centers in slide units, so alignment is a lookup, not a scan.
  // Alt disables it, matching Figma/Canva muscle memory.
  // Clamped at both ends: below 4 slide-units the threshold is too fine to
  // ever trigger meaningfully; above 40 (an extreme zoom-out where `sc` is
  // tiny), 8 screen px stops meaning "close" and starts snapping to guides
  // nowhere near the cursor.
  const SNAP_T = Math.min(40, Math.max(4, 8 / sc)); // ~8 screen px, expressed in slide units
  const draggedObj = scene?.byEl.get(el) || null;
  const snapV = [0, 960, 1920], snapH = [0, 540, 1080];
  for (const o of scene?.objects || []) {
    if (!o.geometry || o === draggedObj || o.type === "group") continue;
    snapV.push(o.geometry.x, o.geometry.x + o.geometry.width / 2, o.geometry.x + o.geometry.width);
    snapH.push(o.geometry.y, o.geometry.y + o.geometry.height / 2, o.geometry.y + o.geometry.height);
  }
  const snapAxis = (lines, start, size) => {
    let best = null;
    for (const line of lines)
      for (const anchor of [start, start + size / 2, start + size]) {
        const d = line - anchor;
        if (Math.abs(d) <= SNAP_T && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, line };
      }
    return best;
  };
  const drawGuides = (gx, gy) => {
    stageEl?.querySelectorAll(".ed-guide").forEach((g) => g.remove());
    if (!stageEl) return;
    for (const [val, cls, prop] of [[gx, "ed-guide ed-guide--v", "left"], [gy, "ed-guide ed-guide--h", "top"]]) {
      if (val === null) continue;
      const g = document.createElement("div");
      g.className = cls;
      g.style[prop] = `${val}px`;
      stageEl.appendChild(g);
    }
  };

  const onMove = (e) => {
    const dxClient = e.clientX - startX;
    const dyClient = e.clientY - startY;
    if (!dragging && Math.hypot(dxClient, dyClient) < DRAG_THRESHOLD) return;
    if (!dragging) {
      dragging = true;
      document.body.classList.add("is-dragging-element");
      el.classList.add("is-moving");
      closeStylePanel();
      hideFloatingToolbar();
    }
    e.preventDefault();
    let dx = Math.max(dxMin, Math.min(dxMax, originX + dxClient / scale));
    let dy = Math.max(dyMin, Math.min(dyMax, originY + dyClient / scale));
    let guideX = null, guideY = null;
    if (!e.altKey) {
      const sx = snapAxis(snapV, baseLeft + dx, elW);
      const sy = snapAxis(snapH, baseTop + dy, elH);
      if (sx) { dx = Math.max(dxMin, Math.min(dxMax, dx + sx.d)); guideX = sx.line; }
      if (sy) { dy = Math.max(dyMin, Math.min(dyMax, dy + sy.d)); guideY = sy.line; }
    }
    drawGuides(guideX, guideY);
    setStyleForSelection({
      dx: Math.round(dx * 10) / 10,
      dy: Math.round(dy * 10) / 10,
    });
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    if (!dragging) return;
    drawGuides(null, null);
    document.body.classList.remove("is-dragging-element");
    el.classList.remove("is-moving");
    if (selection?.el === el) showFloatingToolbar(el);
    commitStyleNow();
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

/* ============================================================================
   COMMAND PALETTE — ⌘K/Ctrl+K. Understands navigation and slide/object
   actions; anything that doesn't match falls through to "Ask AI: …".
   ========================================================================= */
function buildCommands() {
  const cmds = [
    { id: "undo", label: "Undo", enabled: undoStack.length > 0, run: undo },
    { id: "redo", label: "Redo", enabled: redoStack.length > 0, run: redo },
    { id: "add-slide", label: "New slide", run: () => { addPosition = "after"; openPicker("add"); } },
    { id: "ai-slide", label: "Generate slide with AI", run: () => openAiSlideModal() },
    { id: "duplicate-slide", label: `Duplicate slide ${currentIndex + 1}`, run: () => duplicateSlide(currentIndex) },
    { id: "delete-slide", label: `Delete slide ${currentIndex + 1}`, enabled: slides.length > 1, run: () => askDeleteSlide(currentIndex) },
    { id: "swap-template", label: "Swap template", run: () => openPicker("swap") },
    { id: "review-deck", label: "Review presentation", run: () => ai.runDeckReview() },
    { id: "present", label: "Present", run: () => { location.href = `present.html?id=${encodeURIComponent(presentationId)}`; } },
    { id: "export", label: "Export — open workspace", run: () => { location.href = `index.html?id=${encodeURIComponent(presentationId)}`; } },
    { id: "next-slide", label: "Next slide", enabled: currentIndex < slides.length - 1, run: () => selectSlide(currentIndex + 1) },
    { id: "prev-slide", label: "Previous slide", enabled: currentIndex > 0, run: () => selectSlide(currentIndex - 1) },
    { id: "done", label: "Done — back to presentation", run: () => { doneBtn.click(); } },
  ];
  for (const l of ZOOM_LEVELS) cmds.push({ id: `zoom-${l.value}`, label: `Zoom to ${l.label}`, run: () => setZoom(l.value) });
  slides.forEach((s, i) => cmds.push({ id: `goto-${i}`, label: `Go to slide ${i + 1}`, run: () => selectSlide(i) }));
  return cmds.filter((c) => c.enabled !== false);
}

function wireCommandPalette() {
  cmdkOverlay.addEventListener("mousedown", (e) => { if (e.target === cmdkOverlay) closeCmdk(); });
  cmdkInput.addEventListener("input", renderCmdkResults);
  cmdkOverlay.addEventListener("keydown", handleCmdkKeydown);
}
function openCmdk() {
  cmdkInput.value = "";
  cmdkOverlay.hidden = false;
  renderCmdkResults();
  cmdkInput.focus();
}
function closeCmdk() { cmdkOverlay.hidden = true; }
let cmdkCursor = 0;
function renderCmdkResults() {
  const q = cmdkInput.value.trim().toLowerCase();
  const commands = buildCommands();
  const matches = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands.slice(0, 8);
  cmdkCursor = 0;

  const items = matches.map((c, i) => `
    <button type="button" class="search-hit ed-cmdk__hit${i === 0 ? " is-cursor" : ""}" role="option" data-cmd="${escapeHtml(c.id)}">
      <span class="search-hit__title">${escapeHtml(c.label)}</span>
    </button>`);

  if (q) {
    items.push(`
      <button type="button" class="search-hit ed-cmdk__hit ed-cmdk__hit--ai" role="option" data-ask-ai="1">
        <span class="search-hit__title">Ask AI: “${escapeHtml(q)}”</span>
      </button>`);
  }
  cmdkResults.innerHTML = items.join("") || `<p class="search-panel__empty">No matching commands.</p>`;

  cmdkResults.querySelectorAll("[data-cmd]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cmd = commands.find((c) => c.id === btn.dataset.cmd);
      closeCmdk();
      cmd?.run();
    });
  });
  cmdkResults.querySelectorAll("[data-ask-ai]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = cmdkInput.value.trim();
      closeCmdk();
      if (text) ai.sendAi(text, "rewrite");
    });
  });
}
function handleCmdkKeydown(e) {
  const hits = [...cmdkResults.querySelectorAll(".ed-cmdk__hit")];
  if (e.key === "Escape") { e.preventDefault(); closeCmdk(); return; }
  if (e.key === "ArrowDown") { e.preventDefault(); moveCmdkCursor(hits, 1); return; }
  if (e.key === "ArrowUp") { e.preventDefault(); moveCmdkCursor(hits, -1); return; }
  if (e.key === "Enter") { e.preventDefault(); hits[cmdkCursor]?.click(); }
}
function moveCmdkCursor(hits, delta) {
  if (!hits.length) return;
  hits[cmdkCursor]?.classList.remove("is-cursor");
  cmdkCursor = (cmdkCursor + delta + hits.length) % hits.length;
  hits[cmdkCursor].classList.add("is-cursor");
  hits[cmdkCursor].scrollIntoView({ block: "nearest" });
}

/* ---- Keyboard shortcuts ---------------------------------------------------- */
function wireShortcuts() {
  window.addEventListener("keydown", (e) => {
    const mod = e.metaKey || e.ctrlKey;
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName) || e.target?.isContentEditable;
    const dialogOpen = !swapDialog.hidden || !conflictModal.hidden || !deleteModal.hidden || !cmdkOverlay.hidden;

    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); cmdkOverlay.hidden ? openCmdk() : closeCmdk(); return; }
    if (!cmdkOverlay.hidden) return; // the palette owns every other key while open

    if (mod && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === "y" && !typing) { e.preventDefault(); redo(); return; }
    if (mod && (e.key === "=" || e.key === "+")) { e.preventDefault(); stepZoom(1); return; }
    if (mod && e.key === "-") { e.preventDefault(); stepZoom(-1); return; }
    if (mod && e.key === "0") { e.preventDefault(); setZoom("fit"); return; }
    if (mod && e.key.toLowerCase() === "d" && !typing) {
      e.preventDefault();
      if (selection && (selection.kind === "list-item" || selection.kind === "row-field")) duplicateSelectedItem();
      else duplicateSlide(currentIndex);
      return;
    }

    if (typing || dialogOpen || mod) return;
    // A focused button/link/menu item owns Space and Enter (activation) and
    // must not have them hijacked for pan/navigation.
    const onControl = e.target?.closest?.("button, a, [role='menuitem'], [role='option'], select, label");
    if (onControl && (e.key === " " || e.key === "Enter" || e.key === "Backspace" || e.key === "Delete")) return;

    if (e.key === "Escape") {
      if (!stylePanel.hidden) { closeStylePanel(); return; }
      if (selection) clearSelection();
      return;
    }
    // Arrow = move the selected element (Shift for a bigger step); with
    // nothing selected, arrows navigate between slides as before.
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (selection) {
        const step = e.shiftKey ? NUDGE_FAST : NUDGE;
        if (e.key === "ArrowLeft") nudgeSelection(-step, 0);
        else if (e.key === "ArrowRight") nudgeSelection(step, 0);
        else if (e.key === "ArrowUp") nudgeSelection(0, -step);
        else nudgeSelection(0, step);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") selectSlide(currentIndex + 1);
      else selectSlide(currentIndex - 1);
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      // Only a deliberate selection deletes; a bare Backspace on the page
      // (browser-back muscle memory) must never open the delete-slide modal.
      if (selection && (selection.kind === "list-item" || selection.kind === "row-field")) deleteSelectedItem();
      else if (!selection && rail.contains(document.activeElement)) askDeleteSlide(currentIndex);
      return;
    }
    if (e.key === " " && !spacePanning) { e.preventDefault(); spacePanning = true; stage.classList.add("is-pan-ready"); return; }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === " ") {
      spacePanning = false;
      panActive = false;
      stage.classList.remove("is-pan-ready", "is-panning");
    }
  });
  wireStagePan();
}

/** Space = Pan: hold Space, drag on the stage to scroll it — the canvas has
 *  no viewport transform to pan besides native scroll, so this is a plain
 *  scrollLeft/scrollTop drag rather than a fake camera. */
function wireStagePan() {
  let startX = 0, startY = 0, startScrollLeft = 0, startScrollTop = 0;
  stage.addEventListener("mousedown", (e) => {
    if (!spacePanning) return;
    panActive = true;
    stage.classList.add("is-panning");
    startX = e.clientX; startY = e.clientY;
    startScrollLeft = stage.scrollLeft; startScrollTop = stage.scrollTop;
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!panActive) return;
    stage.scrollLeft = startScrollLeft - (e.clientX - startX);
    stage.scrollTop = startScrollTop - (e.clientY - startY);
  });
  window.addEventListener("mouseup", () => {
    panActive = false;
    stage.classList.remove("is-panning");
  });
}

/* ---- Helpers ---------------------------------------------------------------- */
function errText(err, fallback) { return err instanceof ApiError ? err.message : err?.message || fallback; }
