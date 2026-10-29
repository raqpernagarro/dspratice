// =============================================================================
// Export Jobs — Milestone M10 (WP9), UI Layer (Product Layer Spec §7,
// Implementation Spec Screen 08, UX Spec §04/§10/§13).
//
// Workspace-wide export activity list. Every capability here — list,
// filter by presentation/format, download, retry, the derived stale
// indicator — was already built and verified in WP9's backend-only pass;
// this file is the UI Layer only, reusing api.listExports() as-is.
//
// Approved WP9 UI decisions this file implements literally:
//   - No search box, no sort control (UX Spec §13).
//   - No cancellation control on this screen — cancellation stays on
//     Presentation Detail, the only place it's specified.
//   - "List auto-refreshes while any job is Running" (Implementation Spec
//     Screen 08) / "poll... while any item is non-terminal" (UX Spec §10):
//     polling starts only when the currently-loaded page contains a
//     Queued or Running row, and stops the moment none do.
//   - Rows update in place on a poll tick — a same-size refetch of the
//     currently-loaded window, matching Library's own established
//     full-rebuild-per-fetch pattern (presentations.js's fetchList), so no
//     new DOM-diffing approach is introduced for this one screen.
// =============================================================================
import { api, ApiError } from "./lib/api.js";
import { requireSession } from "./lib/session.js";
import { mountAppShell } from "./lib/app-shell.js";
import { escapeHtml, formatDate, formatSize, toast } from "./lib/dom.js";

const PAGE_SIZE = 24;
// Matches detail.js's own EXPORT_POLL_INTERVAL_MS — duplicated as a local
// constant rather than extracted into a shared module (no unrelated
// refactor for this work package).
const POLL_INTERVAL_MS = 1500;

const presentationFilter = document.getElementById("presentation-filter");
const formatChips = {
  "": document.getElementById("chip-format-all"),
  pdf: document.getElementById("chip-format-pdf"),
  pptx: document.getElementById("chip-format-pptx"),
};
const listBanner = document.getElementById("list-banner");
const countEl = document.getElementById("jobs-count");
const listEl = document.getElementById("jobs-list");
const moreWrap = document.getElementById("jobs-more");
const loadMoreBtn = document.getElementById("load-more");
const toastRegion = document.getElementById("toast-region");

const urlParams = new URLSearchParams(location.search);

const state = {
  presentationId: urlParams.get("presentationId") || "",
  format: "",
  offset: 0,
  items: [], // stale-but-valid — never cleared on a failed refetch (Library's own Rule 12 precedent)
  total: 0,
  loading: false,
};

let pollTimer = null;

/* ---- Boot ------------------------------------------------------------- */
(async function boot() {
  const session = await requireSession();
  if (!session) return;

  // Secondary screen, not a nav destination (see file header).
  mountAppShell({ current: null });

  await populatePresentationFilter();
  wireToolbar();
  fetchList({ reset: true });
})();

/* ---- Filters --------------------------------------------------------- */
async function populatePresentationFilter() {
  try {
    // A generous, unpaginated-in-practice limit — this prototype's
    // JSON-file store has no workspace with more presentations than this
    // would ever miss, the same scale assumption already made elsewhere
    // in this codebase (e.g. no caching layer, WP1's own justification).
    const items = await api.listPresentations({ limit: 200 });
    for (const p of items) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.title;
      presentationFilter.appendChild(opt);
    }
    if (state.presentationId) presentationFilter.value = state.presentationId;
  } catch {
    // The filter dropdown is a convenience; its own fetch failing must
    // never block the list itself from loading.
  }
}

function wireToolbar() {
  presentationFilter.addEventListener("change", () => {
    state.presentationId = presentationFilter.value;
    fetchList({ reset: true });
  });
  for (const [value, chip] of Object.entries(formatChips)) {
    chip.addEventListener("click", () => {
      if (state.format === value) return;
      state.format = value;
      for (const [v, c] of Object.entries(formatChips)) c.setAttribute("aria-pressed", String(v === value));
      fetchList({ reset: true });
    });
  }
  loadMoreBtn.addEventListener("click", () => fetchList({ reset: false }));
}

/* ---- Fetch + render ---------------------------------------------------- */
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
    const { items, total } = await api.listExports({
      presentationId: state.presentationId || undefined,
      format: state.format || undefined,
      limit: PAGE_SIZE,
      offset: state.offset,
    });

    state.items = reset ? items : [...state.items, ...items];
    state.total = total;
    state.offset = state.offset + items.length;

    renderList();
    renderCount();
    renderLoadMore();
    schedulePollIfNeeded();
  } catch (err) {
    if (state.items.length === 0) listEl.innerHTML = "";
    showBanner(
      err instanceof ApiError ? err.message : "Could not load export jobs.",
      () => fetchList({ reset: state.items.length === 0 })
    );
  } finally {
    state.loading = false;
    setListBusy(false);
  }
}

/* ---- Polling — only while a visible row is Queued or Running ----------- */
function schedulePollIfNeeded() {
  clearTimeout(pollTimer);
  pollTimer = null;
  const hasNonTerminal = state.items.some((j) => j.status === "Queued" || j.status === "Running");
  if (!hasNonTerminal) return;
  pollTimer = setTimeout(refreshInPlace, POLL_INTERVAL_MS);
}

async function refreshInPlace() {
  if (state.loading) {
    pollTimer = setTimeout(refreshInPlace, POLL_INTERVAL_MS);
    return;
  }
  try {
    // Refetch exactly the currently-loaded window (same filters, from the
    // top, sized to however many rows are already shown) so a poll tick
    // updates rows in place rather than resetting pagination.
    const { items, total } = await api.listExports({
      presentationId: state.presentationId || undefined,
      format: state.format || undefined,
      limit: state.items.length,
      offset: 0,
    });
    state.items = items;
    state.total = total;
    renderList();
    renderCount();
    renderLoadMore();
  } catch {
    // A poll tick's own transient failure is silent — the list stays
    // exactly as it was; the next tick (scheduled below regardless) tries
    // again rather than permanently giving up.
  }
  schedulePollIfNeeded();
}

function setListBusy(busy) {
  countEl.classList.toggle("is-busy", busy && state.items.length > 0);
}

function renderList() {
  if (state.items.length === 0) {
    listEl.innerHTML = "";
    renderEmptyState();
    return;
  }
  // In-place update: the 1.5s poll must not rebuild untouched rows — a full
  // listEl.innerHTML="" wipe killed focus and hover mid-interaction. Only a
  // row whose status/updatedAt changed is rebuilt; new rows are inserted at
  // their position, vanished ones removed.
  if (!listEl.querySelector("[data-job-id]")) listEl.innerHTML = ""; // skeletons / empty state
  const existing = new Map(
    [...listEl.querySelectorAll("[data-job-id]")].map((r) => [r.dataset.jobId, r])
  );
  let cursor = listEl.firstElementChild;
  for (const job of state.items) {
    let row = existing.get(job.id);
    existing.delete(job.id);
    if (row && row.dataset.sig !== rowSignature(job)) {
      const fresh = buildRow(job);
      if (row === cursor) cursor = cursor.nextElementSibling;
      row.replaceWith(fresh);
      row = fresh;
      continue;
    }
    if (!row) row = buildRow(job);
    if (row === cursor) cursor = cursor.nextElementSibling;
    else listEl.insertBefore(row, cursor);
  }
  for (const leftover of existing.values()) leftover.remove();
}

function rowSignature(job) {
  return `${job.status}|${job.updatedAt}|${job.export?.stale ?? ""}`;
}

function renderEmptyState() {
  const wrap = document.createElement("div");
  wrap.className = "lib-empty";
  wrap.innerHTML = `<p>No exports yet.</p>`;
  const link = document.createElement("a");
  link.className = "btn btn--ghost";
  link.href = "presentations.html";
  link.textContent = "Go to Library";
  wrap.appendChild(link);
  listEl.appendChild(wrap);
}

function renderCount() {
  const label = state.total === 1 ? "1 export" : `${state.total} exports`;
  countEl.textContent = state.items.length ? label : "";
}

function renderLoadMore() {
  moreWrap.hidden = state.offset >= state.total;
}

function showSkeletons() {
  listEl.innerHTML = Array.from(
    { length: 6 },
    () => `<div class="export-jobs-row export-jobs-row--skeleton" aria-hidden="true"></div>`
  ).join("");
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

/* ---- Row (Export Card — list-row variant, Implementation Spec Screen 08) */
function buildRow(job) {
  const row = document.createElement("div");
  row.className = "export-jobs-row";
  row.dataset.jobId = job.id;
  row.dataset.sig = rowSignature(job);

  const title = document.createElement("a");
  title.className = "export-jobs-row__title";
  title.href = `detail.html?id=${encodeURIComponent(job.presentationId)}`;
  title.textContent = job.presentationTitle || "(untitled)";

  const format = document.createElement("span");
  format.className = "export-jobs-row__format";
  format.textContent = job.format;

  // Accessibility (Implementation Spec Screen 08): "Export Card's status
  // text always present alongside any icon" — the `.status` component's
  // own ::before dot is decorative; the text node here is never omitted.
  const status = document.createElement("span");
  status.className = "status";
  status.dataset.status = job.status;
  status.textContent = job.status;

  const timestamp = document.createElement("span");
  timestamp.className = "export-jobs-row__meta";
  timestamp.textContent = formatDate(job.updatedAt);

  row.append(title, format, status, timestamp);

  if (job.status === "Succeeded" && job.export) {
    const size = document.createElement("span");
    size.className = "export-jobs-row__meta";
    size.textContent = formatSize(job.export.size);
    row.appendChild(size);

    if (job.export.stale) {
      const stale = document.createElement("span");
      stale.className = "export-jobs-row__stale";
      stale.textContent = "Presentation updated since this export";
      row.appendChild(stale);
    }

    const actions = document.createElement("div");
    actions.className = "export-jobs-row__actions";
    const download = document.createElement("a");
    download.className = "btn btn--ghost";
    download.textContent = "Download";
    download.href = api.getExportDownloadUrl(job.export.id);
    download.target = "_blank";
    download.rel = "noopener";
    actions.appendChild(download);
    row.appendChild(actions);
  } else if (job.status === "Failed") {
    const error = document.createElement("span");
    error.className = "export-jobs-row__error";
    error.textContent = job.error || "The export failed.";
    row.appendChild(error);

    // UX Spec §04 / Implementation Spec Screen 08: the presentation's own
    // latest valid export is noted alongside the failure.
    if (job.export) {
      const latest = document.createElement("span");
      latest.className = "export-jobs-row__meta";
      latest.textContent = `Latest valid export: v${job.export.version} · ${formatDate(job.export.createdAt)}`;
      row.appendChild(latest);
    }

    const actions = document.createElement("div");
    actions.className = "export-jobs-row__actions";
    if (job.export) {
      const download = document.createElement("a");
      download.className = "btn btn--ghost";
      download.textContent = "Download";
      download.href = api.getExportDownloadUrl(job.export.id);
      download.target = "_blank";
      download.rel = "noopener";
      actions.appendChild(download);
    }
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn--ghost";
    retry.textContent = "Retry";
    retry.addEventListener("click", () => handleRetry(job, retry));
    actions.appendChild(retry);
    row.appendChild(actions);
  }
  // Queued/Running rows: the status text itself is the whole row's state —
  // no cancel control (out of scope for this screen; see file header).

  return row;
}

/* ---- Actions ----------------------------------------------------------- */
async function handleRetry(job, button) {
  button.disabled = true;
  try {
    await api.requestExport(job.presentationId, job.format);
    toast(`${job.format.toUpperCase()} export restarted.`, "success", toastRegion);
    fetchList({ reset: true });
  } catch (err) {
    button.disabled = false;
    // 409 = an export is already active for this presentation+format
    // (server-enforced) — the error body's own message already says so.
    toast(err instanceof ApiError ? err.message : "Could not retry the export.", "error", toastRegion);
  }
}
