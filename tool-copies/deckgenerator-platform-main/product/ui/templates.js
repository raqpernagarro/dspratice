// =============================================================================
// Templates Gallery — dense, application-style library.
//
// The gallery is READ-ONLY: it browses and previews the registry and never
// mutates anything. A tile is the whole affordance — clicking it (or Enter /
// Space on the focused tile) opens the fullscreen preview. There are no
// per-card action buttons.
//
// Standing decisions this file still implements literally:
//   A — no "Promote" action anywhere; no design-operator role exists.
//   B — "category" comes from the Service's computed grouping; nothing here
//       invents or persists its own metadata.
//   F — every preview is a genuine buildStage() render of the template's own
//       example content, byte-identical to the Master Template deck's own
//       rendering. Never a screenshot, a cache, or a second rendering path.
//
// Performance contract: the full registry is fetched ONCE and every card
// element is built ONCE — but at 229+ templates, rendering every card's
// live 1920×1080 stage up front froze first paint, so the stage itself
// mounts on demand as the user scrolls near it (see scheduleBuild). Search
// and the category/family dropdowns only toggle `hidden` on the existing DOM —
// typing never re-renders the grid. Cards carry `content-visibility: auto`
// (see app.css) so offscreen stages don't cost layout/paint while scrolling.
// =============================================================================
import { api, ApiError } from "./lib/api.js";
import { requireSession } from "./lib/session.js";
import { mountAppShell } from "./lib/app-shell.js";
import { buildStage } from "/js/render.js";
import { escapeHtml, trapFocus } from "./lib/dom.js";

const searchInput = document.getElementById("search-input");
const categoryFilterEl = document.getElementById("category-filter");
const familyFilterEl = document.getElementById("family-filter");
const slideThemeBtns = [...document.querySelectorAll("[data-slide-theme]")];
const listBanner = document.getElementById("list-banner");
const countEl = document.getElementById("lib-count");
const grid = document.getElementById("tpl-grid");
const emptyEl = document.getElementById("lib-empty");
const emptyText = document.getElementById("lib-empty-text");
const clearBtn = document.getElementById("clear-filters");

const previewDialog = document.getElementById("preview-dialog");
const previewClose = document.getElementById("preview-close");
const previewStage = document.getElementById("preview-stage");
const previewCategory = document.getElementById("preview-category");
const previewTitle = document.getElementById("preview-title");
const previewPrev = document.getElementById("preview-prev");
const previewNext = document.getElementById("preview-next");
const previewPosition = document.getElementById("preview-position");

const state = {
  search: "",
  category: "",
  family: "",
  // "light" = each template in its own theme; "dark" = every preview dark.
  slideTheme: readSlideTheme(),
  items: [],   // full registry, fetched once
  cards: [],   // { item, el, thumb, frame, haystack } — built once, in order
  previewIndex: -1, // index into visibleCards() while the lightbox is open
};

/* ---- Boot ------------------------------------------------------------- */
(async function boot() {
  const session = await requireSession();
  if (!session) return;

  mountAppShell({ current: "templates" });

  wireToolbar();
  wirePreviewDialog();
  fetchList();
})();

/* ---- Fetch (once) + build (once) ----------------------------------------- */
async function fetchList() {
  showSkeletons();
  clearBanner();
  try {
    state.items = await api.listTemplates();
  } catch (err) {
    grid.innerHTML = "";
    showBanner(err instanceof ApiError ? err.message : "Could not load the template library.", fetchList);
    return;
  }
  filterMenus = [
    buildFilterMenu(categoryFilterEl, {
      key: "category", label: "Category", allLabel: "All categories",
      values: [...new Set(state.items.map((t) => t.category))].sort((a, b) => a.localeCompare(b)),
      format: (v) => v,
    }),
    buildFilterMenu(familyFilterEl, {
      key: "family", label: "Family", allLabel: "All families",
      values: [...new Set(state.items.map((t) => t.family).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
      format: (v) => v[0].toUpperCase() + v.slice(1).replace(/-/g, " "),
    }),
  ];
  buildGrid();
  applyFilters();
}

function buildGrid() {
  grid.innerHTML = "";
  state.cards = state.items.map((item) => buildCard(item));
  for (const c of state.cards) grid.appendChild(c.el);
  // Stages mount on demand as the user scrolls (see scheduleBuild below) —
  // this call mounts whatever chunk is near the fold right away, so the
  // page never opens with an empty-looking grid before any scroll fires.
  scheduleBuild();
  // One initial scale pass once layout settles; fonts can shift widths.
  requestAnimationFrame(scaleThumbs);
  (document.fonts?.ready || Promise.resolve()).then(scaleThumbs);
}

/* ---- Filter dropdowns ------------------------------------------------------
   Category (the Service's computed grouping) and family (the master a template
   belongs to). Each is a trigger button plus a single-choice popover in the
   rail-menu style; every option carries its live count — the templates it
   would show given the OTHER filter and the search — so a choice that empties
   the grid is visible (and disabled) before it is made. Exactly one value is
   active per menu; "" means all. */
let filterMenus = [];

/** Templates matching everything except the filter named `skip`. */
function countWith(skip, value) {
  const q = state.search.toLowerCase();
  let n = 0;
  for (const c of state.cards) {
    if (skip !== "category" ? state.category && c.item.category !== state.category : value && c.item.category !== value) continue;
    if (skip !== "family" ? state.family && c.item.family !== state.family : value && c.item.family !== value) continue;
    if (q && !c.haystack.includes(q)) continue;
    n++;
  }
  return n;
}

function buildFilterMenu(host, { key, label, allLabel, values, format }) {
  host.innerHTML = `
    <button type="button" class="lib-select__btn" aria-haspopup="menu" aria-expanded="false">
      <span class="lib-select__label">${escapeHtml(label)}</span>
      <span class="lib-select__value"></span>
      <svg class="lib-select__caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button type="button" class="lib-select__clear" aria-label="Clear ${escapeHtml(label.toLowerCase())} filter" hidden>&times;</button>`;
  const btn = host.querySelector(".lib-select__btn");
  const valueEl = host.querySelector(".lib-select__value");
  const clearEl = host.querySelector(".lib-select__clear");

  const menu = document.createElement("div");
  menu.className = "rail-menu lib-select__menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", label);
  menu.hidden = true;
  document.body.append(menu);

  const sync = () => {
    const v = state[key];
    valueEl.textContent = v ? format(v) : "All";
    host.classList.toggle("is-active", !!v);
    clearEl.hidden = !v;
  };
  const choose = (v) => {
    if (state[key] === v) return;
    state[key] = v;
    sync();
    applyFilters();
  };

  const check = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  const paint = () => {
    menu.innerHTML = ["", ...values].map((v) => {
      const n = countWith(key, v);
      const on = state[key] === v;
      return `<button type="button" role="menuitemradio" data-value="${escapeHtml(v)}" aria-checked="${on}"${n || on ? "" : " disabled"}>
        <span class="rail-menu__check" aria-hidden="true">${on ? check : ""}</span>
        <span class="lib-select__opt">${escapeHtml(v ? format(v) : allLabel)}</span>
        <span class="lib-select__count">${n}</span>
      </button>`;
    }).join("");
  };
  const close = () => {
    if (menu.hidden) return;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    for (const m of filterMenus) if (m.close !== close) m.close();
    paint();
    menu.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    const r = btn.getBoundingClientRect();
    menu.style.top = `${r.bottom + 6}px`;
    menu.style.left = `${r.left}px`;
    menu.style.maxHeight = `${Math.max(200, window.innerHeight - r.bottom - 24)}px`;
    (menu.querySelector('[aria-checked="true"]') || menu.querySelector("button:not([disabled])"))?.focus();
  };

  btn.addEventListener("click", (e) => { e.stopPropagation(); menu.hidden ? open() : close(); });
  clearEl.addEventListener("click", () => choose(""));
  menu.addEventListener("click", (e) => {
    const opt = e.target.closest("[data-value]");
    if (!opt || opt.disabled) return;
    choose(opt.dataset.value);
    close();
    btn.focus();
  });
  menu.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...menu.querySelectorAll("button:not([disabled])")];
    const i = items.indexOf(document.activeElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  });
  document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target)) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) { close(); btn.focus(); }
  });
  window.addEventListener("resize", close);

  sync();
  return { sync, close };
}

/* ---- Slide theme toggle ----------------------------------------------------
   Every slide paints from theme tokens (.stage[data-theme] in deck.css), so
   switching is just re-tagging the stages already in the DOM — no re-render.
   "light" restores each template's own theme (dark covers stay dark). */
// A function declaration (hoisted) with a literal key: `state` calls this
// before any module-level const below it is initialised.
function readSlideTheme() {
  try { return localStorage.getItem("nps:tpl-slide-theme") === "dark" ? "dark" : "light"; } catch { return "light"; }
}
const SLIDE_THEME_KEY = "nps:tpl-slide-theme";
function themeOf(item) {
  return state.slideTheme === "dark" ? "dark" : (item.theme || "light");
}
function applySlideTheme() {
  for (const b of slideThemeBtns) b.setAttribute("aria-pressed", String(b.dataset.slideTheme === state.slideTheme));
  for (const c of state.cards) {
    const t = themeOf(c.item);
    c.thumb.dataset.theme = t;
    const stage = c.frame.querySelector(".stage");
    if (stage) stage.dataset.theme = t || "light";
  }
  if (!previewDialog.hidden && previewItem) {
    const t = themeOf(previewItem);
    previewStage.dataset.theme = t;
    const stage = previewStage.querySelector(".stage");
    if (stage) stage.dataset.theme = t || "light";
  }
}
/** One setting, two controls (toolbar + fullscreen preview) and the T key. */
function setSlideTheme(next) {
  if (state.slideTheme === next) return;
  state.slideTheme = next;
  try { localStorage.setItem(SLIDE_THEME_KEY, next); } catch { /* private mode: still works for this visit */ }
  applySlideTheme();
}
function wireSlideTheme() {
  for (const b of slideThemeBtns) b.addEventListener("click", () => setSlideTheme(b.dataset.slideTheme));
  for (const b of slideThemeBtns) b.setAttribute("aria-pressed", String(b.dataset.slideTheme === state.slideTheme));
}

/* ---- Filtering — hidden-toggling only, never a rebuild -------------------- */
function applyFilters() {
  const q = state.search.toLowerCase();
  let shown = 0;
  for (const c of state.cards) {
    const match =
      (!state.category || c.item.category === state.category) &&
      (!state.family || c.item.family === state.family) &&
      (!q || c.haystack.includes(q));
    c.el.hidden = !match;
    if (match) shown++;
  }
  /* Back to the top on every filter change. The grid kept its old scroll
     position, so filtering while scrolled left the first row of results hidden
     behind the toolbar and the page looked empty. */
  grid?.scrollTo?.({ top: 0 });
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0;

  emptyEl.hidden = shown !== 0;
  if (shown === 0) {
    emptyText.textContent = state.search
      ? "No templates match your search."
      : "No templates in this category.";
  }
  countEl.textContent = shown === state.cards.length
    ? `${shown} templates`
    : `${shown} of ${state.cards.length}`;
  // Grid tracks are uniform, but a filter can change the column count via
  // scrollbar appearance — cheap enough to rescale the visible set.
  requestAnimationFrame(scaleThumbs);
  // A filter can unhide cards that were never near the fold before (e.g.
  // clearing a category reveals cards far down the old, filtered list) —
  // those need their own mount pass.
  scheduleBuild();
}

function wireToolbar() {
  let debounceHandle;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => {
      state.search = searchInput.value.trim();
      applyFilters();
    }, 120);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.search = "";
    state.category = "";
    state.family = "";
    for (const m of filterMenus) m.sync();
    applyFilters();
  });

  wireSlideTheme();
}

/* ---- Template Card --------------------------------------------------------
   Preview-first: the stage fills the card, with one caption row beneath it
   (name + muted category). The tile carries no buttons — it IS the button:
   clicking (or Enter/Space) opens the fullscreen preview. */
function buildCard(item) {
  const el = document.createElement("article");
  el.className = "tpl-tile";

  const thumb = document.createElement("div");
  thumb.className = "deck-card__thumb tpl-tile__thumb";
  thumb.dataset.theme = themeOf(item);
  const frame = document.createElement("div");
  frame.className = "deck-card__frame";
  thumb.appendChild(frame);

  // The heavy buildStage() render is deferred until the card is near the
  // fold (~229 synchronous renders at boot froze first paint) — see
  // mountStage() / scheduleBuild(). The thumb keeps its CSS aspect ratio, so
  // the empty frame is the placeholder; filtering works immediately because
  // the card itself exists now.

  const caption = document.createElement("div");
  caption.className = "tpl-tile__caption";
  caption.innerHTML =
    /* Suffix first. Names are "family/shape-variant" and every tile ellipsised
     * at the point of difference — a row reading "strategy/g…, strategy/g…,
     * strategy/g…" tells you nothing about which is which. The distinctive half
     * leads; the family follows and is what gets cut if anything does. */
    `<span class="tpl-tile__name" title="${escapeHtml(item.name)}">` +
      `<b>${escapeHtml(item.name.split("/").slice(1).join("/") || item.name)}</b>` +
      (item.name.includes("/") ? `<span class="tpl-tile__family"> · ${escapeHtml(item.name.split("/")[0])}</span>` : "") +
    `</span>` +
    `<span class="tpl-tile__cat">${escapeHtml(item.category)}</span>`;

  el.append(thumb, caption);

  // The tile itself is the only affordance now, so it carries the button
  // semantics the removed Preview button used to provide.
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `Preview ${item.name}`);
  el.addEventListener("click", () => openPreviewByName(item.name));
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPreviewByName(item.name);
    }
  });
  // The ResizeObserver attaches at mount time (mountStage), not here — an
  // unmounted card has no rendered frame to rescale, so observing it now
  // would just be dead overhead across ~229 tiles.

  const haystack =
    `${item.name} ${item.category} ${item.description} ${item.role || ""} ${item.family || ""}`
      .toLowerCase();
  const card = { item, el, thumb, frame, haystack };
  cardByThumb.set(thumb, card);
  return card;
}

/* Stages mount on demand: a rAF-throttled scroll/resize handler builds the
   next chunk whenever an unbuilt, visible card is within one viewport-height
   of the fold. Deterministic (no IntersectionObserver — its callbacks are
   throttled or suppressed in hidden/embedded contexts, which left cards
   permanently blank). The first chunk(s) near the fold build immediately via
   buildGrid()'s own scheduleBuild() call, so the page never opens empty. */
const cardByThumb = new WeakMap();
const CHUNK_SIZE = 8;
// window.innerHeight (and visualViewport.height) report 0 for a document
// that is hidden / not yet attached to a real rendering surface — a real,
// reproduced state: a freshly navigated tab reports innerHeight 0 and
// document.visibilityState "hidden" until something (e.g. a screenshot)
// attaches it, even though scripts run and the DOM is fully queryable the
// whole time. A near-fold limit computed from a 0 viewport height mounts
// nothing on that pass, and — because near.length is then never
// CHUNK_SIZE — the self-chain never re-arms either, so the grid can sit at
// 0 stages indefinitely with no error. screen.height (the OS display size)
// stays populated even while hidden, so it's a safe, always-nonzero
// fallback that keeps the very first build from being a silent no-op.
function viewportHeight() {
  return window.innerHeight || screen.height || 1080;
}
const BUILD_AHEAD_PX = () => viewportHeight();
let buildScheduled = false;

function unbuiltVisibleCards() {
  // A failed render must leave the pool after one attempt — otherwise it
  // never gains a `.stage` and stays "unbuilt" forever, so every scroll
  // (and, if 8+ near-fold cards fail at once, every animation frame via
  // scheduleBuild's self-chain — no further input needed) re-attempts it in
  // a tight loop. `tpl-tile__thumb--failed` (set in mountStage's catch) is
  // that one-attempt marker.
  return state.cards.filter(
    (c) => !c.el.hidden && !c.frame.querySelector(".stage") && !c.thumb.classList.contains("tpl-tile__thumb--failed")
  );
}

function mountStage(card) {
  if (card.frame.querySelector(".stage")) return;
  // A single template's preview failing must only blank that one card
  // (approved decision F) — never the rest of the grid.
  try {
    card.frame.appendChild(renderStage(card.item));
  } catch {
    card.thumb.classList.add("tpl-tile__thumb--failed");
  }
  const w = card.thumb.clientWidth;
  if (w) card.frame.style.transform = `scale(${w / 1920})`;
  thumbObserver.observe(card.thumb);
}

function buildNearbyStages() {
  buildScheduled = false;
  const pending = unbuiltVisibleCards();
  if (!pending.length) return;
  const limit = viewportHeight() + BUILD_AHEAD_PX();
  const near = pending.filter((c) => c.el.getBoundingClientRect().top < limit).slice(0, CHUNK_SIZE);
  if (!near.length) return;
  for (const card of near) mountStage(card);
  if (near.length === CHUNK_SIZE) scheduleBuild(); // keep going while there's close work
}

function scheduleBuild() {
  if (buildScheduled) return;
  buildScheduled = true;
  // requestAnimationFrame callbacks are suppressed entirely for a hidden or
  // not-yet-attached document — a real, reproduced failure mode: a page
  // that boots (or is scrolled) while backgrounded queues an rAF that may
  // not run for seconds, or ever, if the tab never becomes visible in that
  // window. Because buildNearbyStages() is the only place that resets
  // buildScheduled back to false, a callback that never fires wedges the
  // flag at true forever — every later scheduleBuild() call (from
  // applyFilters, scroll, resize) then hits the early return above and
  // does nothing, silently killing all mounting for the rest of the page's
  // life. This is the same hazard class as the NO-IntersectionObserver rule
  // above (suppressed callbacks in hidden/embedded contexts), just hitting
  // rAF instead. A setTimeout fallback fires on its own clock regardless of
  // visibility, so the flag always clears and a build is always attempted;
  // a `ran` guard stops whichever of the two callbacks loses the race from
  // running the build twice.
  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    buildNearbyStages();
  };
  requestAnimationFrame(run);
  setTimeout(run, 50);
}

// The page itself never scrolls (html/body are `overflow: hidden` — see
// app.css — so the rail, header, search and chips stay put); `#lib-scroll`
// is the actual scrolling element. getBoundingClientRect() below is
// viewport-relative regardless of which ancestor scrolls, so the near-fold
// check works unchanged — only the listener's target differs from a plain
// window-scroll page.
const libScroll = document.getElementById("lib-scroll");
libScroll?.addEventListener("scroll", scheduleBuild, { passive: true });
window.addEventListener("resize", scheduleBuild);

function renderStage(item) {
  const stage = buildStage(
    { template: item.name, ...item.example, ...(state.slideTheme === "dark" ? { theme: "dark" } : {}) },
    { title: item.name, description: item.description }
  );
  stage.classList.add("is-thumb");
  fixRelativeAssetSrc(stage);
  return stage;
}

/**
 * ~48 of 103 templates hardcode `src="assets/..."` — relative to whatever
 * page called buildStage(). Root pages resolve it; product/ui/ lives one
 * directory down, so the same path 404s here. Rewritten to root-absolute in
 * the rendered output only — no immutable engine file is touched.
 */
function fixRelativeAssetSrc(stage) {
  for (const img of stage.querySelectorAll("img[src]")) {
    const src = img.getAttribute("src");
    if (src && !/^(\/|https?:|data:)/.test(src)) {
      img.setAttribute("src", "/" + src);
    }
  }
}

/* One shared observer scales every 1920×1080 frame to its tile's real width —
   it fires whenever layout actually settles or changes (fonts, filters,
   scrollbars, resize), which one-shot rAF passes get wrong. */
const thumbObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const w = entry.contentRect.width;
    if (!w) continue;
    const frame = entry.target.querySelector(".deck-card__frame");
    if (frame) frame.style.transform = `scale(${w / 1920})`;
  }
});

function scaleThumbs() {
  for (const c of state.cards) {
    if (c.el.hidden) continue;
    const w = c.thumb.clientWidth;
    if (w) c.frame.style.transform = `scale(${w / 1920})`;
  }
}

/* ---- Fullscreen preview lightbox ------------------------------------------
   Navigates within the currently visible (filtered) set: ← → keys, on-screen
   arrows, Escape or click-outside to close. */
let dialogTrigger = null;

function visibleCards() {
  return state.cards.filter((c) => !c.el.hidden);
}

function wirePreviewDialog() {
  previewClose.addEventListener("click", closePreview);
  previewPrev.addEventListener("click", () => stepPreview(-1));
  previewNext.addEventListener("click", () => stepPreview(1));
  previewDialog.addEventListener("click", (e) => {
    // Anywhere outside the slide itself closes, except the controls.
    if (!e.target.closest(".deck-card__frame, button, a, input, select, textarea")) closePreview();
  });
  document.addEventListener("keydown", (e) => {
    if (previewDialog.hidden) return;
    if (e.key === "Escape") closePreview();
    else if (e.key === "ArrowLeft") stepPreview(-1);
    else if (e.key === "ArrowRight") stepPreview(1);
    else if ((e.key === "t" || e.key === "T") && !e.metaKey && !e.ctrlKey && !e.altKey) {
      setSlideTheme(state.slideTheme === "dark" ? "light" : "dark");
    }
    else if (e.key === "Tab") trapFocus(e, previewDialog);
  });
  window.addEventListener("resize", scalePreview);
}

/* ---- Start a deck from a template -------------------------------------------
 * The only way to create a deck that needs no Claude CLI. README has promised
 * "or start from a template" from the beginning while the gallery stayed
 * browse-only, so a template-first user had no way in — createPresentation
 * existed with no UI caller at all.
 *
 * One slide, seeded with the template's own example so the editor opens on
 * something real rather than empty fields. More slides are added in the editor,
 * which is where that belongs. */
const previewUse = document.getElementById("preview-use");
let previewItem = null;

previewUse?.addEventListener("click", async () => {
  if (!previewItem) return;
  const label = previewUse.textContent;
  previewUse.disabled = true;
  previewUse.textContent = "Creating…";
  try {
    const created = await api.createPresentation({
      title: "Untitled presentation",
      slides: [{
        order: 0,
        templateReference: {
          templateName: previewItem.name, templateVersion: 1, templatePackId: "main-template",
        },
        content: { ...(previewItem.example || {}) },
      }],
    });
    window.location.href = `editor.html?id=${encodeURIComponent(created.id)}`;
  } catch (err) {
    previewUse.textContent = label;
    previewUse.disabled = false;
    showStartError(err.message || "Could not start a deck from this template.");
  }
});

/** Reuses the lightbox's own hint line rather than an alert. */
function showStartError(message) {
  const hint = document.getElementById("preview-position");
  if (hint) hint.textContent = message;
}

function openPreviewByName(name) {
  const list = visibleCards();
  const index = list.findIndex((c) => c.item.name === name);
  if (index === -1) return;
  dialogTrigger = document.activeElement;
  state.previewIndex = index;
  paintPreview();
  previewDialog.hidden = false;
  previewClose.focus();
}

function stepPreview(delta) {
  const list = visibleCards();
  if (!list.length) return;
  state.previewIndex = (state.previewIndex + delta + list.length) % list.length;
  paintPreview();
}

function paintPreview() {
  const list = visibleCards();
  const c = list[state.previewIndex];
  if (!c) return closePreview();
  const t = c.item;

  previewItem = t;
  previewTitle.textContent = t.name;
  previewCategory.textContent = t.category;
  previewPosition.textContent = `${state.previewIndex + 1} / ${list.length}`;

  previewStage.innerHTML = "";
  previewStage.dataset.theme = themeOf(t);
  try {
    const frame = document.createElement("div");
    frame.className = "deck-card__frame";
    frame.appendChild(renderStage(t));
    previewStage.appendChild(frame);
    requestAnimationFrame(scalePreview);
  } catch {
    const failed = document.createElement("p");
    failed.className = "viewer-frame__empty";
    failed.textContent = "This template's preview couldn't be rendered.";
    previewStage.appendChild(failed);
  }
}

function scalePreview() {
  const frame = previewStage.querySelector(".deck-card__frame");
  if (frame) frame.style.transform = `scale(${previewStage.clientWidth / 1920})`;
}

function closePreview() {
  previewDialog.hidden = true;
  state.previewIndex = -1;
  dialogTrigger?.focus();
  dialogTrigger = null;
}

/* ---- Skeletons / banner ---------------------------------------------------- */
function showSkeletons() {
  grid.innerHTML = Array.from({ length: 12 }, () => `
    <div class="skeleton-card tpl-skeleton" aria-hidden="true">
      <div class="skeleton-card__thumb"></div>
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
