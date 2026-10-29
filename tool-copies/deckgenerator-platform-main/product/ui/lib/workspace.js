// =============================================================================
// Presentation Workspace — the active document surface.
//
// Replaces detail.html. The mental model is no longer Home → Detail → Editor
// but a single workspace where a presentation is either open or not: the rail
// never disappears, opening a presentation never loads a page, and switching
// between presentations swaps the canvas rather than navigating.
//
// URL IS THE STATE. `index.html` is Create; `index.html?id=<uuid>` is the
// workspace open on that presentation. Open/close/switch go through
// history.pushState, so deep links, browser back/forward, middle-click and
// bookmarking all behave — without a document load. detail.html now forwards
// here, which keeps every existing entry point (Library cards, editor Done,
// presenter Exit, export-jobs, duplicate) working untouched.
//
// WHAT IS REUSED, NOT REBUILT:
//   · The rendering engine. The canvas is still an <iframe> at the Engine
//     Gateway (render.html?id=&slide=). render.html, js/render-gateway.js,
//     deck.html and js/engine.js are consumed exactly as they are — the same
//     rule M7 worked under (Phase 1 §01: "via a link or an embedded frame —
//     never by reimplementing it").
//   · Every API call. No endpoint, payload or model changed.
//   · The Export state machine, delete-confirm flow, archive and duplicate:
//     MOVED here from detail.js verbatim in behaviour, not duplicated.
//
// WHAT CHANGED IS PRESENTATION ONLY:
//   · The web-page header became a desktop toolbar; the slide canvas became
//     the hero, with Canva/Figma-style controls that surface on hover.
//   · The standalone Export section is gone. Export belongs to the document,
//     so each format is a single toolbar button that carries its own state
//     (idle → running → succeeded → failed) instead of a panel of cards.
//   · Duplicate/Archive/Delete collapsed into an overflow menu.
//
// FUTURE-READY: the layout is a grid with a dock column (.ws__dock) that is
// zero-width today. Comments, AI chat, speaker notes or version history can
// mount there without touching this structure.
// =============================================================================
import { api, ApiError } from "./api.js";
import { escapeHtml, trapFocus, formatDate, formatSize, toast } from "./dom.js";
import { markActive } from "./app-shell.js";

const EXPORT_POLL_INTERVAL_MS = 1500;
const EXPORTS_MODAL_LIMIT = 50;
const EXPORT_FORMATS = ["pdf", "pptx"];

const I = {
  play: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.52.85l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>`,
  pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  more: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5.5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="18.5" r="2.6"/><path d="m8.4 10.7 7.2-3.9M8.4 13.3l7.2 3.9"/></svg>`,
  popout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="m20 4-8.5 8.5"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.4 5a3.3 3.3 0 0 1 4.7 4.7l-1.5 1.4"/><path d="M13 17.5 11.6 19a3.3 3.3 0 0 1-4.7-4.7l1.5-1.4"/></svg>`,
};

let root = null;      // the workspace element (built once)
let el = {};          // cached child refs
let record = null;    // the open Presentation
let openId = null;    // id currently open (or null)
let slideIndex = 0;
let onCloseCb = null;
let loadToken = 0;    // guards against a slow fetch resolving after a switch

/* ---- Public API ----------------------------------------------------------- */

/** Builds the workspace shell once. `onClose` runs when it is dismissed. */
export function mountWorkspace(container, { onClose } = {}) {
  onCloseCb = onClose;
  root = document.createElement("section");
  root.className = "ws";
  root.hidden = true;
  root.setAttribute("aria-label", "Presentation workspace");
  root.innerHTML = template();
  container.append(root);
  cacheRefs();
  wire();
  return root;
}

export function isWorkspaceOpen() {
  return openId !== null;
}

/**
 * Paints the workspace surface — chrome plus its loading skeleton — WITHOUT
 * fetching anything or claiming an id.
 *
 * Arriving on `index.html?id=…` (from Templates, the Library, or a pasted
 * link) used to render the Create composer first, because the real open()
 * can only run after the session check and the rail's own request have both
 * resolved. For that whole window the wrong screen was on display, and the
 * eventual swap made it look like the app had routed Create → Detail. This
 * lets the deep-link path show the destination immediately and fill it in
 * when the data lands; the actual load still happens later, after auth.
 */
export function prepareWorkspace() {
  if (!root || openId !== null) return;
  root.hidden = false;
  showSkeleton();
  el.tools.hidden = true;
  void root.offsetHeight;      // flush, so is-open animates from a real start value
  root.classList.add("is-open");
}

/**
 * Opens (or switches to) a presentation. Never navigates.
 * @param {string} id
 * @param {{push?: boolean}} opts push a history entry (default true)
 */
export async function openWorkspace(id, { push = true } = {}) {
  if (!root) return;
  const switching = openId !== null && openId !== id;
  openId = id;

  if (push) {
    const url = `index.html?id=${encodeURIComponent(id)}`;
    if (location.search !== `?id=${encodeURIComponent(id)}`) history.pushState({ id }, "", url);
  }

  document.body.classList.add("has-workspace");
  // The Create composer stays in the DOM (opacity 0, pointer-events none)
  // but must also leave the tab order while the workspace covers it.
  document.querySelector(".create")?.setAttribute("inert", "");
  root.hidden = false;
  // The rail-click handlers that call openWorkspace also call markActive
  // themselves, but this is the single path EVERY way of opening a document
  // goes through — including popstate (forward nav) — so it's the correct
  // place to guarantee the highlight actually matches what's open.
  markActive(id);
  // Switching gets a crossfade rather than the enter animation — the surface
  // is already there, only its contents change.
  root.classList.toggle("is-switching", switching);
  if (!switching) {
    void root.offsetHeight;          // flush so the enter animation has a start value
    root.classList.add("is-open");
  }

  await load(id);
}

/** Returns to Create. */
export function closeWorkspace({ push = true } = {}) {
  if (!root || openId === null) return;
  openId = null;
  record = null;
  stopAllPolling();

  root.classList.remove("is-open");
  document.body.classList.remove("has-workspace");
  document.querySelector(".create")?.removeAttribute("inert");
  if (push) history.pushState({}, "", "index.html");
  // Nothing is open now — the rail's recents list must not still show the
  // presentation that was just closed as selected. markActive(null) clears
  // every row (dataset.id is a string, so nothing ever equals null).
  markActive(null);

  // Let the exit transition play out before the frame is torn down (must
  // outlast the longest .ws transition in app.css — 340ms), but never leave
  // a stale deck rendering if the transition never fires.
  window.setTimeout(() => {
    if (openId === null) {
      root.hidden = true;
      setFrameUrl("about:blank");   // stop rendering, still without a history entry
    }
  }, 380);

  onCloseCb?.();
}

/* ---- Structure ------------------------------------------------------------ */
function template() {
  return `
  <div class="ws__grid">
    <div class="ws__doc">
      <!-- Desktop toolbar. Title is the visual focus; identity on the left,
           actions on the right, nothing full-width. -->
      <header class="ws__bar">
        <div class="ws__id">
          <!-- data-rename-target: inline rename mounts here in a later
               sprint. Deliberately not editable yet. -->
          <h1 class="ws__title" id="ws-title" data-rename-target></h1>
          <!-- Status intentionally omitted here — it wasn't earning its space
               next to slide count and date, and the same call already
               dropped it from the Recents rows for consistency. record.status
               still drives Edit/Present eligibility and the overflow menu's
               Archive/Unarchive label; only this visible readout is gone. -->
          <div class="ws__meta">
            <span id="ws-slides"></span>
            <span class="ws__meta-dot" aria-hidden="true">·</span>
            <span id="ws-updated"></span>
          </div>
          <!-- Shown only when some slides kept the default layout, so a flat
               deck says why it is flat. -->
          <p class="ws__notice" id="ws-notice" role="status" hidden></p>
        </div>

        <!-- View mode's job is consume / present / export — nothing that
             modifies content. "Improve with AI" moved into the Editor's own
             toolbar, where AI assistance is already the expected place to
             reach for it (Milestone M15's AI Assist), rather than living
             here as a disabled button with no home. -->
        <div class="ws__actions">
          <button type="button" class="wbtn wbtn--primary" id="ws-present">
            ${I.play}<span>Present</span>
          </button>
          <button type="button" class="wbtn" id="ws-edit">
            ${I.pencil}<span>Edit</span>
          </button>
          <button type="button" class="wbtn wbtn--icon" id="ws-more"
                  aria-haspopup="menu" aria-expanded="false" aria-label="More actions">
            ${I.more}
          </button>
          <button type="button" class="wbtn wbtn--icon" id="ws-close" aria-label="Close workspace">
            ${I.close}
          </button>
        </div>
      </header>

      <!-- Stage: the canvas is the hero. Everything else is quiet around it. -->
      <div class="ws__stage" id="ws-stage">
        <div class="ws__notfound" id="ws-notfound" hidden>
          <p class="ws__notfound-text" id="ws-notfound-text">Presentation not found.</p>
        </div>

        <div class="ws__canvas-wrap" id="ws-canvas-wrap">
          <div class="ws__canvas" id="ws-canvas">
            <div class="viewer-frame__skeleton" id="ws-skeleton" aria-hidden="true"></div>
            <p class="ws__empty" id="ws-empty" hidden>No slides yet</p>
            <iframe id="ws-frame" title="Presentation preview" hidden></iframe>

            <!-- Canva/Figma-style: controls belong to the artboard and surface
                 on hover, so the resting state is just the document. -->
            <div class="ws__hover" id="ws-hover" aria-hidden="true">
              <button type="button" class="hbtn" data-act="present" title="Present">${I.play}</button>
              <button type="button" class="hbtn" data-act="edit" title="Edit">${I.pencil}</button>
              <button type="button" class="hbtn" data-act="open" title="Open in Viewer">${I.popout}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview toolbar — attached to the document, not a separate section.
           Slide nav left, export right. -->
      <footer class="ws__tools" id="ws-tools">
        <div class="ws__nav">
          <button type="button" class="tbtn tbtn--icon" id="ws-prev" aria-label="Previous slide">${I.prev}</button>
          <span class="ws__counter" id="ws-counter" aria-live="polite"></span>
          <button type="button" class="tbtn tbtn--icon" id="ws-next" aria-label="Next slide">${I.next}</button>
        </div>

        <div class="ws__tools-right">
          <button type="button" class="tbtn" id="ws-export-pdf" data-format="pdf">
            ${I.download}<span class="tbtn__label">PDF</span>
          </button>
          <button type="button" class="tbtn" id="ws-export-pptx" data-format="pptx">
            ${I.download}<span class="tbtn__label">PPTX</span>
          </button>

          <!-- Placeholder for a future sprint; disabled rather than hidden so
               the toolbar's shape is already final. -->
          <button type="button" class="tbtn tbtn--icon" id="ws-share" disabled
                  title="Sharing is coming soon" aria-label="Share (coming soon)">${I.share}</button>
        </div>
      </footer>
    </div>

    <!-- Reserved for future side panels (comments, AI chat, speaker notes,
         assets, version history). Zero-width until one is mounted. -->
    <aside class="ws__dock" id="ws-dock" hidden></aside>
  </div>`;
}

function cacheRefs() {
  const $ = (id) => root.querySelector(`#${id}`);
  el = {
    title: $("ws-title"), slides: $("ws-slides"), updated: $("ws-updated"),
    present: $("ws-present"), edit: $("ws-edit"),
    more: $("ws-more"), close: $("ws-close"),
    stage: $("ws-stage"), notFound: $("ws-notfound"), notFoundText: $("ws-notfound-text"),
    canvasWrap: $("ws-canvas-wrap"), canvas: $("ws-canvas"),
    skeleton: $("ws-skeleton"), empty: $("ws-empty"), frame: $("ws-frame"), hover: $("ws-hover"),
    tools: $("ws-tools"), prev: $("ws-prev"), next: $("ws-next"), counter: $("ws-counter"),
    exportPdf: $("ws-export-pdf"), exportPptx: $("ws-export-pptx"),
  };
}

/* Says so when composition left slides on the default layout. */
function renderNotice() {
  const fb = record?.layoutFallback;
  const notice = root?.querySelector("#ws-notice");
  if (!notice) return;
  if (!fb || !(fb.count > 0)) {
    notice.hidden = true;
    notice.textContent = "";
    return;
  }
  const slides = fb.count === 1 ? "1 slide uses" : `${fb.count} of ${fb.total} slides use`;
  notice.textContent = `${slides} a default layout, because the layouts for ${fb.count === 1 ? "it" : "them"} could not be chosen. Pick a layout for ${fb.count === 1 ? "that slide" : "those slides"} in the editor.`;
  notice.hidden = false;
}

/* ---- Loading -------------------------------------------------------------- */
async function load(id) {
  const token = ++loadToken;
  showSkeleton();

  let next;
  try {
    next = await api.getPresentation(id);
  } catch (err) {
    if (token !== loadToken) return; // a newer open() superseded this one
    showNotFound(
      err instanceof ApiError && err.status === 404
        ? "This presentation no longer exists."
        : err.message || "Could not load this presentation."
    );
    return;
  }
  if (token !== loadToken) return;

  record = next;
  el.notFound.hidden = true;
  el.canvasWrap.hidden = false;
  el.tools.hidden = false;
  slideIndex = 0;
  document.title = `${record.title} — Nagarro Presentations`;

  renderMeta();
  renderNotice();
  renderCanvas();
  root.classList.remove("is-switching");
  await initExports();
}

function showSkeleton() {
  el.notFound.hidden = true;
  el.canvasWrap.hidden = false;
  el.skeleton.hidden = false;
  el.frame.hidden = true;
  el.empty.hidden = true;
}

function showNotFound(message) {
  el.notFoundText.textContent = message;
  el.notFound.hidden = false;
  el.canvasWrap.hidden = true;
  el.tools.hidden = true;
  el.title.textContent = "Not found";
  el.slides.textContent = "";
  el.updated.textContent = "";
  for (const b of [el.present, el.edit, el.more]) b.disabled = true;
}

/* ---- Header --------------------------------------------------------------- */
function renderMeta() {
  const count = record.slides.length;

  el.title.textContent = record.title;
  el.title.title = record.title;
  el.slides.textContent = count === 1 ? "1 slide" : `${count} slides`;
  el.updated.textContent = `Updated ${formatDate(record.updatedAt)}`;

  // Same visibility rule Detail used: presenting or editing an empty deck
  // makes no sense. Disabled rather than hidden — a toolbar that changes
  // shape per presentation is harder to build muscle memory against.
  const canEdit = count > 0 && (record.status === "Ready" || record.status === "Generated");
  el.present.disabled = count === 0;
  el.edit.disabled = !canEdit;
  el.more.disabled = false;
}

/* ---- Canvas (Engine Gateway iframe — untouched) --------------------------- */
function renderCanvas() {
  const count = record.slides.length;

  if (count === 0) {
    el.skeleton.hidden = true;
    el.frame.hidden = true;
    el.empty.hidden = false;
    el.hover.hidden = true;
    el.prev.disabled = el.next.disabled = true;
    el.counter.textContent = "No slides";
    return;
  }

  el.empty.hidden = true;
  el.hover.hidden = false;
  el.prev.disabled = slideIndex === 0;
  el.next.disabled = slideIndex === count - 1;
  el.counter.textContent =
    `${String(slideIndex + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;

  el.skeleton.hidden = false;
  el.frame.hidden = true;
  setFrameUrl(`/render.html?id=${encodeURIComponent(openId)}&slide=${slideIndex}`);
}

/**
 * Points the preview frame at a URL WITHOUT growing browser history.
 *
 * Assigning `iframe.src` is a frame navigation, and every one of those pushes
 * a session-history entry into the parent — so paging through a 20-slide deck
 * left 20 entries, and Back stepped backwards through slides instead of
 * leaving the workspace. The Gateway is same-origin, so replace() navigates
 * the frame in place and adds nothing. `src` remains the fallback for the
 * case where the frame's document isn't reachable.
 */
function setFrameUrl(url) {
  try {
    const win = el.frame.contentWindow;
    if (win) { win.location.replace(url); return; }
  } catch { /* not reachable — fall through to a plain src assignment */ }
  el.frame.src = url;
}

function step(delta) {
  if (!record || record.slides.length === 0) return;
  const next = Math.min(record.slides.length - 1, Math.max(0, slideIndex + delta));
  if (next === slideIndex) return;
  slideIndex = next;
  renderCanvas();
}

/* ---- Wiring --------------------------------------------------------------- */
function wire() {
  el.close.addEventListener("click", () => closeWorkspace());
  el.prev.addEventListener("click", () => step(-1));
  el.next.addEventListener("click", () => step(1));

  el.frame.addEventListener("load", () => {
    // Same signal Detail used: the iframe DOCUMENT has loaded. The Gateway's
    // own async deck fetch may still be a moment behind — an accepted,
    // documented limitation rather than a change to a file we must not touch.
    el.skeleton.hidden = true;
    el.frame.hidden = false;
  });

  el.present.addEventListener("click", () => go(`present.html?id=${encodeURIComponent(openId)}`));
  el.edit.addEventListener("click", () => go(`editor.html?id=${encodeURIComponent(openId)}`));

  el.hover.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "present") go(`present.html?id=${encodeURIComponent(openId)}`);
    if (act === "edit" && !el.edit.disabled) go(`editor.html?id=${encodeURIComponent(openId)}`);
    if (act === "open") window.open(`/render.html?id=${encodeURIComponent(openId)}`, "_blank", "noopener");
  });

  wireOverflow();
  wireExportButtons();

  // Keyboard: arrows move slides, Esc closes — but never while typing, and
  // never while a dialog or menu owns the interaction. The exports modal has
  // its own Escape handler (closes just the modal); without this check here
  // too, THIS handler's Escape branch fires on the same keypress and closes
  // the whole workspace out from under it.
  document.addEventListener("keydown", (e) => {
    if (openId === null) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (!document.getElementById("ws-delete-modal")?.hidden) return;
    if (exportsModalEl && !exportsModalEl.overlay.hidden) return;
    // Any other overlay that owns Escape: the app-shell search panel, an
    // open anchored menu — dismissing those must not also close the workspace.
    if (document.querySelector(".search-overlay:not([hidden]), #ws-more-menu:not([hidden]), .rail-menu:not([hidden]), .card-menu:not([hidden])")) return;

    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "Escape") closeWorkspace();
  });
}

function go(href) { location.href = href; }

/* ---- Overflow menu -------------------------------------------------------- */
function wireOverflow() {
  const menu = document.createElement("div");
  menu.className = "card-menu card-menu--fixed";
  menu.id = "ws-more-menu";
  menu.setAttribute("role", "menu");
  menu.hidden = true;
  document.body.append(menu);

  const close = () => { menu.hidden = true; el.more.setAttribute("aria-expanded", "false"); };

  const open = () => {
    const archived = record?.status === "Archived";
    const regen = EXPORT_FORMATS
      .filter((f) => exports[f]?.state === "succeeded")
      .map((f) => `<button type="button" role="menuitem" data-act="regen-${f}">Regenerate ${f.toUpperCase()}</button>`)
      .join("");

    menu.innerHTML = `
      <button type="button" role="menuitem" data-act="duplicate">Duplicate</button>
      <button type="button" role="menuitem" data-act="archive">${archived ? "Unarchive" : "Archive"}</button>
      ${regen}
      <button type="button" role="menuitem" data-act="exports">View all exports</button>
      <button type="button" role="menuitem" class="danger" data-act="delete">Delete</button>`;

    menu.hidden = false;
    el.more.setAttribute("aria-expanded", "true");
    const r = el.more.getBoundingClientRect();
    menu.style.top = `${r.bottom + 8}px`;
    menu.style.left = `${Math.max(12, r.right - menu.offsetWidth)}px`;
    menu.querySelector("button")?.focus();
  };

  el.more.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden ? open() : close();
  });

  menu.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    close();
    if (act === "duplicate") handleDuplicate();
    else if (act === "archive") handleArchiveToggle();
    else if (act === "delete") openDeleteModal();
    else if (act === "exports") openExportsModal();
    else if (act.startsWith("regen-")) startExport(act.slice(6));
  });

  document.addEventListener("click", (e) => {
    if (!menu.hidden && !menu.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) { close(); el.more.focus(); }
  });
}

/* ---- "View all exports" modal ---------------------------------------------
 * Replaces a full navigation to export-jobs.html with a centred modal, in
 * the same register as the rail's own search modal: backdrop, ESC, click-
 * outside and an explicit ✕ all close it, and the presentation stays
 * mounted and visible behind it the whole time — closing the modal is not
 * "coming back," there was never anywhere else.
 *
 * Reuses api.listExports() exactly as export-jobs.js already does, scoped
 * to `presentationId: openId` so it needs no filter controls of its own —
 * every row shown already belongs to the open document. No new endpoint:
 * Delete was in the spec as explicitly optional, and the backend has no
 * export-delete route, so it's left out rather than wired to nothing.
 * "Copy link" is the one addition, and it's client-only — clipboard.
 */
let exportsModalEl = null;
let exportsPollTimer = null;

function ensureExportsModal() {
  if (exportsModalEl) return exportsModalEl;

  const overlay = document.createElement("div");
  overlay.className = "search-overlay exports-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="search-panel exports-panel" role="dialog" aria-modal="true" aria-labelledby="exports-modal-title">
      <div class="exports-panel__head">
        <h2 class="exports-panel__title" id="exports-modal-title">Exports</h2>
        <button type="button" class="wbtn wbtn--icon" id="exports-modal-close" aria-label="Close">${I.close}</button>
      </div>
      <div class="exports-panel__body" id="exports-modal-body"></div>
    </div>`;
  document.body.append(overlay);

  const close = () => {
    if (overlay.hidden) return;
    overlay.hidden = true;
    clearTimeout(exportsPollTimer);
    el.more.focus();
  };

  overlay.querySelector("#exports-modal-close").addEventListener("click", close);
  overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });

  exportsModalEl = { overlay, body: overlay.querySelector("#exports-modal-body"), close };
  return exportsModalEl;
}

async function openExportsModal() {
  const modal = ensureExportsModal();
  modal.overlay.hidden = false;
  modal.body.innerHTML = `<p class="exports-panel__empty">Loading…</p>`;
  await refreshExportsModal();
}

async function refreshExportsModal() {
  const modal = ensureExportsModal();
  if (modal.overlay.hidden) return;

  let items;
  try {
    items = await api.listExports({ presentationId: openId, limit: EXPORTS_MODAL_LIMIT });
  } catch (err) {
    modal.body.innerHTML = `<p class="exports-panel__empty">${escapeHtml(
      err instanceof ApiError ? err.message : "Could not load exports."
    )}</p>`;
    return;
  }
  renderExportsModal(items.items ?? items);
}

function renderExportsModal(jobs) {
  const modal = ensureExportsModal();

  if (jobs.length === 0) {
    modal.body.innerHTML = `<p class="exports-panel__empty">No exports yet for this presentation.</p>`;
    clearTimeout(exportsPollTimer);
    return;
  }

  modal.body.innerHTML = jobs.map(exportRowHtml).join("");

  for (const row of modal.body.querySelectorAll("[data-copy-url]")) {
    row.addEventListener("click", () => copyExportLink(row.dataset.copyUrl, row));
  }
  for (const row of modal.body.querySelectorAll("[data-retry-format]")) {
    row.addEventListener("click", () => retryExportFromModal(row.dataset.retryFormat, row));
  }

  clearTimeout(exportsPollTimer);
  if (jobs.some((j) => j.status === "Queued" || j.status === "Running")) {
    exportsPollTimer = setTimeout(refreshExportsModal, EXPORT_POLL_INTERVAL_MS);
  }
}

function exportRowHtml(job) {
  const exported = job.export;
  const dlUrl = exported ? api.getExportDownloadUrl(exported.id) : null;

  const meta = [formatFullDate(job.updatedAt)];
  if (exported?.size != null) meta.push(formatSize(exported.size));
  if (exported?.stale) meta.push("Presentation changed since this export");

  const actions = [];
  if (dlUrl) {
    actions.push(
      `<a class="export-row__action" href="${dlUrl}" target="_blank" rel="noopener" title="Download">${I.download}</a>`
    );
    actions.push(
      `<button type="button" class="export-row__action" data-copy-url="${escapeHtml(dlUrl)}" title="Copy link">${I.link}</button>`
    );
  }
  if (job.status === "Failed") {
    actions.push(
      `<button type="button" class="export-row__action export-row__action--text" data-retry-format="${job.format}">Retry</button>`
    );
  }

  return `
    <div class="export-row">
      <span class="export-row__format" data-format="${escapeHtml(job.format)}">${job.format.toUpperCase()}</span>
      <div class="export-row__info">
        <span class="status" data-status="${escapeHtml(job.status)}">${escapeHtml(job.status)}</span>
        <span class="export-row__meta">${meta.map(escapeHtml).join(" · ")}</span>
        ${job.status === "Failed" && job.error ? `<span class="export-row__error">${escapeHtml(job.error)}</span>` : ""}
      </div>
      <div class="export-row__actions">${actions.join("")}</div>
    </div>`;
}

async function copyExportLink(url, trigger) {
  try {
    await navigator.clipboard.writeText(url);
    toast("Download link copied.", "success");
  } catch {
    toast("Could not copy the link.", "error");
  }
}

async function retryExportFromModal(format, trigger) {
  trigger.disabled = true;
  try {
    await api.requestExport(openId, format);
    toast(`${format.toUpperCase()} export restarted.`, "success");
    await refreshExportsModal();
  } catch (err) {
    trigger.disabled = false;
    toast(err instanceof ApiError ? err.message : "Could not restart the export.", "error");
  }
}

function formatFullDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}


/* ---- Duplicate / archive / delete (behaviour unchanged from Detail) ------- */
async function handleDuplicate() {
  try {
    const copy = await api.duplicatePresentation(openId);
    toast("Presentation duplicated.", "success");
    // The workspace model improves on Detail's full navigation here: the copy
    // simply becomes the open document.
    await openWorkspace(copy.id);
    document.dispatchEvent(new CustomEvent("workspace:changed"));
  } catch (err) {
    toast(err instanceof ApiError ? err.message : "Could not duplicate the presentation.", "error");
  }
}

async function handleArchiveToggle() {
  const archiving = record.status !== "Archived";
  try {
    record = await api.archivePresentation(openId, archiving);
    renderMeta();
    toast(archiving ? "Presentation archived." : "Presentation restored.", "success");
    document.dispatchEvent(new CustomEvent("workspace:changed"));
  } catch (err) {
    toast(err instanceof ApiError ? err.message : "Could not update the presentation.", "error");
  }
}

function openDeleteModal() {
  const modal = document.getElementById("ws-delete-modal");
  const body = document.getElementById("ws-delete-body");
  const input = document.getElementById("ws-delete-input");
  const confirmBtn = document.getElementById("ws-delete-confirm");

  body.textContent = `This permanently deletes “${record.title}.” This can't be undone.`;
  input.value = "";
  confirmBtn.disabled = true;
  modal.hidden = false;
  input.focus();
}

/** Wired once by home.js after the modal markup exists. */
export function wireDeleteModal() {
  const modal = document.getElementById("ws-delete-modal");
  const input = document.getElementById("ws-delete-input");
  const confirmBtn = document.getElementById("ws-delete-confirm");
  const cancelBtn = document.getElementById("ws-delete-cancel");

  const close = () => { modal.hidden = true; el.more?.focus(); };

  input.addEventListener("input", () => { confirmBtn.disabled = input.value !== record?.title; });
  cancelBtn.addEventListener("click", close);
  confirmBtn.addEventListener("click", async () => {
    if (input.value !== record.title) return;
    confirmBtn.disabled = true;
    try {
      await api.deletePresentation(openId);
      modal.hidden = true;
      // Detail redirected to the Library because it had nowhere else to be.
      // The workspace simply closes back to Create — nothing was navigated
      // away from, so nothing needs restoring.
      closeWorkspace();
      toast("Presentation deleted.", "success");
      document.dispatchEvent(new CustomEvent("workspace:changed"));
    } catch (err) {
      confirmBtn.disabled = false;
      toast(err instanceof ApiError ? err.message : "Could not delete the presentation.", "error");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") trapFocus(e, modal);
  });
}


/* ---- Export ---------------------------------------------------------------
   The separate Export section is gone, but its state machine is intact: one
   button per format, carrying its own state instead of a card.

     idle       → "PDF"            click starts an export
     running    → "PDF · 40%"      click cancels
     succeeded  → "PDF ↓"          click downloads; Regenerate lives in ⋯
     failed     → "PDF · Retry"    click retries

   Job ids still persist to sessionStorage, so an in-flight export survives a
   refresh exactly as before. `stale` is still whatever the server decided —
   never recomputed here. ------------------------------------------------- */
const exports = { pdf: null, pptx: null };
const exportHistory = { pdf: null, pptx: null };

function exportBtn(format) {
  return format === "pdf" ? el.exportPdf : el.exportPptx;
}
function exportStorageKey(format) {
  return `export-job:${openId}:${format}`;
}

function wireExportButtons() {
  for (const format of EXPORT_FORMATS) {
    exportBtn(format).addEventListener("click", () => {
      const s = exports[format];
      if (!s || s.state === "idle") return startExport(format);
      if (s.state === "running") return cancelExport(format);
      if (s.state === "failed") return startExport(format);
      if (s.state === "succeeded" && s.exported) {
        window.open(api.getExportDownloadUrl(s.exported.id), "_blank", "noopener");
      }
    });
  }
}

function stopAllPolling() {
  for (const format of EXPORT_FORMATS) {
    if (exports[format]?.timer) clearTimeout(exports[format].timer);
    exports[format] = null;
    exportHistory[format] = null;
  }
}

async function initExports() {
  stopAllPolling();
  for (const format of EXPORT_FORMATS) {
    exports[format] = { state: "idle", exported: null, jobId: null, timer: null };
    setExportState(format, "idle");

    const saved = sessionStorage.getItem(exportStorageKey(format));
    if (saved) {
      exports[format].jobId = saved;
      setExportState(format, "running", { text: "…" });
      pollJob(format, saved);
    } else {
      await loadLatestExport(format);
    }
  }
}

async function loadLatestExport(format) {
  try {
    const exported = await api.getLatestExport(openId, format);
    if (exported) renderSucceeded(format, exported);
    else setExportState(format, "idle");
  } catch {
    setExportState(format, "idle"); // best-effort — never blocks the workspace
  }
}

function setExportState(format, state, { text, title } = {}) {
  const s = exports[format];
  if (!s) return;
  s.state = state;
  const btn = exportBtn(format);
  const label = btn.querySelector(".tbtn__label");
  const name = format.toUpperCase();

  btn.dataset.state = state;
  btn.classList.toggle("is-busy", state === "running");
  label.textContent =
    state === "running" ? `${name} · ${text ?? "…"}`
    : state === "failed" ? `${name} · Retry`
    : name;
  btn.title =
    title ??
    (state === "running" ? "Click to cancel"
     : state === "succeeded" ? `Download ${name}`
     : state === "failed" ? `Retry ${name} export`
     : `Generate ${name}`);
}

async function startExport(format) {
  const btn = exportBtn(format);
  btn.disabled = true;
  try {
    const job = await api.requestExport(openId, format);
    exports[format].jobId = job.id;
    sessionStorage.setItem(exportStorageKey(format), job.id);
    setExportState(format, "running", { text: "queued" });
    pollJob(format, job.id);
  } catch (err) {
    // 409 = an export is already active for this format (server-enforced).
    // The body carries no job id, so surface the message rather than
    // fabricating a job to watch.
    toast(err instanceof ApiError ? err.message : "Could not start the export.", "error");
  } finally {
    btn.disabled = false;
  }
}

function pollJob(format, jobId) {
  const s = exports[format];
  if (!s) return;
  clearTimeout(s.timer);

  const tick = async () => {
    if (exports[format] !== s) return; // the workspace switched away
    let job;
    try {
      job = await api.getExportJob(jobId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        sessionStorage.removeItem(exportStorageKey(format));
        s.jobId = null;
        setExportState(format, "idle");
        return;
      }
      s.timer = setTimeout(tick, EXPORT_POLL_INTERVAL_MS); // transient — keep polling
      return;
    }

    if (job.status === "Queued" || job.status === "Running") {
      const p = job.progress;
      const text = p?.slidesTotal
        ? `${Math.round((p.slidesComplete / p.slidesTotal) * 100)}%`
        : job.status === "Queued" ? "queued" : "rendering";
      setExportState(format, "running", { text });
      s.timer = setTimeout(tick, EXPORT_POLL_INTERVAL_MS);
      return;
    }

    // Terminal. A cancelled job always resolves to Failed — there is no
    // separate client-side "cancelled" state.
    sessionStorage.removeItem(exportStorageKey(format));
    s.jobId = null;

    if (job.status === "Succeeded") {
      const exported = await api.getLatestExport(openId, format).catch(() => null);
      renderSucceeded(format, exported);
      toast(`${format.toUpperCase()} export finished.`, "success");
    } else {
      setExportState(format, "failed");
      toast(job.error || `The ${format.toUpperCase()} export failed.`, "error");
    }
  };

  tick();
}

function renderSucceeded(format, exported) {
  const s = exports[format];
  if (!s) return;
  s.exported = exported;
  // `exported` is null only when the job succeeded but the immediately
  // following lookup failed. There is then no id to download, so the button
  // returns to idle rather than pointing at a broken URL.
  if (!exported) return setExportState(format, "idle");

  setExportState(format, "succeeded", {
    title: exported.stale
      ? `Download ${format.toUpperCase()} — presentation changed since this export`
      : `Download ${format.toUpperCase()} · v${exported.version}`,
  });
  exportBtn(format).classList.toggle("is-stale", Boolean(exported.stale));
  exportHistory[format] = exported.version;
}

async function cancelExport(format) {
  const s = exports[format];
  if (!s?.jobId) return;
  try {
    await api.cancelExport(s.jobId);
    setExportState(format, "running", { text: "cancelling" });
  } catch (err) {
    toast(err instanceof ApiError ? err.message : "Could not cancel the export.", "error");
  }
}

/* ---- Helpers -------------------------------------------------------------- */
