// =============================================================================
// App Shell — the rail.
//
// Iteration 5. The rail takes on the full navigation job, in the hierarchy a
// chat client uses: a compact brand row with search opposite it, the two
// actions that start work, then the working set.
//
//   nagarro                    ⌕      identity + search, one row
//   ✎ New Presentation                primary nav — the two surfaces that
//   ▤ Templates                       actually begin work
//   RECENTS                    ⚙      the working set, with its own filter
//   …dense rows…
//
// Search is a modal rather than a permanent field: it's used in bursts, so it
// shouldn't hold rail space between bursts. It filters the recents ALREADY IN
// MEMORY — no request, no new endpoint.
//
// Presentations (Library) stays out of navigation but fully intact —
// presentations.html, its routes and its APIs are untouched and still
// reachable directly. Recent rows link straight to Detail.
//
// Returns the loaded recents so a caller (Create) can derive its greeting
// from the same request rather than issuing a second one.
// =============================================================================
import { api } from "./api.js";
import { escapeHtml, trapFocus, formatDate } from "./dom.js";
import { buildThemeSwitch } from "./theme.js";
import { openPresentationMenu } from "./presentation-card.js";
import { NAGARRO_LOGO } from "/js/logo.js";

const RECENT_LIMIT = 20;

/** Filter modes for the Recents list. Client-side only. */
const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
];

const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
                stroke-linecap="round" aria-hidden="true">
             <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>`,
  compose: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>`,
  templates: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.6" />
                <rect x="14" y="3" width="7" height="7" rx="1.6" />
                <rect x="3" y="14" width="7" height="7" rx="1.6" />
                <rect x="14" y="14" width="7" height="7" rx="1.6" /></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" aria-hidden="true">
             <path d="M5 7h14M7 12h10M10 17h4" /></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7" /></svg>`,
  /* Recents row markers — how the deck came to exist. A four-point spark for
   * prompt-generated decks, a document sheet for ones imported from a .pptx. */
  originPrompt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                   <path d="M12 3.5c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6Z" />
                   <path d="M19 14.5c.25 1.8 1.2 2.75 3 3-1.8.25-2.75 1.2-3 3-.25-1.8-1.2-2.75-3-3 1.8-.25 2.75-1.2 3-3Z" /></svg>`,
  originImport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                   <path d="M13.5 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8L13.5 3Z" />
                   <path d="M13.5 3v5h5" /></svg>`,
};

const NAV = [
  { key: "home", href: "index.html", label: "New Presentation", icon: ICONS.compose },
  /* The Library row ("All presentations") was removed by request — the page
   * itself (presentations.html) stays reachable by URL, just not from the
   * rail. */
  { key: "templates", href: "templates.html", label: "Templates", icon: ICONS.templates },
];

/**
 * Set by the page that hosts the workspace (Create). When present, rail rows
 * and search hits open the presentation in place instead of navigating. Pages
 * without a workspace (Templates, Library) leave it unset and keep the plain
 * link behaviour — the href is always real, so deep links, middle-click and
 * "open in new tab" work either way.
 */
let workspaceOpener = null;
export function setWorkspaceOpener(fn) { workspaceOpener = fn; }

/**
 * Set by the Create page. "New Presentation" points at index.html, so on
 * Create itself the link reloaded the document the user was already on —
 * a full round trip that repainted the identical screen and, with view
 * transitions on, flashed. When this is set the row runs it instead: same
 * intent (return to a blank composer), no navigation.
 */
let homeAction = null;
export function setHomeAction(fn) { homeAction = fn; }

/** True for a plain left-click — modified clicks must keep browser semantics. */
function isPlainClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** @returns {Promise<object[]>} the recents, so callers can reuse the data. */
export function mountAppShell({ current }) {
  document.body.classList.add("shell");

  const main = document.querySelector("main");

  const aside = document.createElement("aside");
  aside.className = "shell__side";
  aside.innerHTML = `
    <div class="shell__head">
      <a class="shell__brand" href="index.html" aria-label="Nagarro Presentations">
        <span class="shell__logo">${NAGARRO_LOGO}</span>
      </a>
      <button type="button" class="rail-icon" id="shell-search-btn"
              aria-label="Search presentations" aria-keyshortcuts="Control+K">
        ${ICONS.search}
      </button>
    </div>

    <nav class="shell__nav" aria-label="Primary">
      ${NAV.map((n) => {
        // "New Presentation" is an action, like ChatGPT's New Chat — it never
        // shows as the current destination, even while its own screen (Create)
        // is what's open. Only a Recents row (the actual open document) can be
        // selected; everything else about the current view is expressed there.
        const isCurrent = n.key !== "home" && n.key === current;
        return `
        <a class="nav-row${isCurrent ? " is-current" : ""}" href="${n.href}"${
          isCurrent ? ' aria-current="page"' : ""
        }>
          <span class="nav-row__icon" aria-hidden="true">${n.icon}</span>
          <span>${n.label}</span>
        </a>`;
      }).join("")}
    </nav>

    <div class="shell__recents">
      <div class="shell__recents-head">
        <p class="shell__recents-label" id="recents-label">Recents</p>
        <button type="button" class="rail-icon rail-icon--sm" id="recents-filter-btn"
                aria-haspopup="menu" aria-expanded="false" aria-label="Filter recents">
          ${ICONS.filter}
        </button>
      </div>
      <div class="shell__recents-scroll">
        <div id="shell-recents-list"></div>
      </div>
    </div>`;

  const column = document.createElement("div");
  column.className = "shell__main";
  main.parentNode.insertBefore(column, main);
  column.append(main);
  document.body.insertBefore(aside, column);

  const themeRow = document.createElement("div");
  themeRow.className = "shell__theme";
  themeRow.appendChild(buildThemeSwitch());
  aside.appendChild(themeRow);

  wireSearch();
  wireFilter();
  wireHomeRow(aside);
  return loadRecents();
}

/** "New Presentation" is an action, not a destination, on the page that
 *  already hosts it — see setHomeAction. Elsewhere it stays a plain link. */
function wireHomeRow(aside) {
  const row = aside.querySelector('.nav-row[href="index.html"]');
  row?.addEventListener("click", (e) => {
    if (!homeAction || !isPlainClick(e)) return;
    e.preventDefault();
    homeAction();
  });
}

/* ---- Recents --------------------------------------------------------------- */
let recents = []; // unfiltered — every view filters this in memory, never refetches

/** Remembered until the page reloads, per spec — deliberately not persisted. */
let filterMode = "all";

export async function loadRecents() {
  const list = document.getElementById("shell-recents-list");
  if (!list) return [];

  try {
    recents = await api.listPresentations({ limit: RECENT_LIMIT });
  } catch {
    // The rail is navigation, not the page's payload — a failure here must
    // never block the screen the user actually came for.
    list.innerHTML = `<p class="shell__recents-empty">Couldn't load recents.</p>`;
    return [];
  }
  renderRecents();
  return recents;
}

function visibleRecents() {
  if (filterMode === "active") return recents.filter((p) => p.status !== "Archived");
  if (filterMode === "archived") return recents.filter((p) => p.status === "Archived");
  return recents;
}

function renderRecents() {
  const list = document.getElementById("shell-recents-list");
  const items = visibleRecents();
  const activeId = new URLSearchParams(location.search).get("id");

  if (items.length === 0) {
    list.innerHTML = `<p class="shell__recents-empty">${
      filterMode === "all" ? "Nothing yet." : "Nothing here."
    }</p>`;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
      <div class="recent${item.id === activeId ? " is-active" : ""}" data-id="${escapeAttr(item.id)}">
        <a class="recent__link" href="index.html?id=${encodeURIComponent(item.id)}">
          <span class="recent__icon" aria-hidden="true">${
            item.origin === "import" ? ICONS.originImport : ICONS.originPrompt
          }</span>
          <span class="recent__title">${escapeHtml(item.title)}</span>
        </a>
        <button type="button" class="card-menu-btn recent__menu"
                aria-haspopup="menu" aria-expanded="false"
                aria-label="More actions for ${escapeAttr(item.title)}">⋯</button>
      </div>`
    )
    .join("");

  // Same menu component the Library cards use — one action implementation.
  for (const row of list.querySelectorAll(".recent")) {
    const item = items.find((i) => i.id === row.dataset.id);
    row.querySelector(".recent__menu").addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      openPresentationMenu(e.currentTarget, item, loadRecents);
    });
    row.querySelector(".recent__link").addEventListener("click", (e) => {
      if (!workspaceOpener || !isPlainClick(e)) return;
      e.preventDefault();
      workspaceOpener(item.id);
      markActive(item.id);
    });
  }
}

/** Moves the selection highlight without refetching the list. */
export function markActive(id) {
  for (const row of document.querySelectorAll(".recent")) {
    row.classList.toggle("is-active", row.dataset.id === id);
  }
}

/* ---- Filter popover -------------------------------------------------------
   A small menu anchored under its trigger. Deliberately not the shared
   .card-menu: this one is a single-choice control, so it carries a checkmark
   on the active option rather than a list of verbs. */
function wireFilter() {
  const btn = document.getElementById("recents-filter-btn");

  const menu = document.createElement("div");
  menu.className = "rail-menu";
  menu.id = "recents-filter-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-labelledby", "recents-label");
  menu.hidden = true;
  document.body.append(menu);

  const paint = () => {
    menu.innerHTML = FILTERS.map(
      (f) => `
      <button type="button" role="menuitemradio" data-filter="${f.key}"
              aria-checked="${f.key === filterMode}">
        <span class="rail-menu__check" aria-hidden="true">${f.key === filterMode ? ICONS.check : ""}</span>
        <span>${f.label}</span>
      </button>`
    ).join("");
  };

  const close = () => {
    if (menu.hidden) return;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  };

  const open = () => {
    paint();
    menu.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    // Anchored to the trigger's right edge so it opens inside the rail
    // rather than over the page content.
    const r = btn.getBoundingClientRect();
    menu.style.top = `${r.bottom + 6}px`;
    menu.style.left = `${r.right - menu.offsetWidth}px`;
    menu.querySelector("button")?.focus();
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden ? open() : close();
  });

  menu.addEventListener("click", (e) => {
    const choice = e.target.closest("[data-filter]");
    if (!choice) return;
    filterMode = choice.dataset.filter;
    close();
    btn.focus();
    renderRecents();
  });

  document.addEventListener("click", (e) => {
    if (!menu.hidden && !menu.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      close();
      btn.focus();
    }
  });
}

/* ---- Search modal ---------------------------------------------------------
   Opens over the page, filters what's already in memory as you type, and is
   fully keyboard-driven: ↑/↓ move, Enter opens, Esc closes. */
function wireSearch() {
  const trigger = document.getElementById("shell-search-btn");

  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search presentations">
      <div class="search-panel__field">
        <span class="search-panel__icon" aria-hidden="true">${ICONS.search}</span>
        <input type="text" id="search-modal-input" autocomplete="off" spellcheck="false"
               placeholder="Search presentations" aria-label="Search presentations"
               aria-controls="search-modal-results" />
      </div>
      <div class="search-panel__results" id="search-modal-results" role="listbox"
           aria-label="Results"></div>
    </div>`;
  document.body.append(overlay);

  const input = overlay.querySelector("#search-modal-input");
  const results = overlay.querySelector("#search-modal-results");
  let matches = [];
  let cursor = 0;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    // Title AND status are both searchable — "archived" is as natural a query
    // as a title fragment.
    matches = q
      ? recents.filter(
          (p) =>
            p.title.toLowerCase().includes(q) || String(p.status).toLowerCase().includes(q)
        )
      : recents;
    cursor = 0;

    if (matches.length === 0) {
      results.innerHTML = `<p class="search-panel__empty">No presentations match “${escapeHtml(
        input.value.trim()
      )}”.</p>`;
      return;
    }

    results.innerHTML = matches
      .map(
        (item, i) => `
        <a class="search-hit${i === 0 ? " is-cursor" : ""}" role="option"
           aria-selected="${i === 0}" data-i="${i}"
           href="index.html?id=${encodeURIComponent(item.id)}">
          <span class="search-hit__title">${escapeHtml(item.title)}</span>
          <span class="search-hit__side">
            <span class="search-hit__date">${formatDate(item.updatedAt)}</span>
          </span>
        </a>`
      )
      .join("");
  };

  const moveCursor = (delta) => {
    const hits = [...results.querySelectorAll(".search-hit")];
    if (hits.length === 0) return;
    hits[cursor]?.classList.remove("is-cursor");
    hits[cursor]?.setAttribute("aria-selected", "false");
    cursor = (cursor + delta + hits.length) % hits.length;
    hits[cursor].classList.add("is-cursor");
    hits[cursor].setAttribute("aria-selected", "true");
    hits[cursor].scrollIntoView({ block: "nearest" });
  };

  const close = () => {
    if (overlay.hidden) return;
    overlay.hidden = true;
    trigger.focus();
  };

  const open = () => {
    input.value = "";
    render();
    overlay.hidden = false;
    input.focus();
  };

  trigger.addEventListener("click", open);
  input.addEventListener("input", render);

  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close(); // click outside the panel
  });

  // A hit opens in the workspace when one exists; otherwise the href stands.
  results.addEventListener("click", (e) => {
    const hit = e.target.closest(".search-hit");
    if (!hit || !workspaceOpener || !isPlainClick(e)) return;
    e.preventDefault();
    const id = new URL(hit.href, location.href).searchParams.get("id");
    close();
    workspaceOpener(id);
    markActive(id);
  });

  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return close();
    if (e.key === "Tab") return trapFocus(e, overlay);
    if (e.key === "ArrowDown") { e.preventDefault(); moveCursor(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveCursor(-1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      results.querySelectorAll(".search-hit")[cursor]?.click();
    }
  });

  // ⌘K / Ctrl-K — the shortcut anyone reaching for search already expects.
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      overlay.hidden ? open() : close();
    }
  });
}

/* ---- Helpers -------------------------------------------------------------- */
const escapeAttr = escapeHtml;

