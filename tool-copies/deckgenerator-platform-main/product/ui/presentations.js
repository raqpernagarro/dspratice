// =============================================================================
// Presentation Library — Milestone M6, UI Layer (Phase 3 §04, Phase 4 M6).
//
// Every capability here — list/search/sort/duplicate/archive/delete — was
// already built and authorized in M3/M4. This file is the UI Layer only.
//
// Card rendering, the action menu, Rename, and Delete now live in the
// shared lib/presentation-card.js module (M15 Phase 4 Slice 2) — this file
// keeps only what is genuinely Library-specific: search, sort, the
// Ready/Archived filter, and pagination.
//
// Approved M6 decisions this file still implements literally:
//   C — status filter shows only Ready/Archived, the two states this system
//       can currently produce; a single toggle (Journey 12: archiving
//       removes an item from the default view).
//   G — "New presentation" links to Home; no second create form here.
//   H — "Load more" pagination via the existing limit/offset params.
// Decision B (M6, "no rename control; that's Presentation Detail's") is
// superseded at Slice 2 — Rename is now available from the shared card menu,
// approved explicitly for this phase.
// =============================================================================
import { api, ApiError } from "./lib/api.js";
import { importAndWait } from "./lib/deck-build.js";
import { requireSession } from "./lib/session.js";
import { mountAppShell } from "./lib/app-shell.js";
import { buildPresentationCard, rescalePresentationCardThumbs } from "./lib/presentation-card.js";
import { escapeHtml } from "./lib/dom.js";

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_IMPORT_BYTES = 200 * 1024 * 1024;

const searchInput = document.getElementById("search-input");
const filtersToggle = document.getElementById("filters-toggle");
const filtersPanel = document.getElementById("lib-filters");
const chipArchived = document.getElementById("chip-archived");
const sortSelect = document.getElementById("sort-select");
const listBanner = document.getElementById("list-banner");
const countEl = document.getElementById("lib-count");
const grid = document.getElementById("lib-grid");
const moreWrap = document.getElementById("lib-more");
const loadMoreBtn = document.getElementById("load-more");
const uploadPptxBtn = document.getElementById("upload-pptx-btn");
const uploadPptxInput = document.getElementById("upload-pptx-input");

const state = {
  search: "",
  archived: false, // decision C: false = Ready view (default), true = Archived view
  sort: "updatedAt",
  offset: 0,
  items: [], // stale-but-valid — never cleared on a failed refetch (Rule 12)
  total: 0,
  loading: false,
};

/* ---- Boot ------------------------------------------------------------- */
(async function boot() {
  const session = await requireSession();
  if (!session) return;

  mountAppShell({ current: "library" });

  wireToolbar();
  fetchList({ reset: true });
})();

/* ---- Toolbar ------------------------------------------------------------ */
function wireToolbar() {
  let debounceHandle;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => {
      state.search = searchInput.value.trim();
      fetchList({ reset: true });
    }, SEARCH_DEBOUNCE_MS);
  });

  chipArchived.addEventListener("click", () => {
    state.archived = !state.archived;
    chipArchived.setAttribute("aria-pressed", String(state.archived));
    fetchList({ reset: true });
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    fetchList({ reset: true });
  });

  loadMoreBtn.addEventListener("click", () => fetchList({ reset: false }));

  // MVP Sprint 1 — PPTX Upload/Import. Reuses the shared card module's own
  // toast region (#pc-toast-region, injected by presentation-card.js on
  // first card render) rather than standing up a second toast system.
  uploadPptxBtn.addEventListener("click", () => { uploadPptxInput.value = ""; uploadPptxInput.click(); });
  uploadPptxInput.addEventListener("change", async () => {
    const file = uploadPptxInput.files[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      showImportToast(`This file is ${Math.round(file.size / 1024 / 1024)} MB — the limit is 200 MB.`, "error");
      uploadPptxInput.value = "";
      return;
    }
    // The one per-deck choice worth interrupting for: whose images the deck
    // uses. The library page has no staging step like the composer, so this
    // is the only moment to ask — inline and native, not a new modal system.
    const useSource = window.confirm(
      "Use the images from this file?\n\nOK — keep the file's own images.\nCancel — use Nagarro brand photography instead."
    );
    uploadPptxBtn.disabled = true;
    // Laying an imported deck out takes minutes, so importAndWait polls the
    // generation rather than holding one request open past its own timeout.
    // One toast element for the whole build: `persistent` holds off its
    // auto-remove timer, and every progress tick updates it in place
    // (`toast: progressToast`) instead of stacking a new one every ~2s.
    const progressToast = showImportToast(
      "Importing… laying the slides out takes a moment.",
      "info",
      { persistent: true }
    );
    try {
      const presentation = await importAndWait(file, {
        imageSource: useSource ? "source" : "brand",
        // `progress` is null on an older server or before the first tick —
        // the toast's opening message already covers that case.
        onProgress: ({ progress }) => {
          if (!progress) return;
          showImportToast(
            progress.detail || progress.stage,
            "info",
            { toast: progressToast, persistent: true }
          );
        },
      });
      showImportToast(`Imported “${presentation.title}”.`, "success", { toast: progressToast });
      /* Compose warnings stay on the generation record for diagnosis — they
       * are engine telemetry, not something to hand the person importing a
       * deck. The deck is here; anything worth changing is edited in place. */
      fetchList({ reset: true });
    } catch (err) {
      showImportToast(err.message || "Could not import this presentation.", "error", { toast: progressToast });
    } finally {
      uploadPptxBtn.disabled = false;
    }
  });

  // Phase 3 §04's responsive rule: under ~640px, filters collapse behind a
  // "Filters" button.
  filtersToggle.addEventListener("click", () => {
    const open = filtersPanel.classList.toggle("is-open");
    filtersToggle.setAttribute("aria-expanded", String(open));
  });
}

/* ---- Fetch + render ------------------------------------------------------ */
async function fetchList({ reset }) {
  if (state.loading) return;
  state.loading = true;

  if (reset) {
    state.offset = 0;
    if (state.items.length === 0) showSkeletons();
  }
  setListBusy(true);
  clearBanner();

  try {
    const { items, total } = await api.listPresentationsWithTotal({
      // "not archived", not a status whitelist: asking for status="Ready" hid
      // every AI-generated deck the moment "Generated" existed, on a page whose
      // own heading promises every presentation in the workspace.
      archived: state.archived,
      search: state.search || undefined,
      sort: state.sort,
      limit: PAGE_SIZE,
      offset: state.offset,
    });

    state.items = reset ? items : [...state.items, ...items];
    state.total = total;
    state.offset = state.offset + items.length;

    await renderGrid();
    renderCount();
    renderLoadMore();
  } catch (err) {
    // Rule 12: a stale-but-valid view is never replaced by a blank state on
    // refresh — the previous grid (if any) stays exactly as it was.
    if (state.items.length === 0) grid.innerHTML = "";
    showBanner(
      err instanceof ApiError ? err.message : "Could not load your presentations.",
      () => fetchList({ reset: state.items.length === 0 })
    );
  } finally {
    state.loading = false;
    setListBusy(false);
  }
}

function setListBusy(busy) {
  // "Subtle inline spinner on subsequent filter changes" (Phase 3 §04) — the
  // grid itself stays visible throughout; only the count area signals it.
  countEl.classList.toggle("is-busy", busy && state.items.length > 0);
}

async function renderGrid() {
  if (state.items.length === 0) {
    grid.innerHTML = "";
    renderEmptyState();
    return;
  }
  // Build all cards concurrently — N serialized awaits cost N round-trips.
  // Promise.all preserves input order, so DOM order matches item order.
  const cards = await Promise.all(
    state.items.map((item) => buildPresentationCard(item, { onChange: () => fetchList({ reset: true }) }))
  );
  grid.innerHTML = "";
  grid.append(...cards);
}

function renderEmptyState() {
  // §09's seven empty states, applied to whichever is actually true.
  let heading, action;

  if (state.search) {
    heading = `No results for “${escapeHtml(state.search)}.”`;
    action = { label: "Clear search", onClick: () => { searchInput.value = ""; state.search = ""; fetchList({ reset: true }); } };
  } else if (state.archived) {
    heading = "No archived presentations.";
    action = null;
  } else {
    heading = "No presentations yet.";
    action = { label: "Start a presentation", href: "index.html" };
  }

  const wrap = document.createElement("div");
  wrap.className = "lib-empty";
  wrap.innerHTML = `<p>${heading}</p>`;
  if (action) {
    const btn = document.createElement(action.href ? "a" : "button");
    btn.className = "btn btn--ghost";
    btn.textContent = action.label;
    if (action.href) btn.href = action.href;
    else { btn.type = "button"; btn.addEventListener("click", action.onClick); }
    wrap.appendChild(btn);
  }
  grid.appendChild(wrap);
}

function renderCount() {
  const label = state.total === 1 ? "1 presentation" : `${state.total} presentations`;
  countEl.textContent = state.items.length ? label : "";
}

function renderLoadMore() {
  moreWrap.hidden = state.offset >= state.total;
}

function showSkeletons() {
  grid.innerHTML = Array.from({ length: 6 }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-card__thumb"></div>
      <div class="skeleton-card__meta">
        <div class="skeleton-card__line"></div>
        <div class="skeleton-card__line skeleton-card__line--short"></div>
      </div>
    </div>`).join("");
}

function showBanner(message, onRetry) {
  listBanner.className = "banner banner--error";
  listBanner.setAttribute("role", "alert");
  listBanner.innerHTML = `<span>${escapeHtml(message)}</span><span class="banner__spacer"></span>`;
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "btn btn--ghost";
  retry.textContent = "Try again";
  retry.addEventListener("click", () => { clearBanner(); onRetry(); });
  listBanner.appendChild(retry);
  listBanner.hidden = false;
}
function clearBanner() { listBanner.hidden = true; listBanner.innerHTML = ""; }

window.addEventListener("resize", rescalePresentationCardThumbs);

/**
 * @param {string} message
 * @param {string} kind "info" | "success" | "error"
 * @param {{toast?: HTMLElement, persistent?: boolean}} [opts]
 *   `toast`: reuse this element instead of stacking a new one — a live
 *   import updates the same toast on every progress tick rather than
 *   piling one up per tick.
 *   `persistent`: skip the auto-remove timer. A build in progress carries
 *   `data-progress` so it reads as "still going" rather than a message that
 *   happens not to have expired yet; cleared automatically once a non-
 *   persistent call (completion or failure) reuses the same toast.
 * @returns {HTMLElement} the toast element, so a caller can pass it back in
 *   as `toast` on the next call.
 */
function showImportToast(message, kind, { toast: reuse, persistent } = {}) {
  // #pc-toast-region is injected by presentation-card.js the first time a
  // card renders — an empty Library (nothing imported yet) may not have
  // triggered that yet, so fall back to a one-off region rather than
  // silently dropping the message.
  let region = document.getElementById("pc-toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "toast-region";
    region.id = "pc-toast-region";
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }
  let toast = reuse;
  if (!toast) {
    toast = document.createElement("div");
    toast.setAttribute("role", "status");
    region.appendChild(toast);
  }
  toast.className = `toast toast--${kind}`;
  toast.textContent = message;
  if (persistent) {
    toast.dataset.progress = "true";
  } else {
    delete toast.dataset.progress;
    setTimeout(() => toast.remove(), kind === "error" ? 6000 : 4000);
  }
  return toast;
}
