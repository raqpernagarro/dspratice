// =============================================================================
// Fullscreen Presentation Mode — MVP Sprint 1.
//
// Navigation behavior (keyboard/mouse/touch/idle-hide/fullscreen toggle) is
// deliberately the same as js/engine.js's own deck.html Viewer — that logic
// is proven and already shipped; this file adapts it to fetch a real product
// Presentation via api.getDeck() instead of the static js/decks registry,
// and renders it with the exact same buildStage() call every other product
// screen already uses. Exit (Escape or the close control) returns to
// Presentation Detail, matching this page's actual entry point.
// =============================================================================
import { api, ApiError } from "./lib/api.js";
import { requireSession } from "./lib/session.js";
import { buildStage } from "/js/render.js";

const params = new URLSearchParams(location.search);
const presentationId = params.get("id");

const deckEl = document.getElementById("deck");
const viewport = document.getElementById("viewport");
const counterEl = document.getElementById("counter");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const navHome = document.getElementById("nav-home");
const messageEl = document.getElementById("present-message");

let slides = [];
let stages = [];
let index = 0;

(async function boot() {
  const session = await requireSession();
  if (!session) return;

  if (!presentationId) return showMessage("No presentation specified.");

  // detail.html is now just a location.replace stub — link straight to the
  // workspace instead of bouncing through it.
  navHome.href = `index.html?id=${encodeURIComponent(presentationId)}`;

  let deck;
  try {
    deck = await api.getDeck(presentationId);
  } catch (err) {
    return showMessage(err instanceof ApiError ? err.message : "Could not load this presentation.");
  }

  if (!deck.slides || deck.slides.length === 0) return showMessage("This presentation has no slides.");

  slides = deck.slides;
  document.title = `${deck.meta.title} — Nagarro Presentations`;

  stages = slides.map((s) => {
    const el = buildStage(s, deck.meta);
    viewport.appendChild(el);
    return el;
  });

  wire();
  fit();
  const fromHash = parseInt(location.hash.slice(1), 10);
  go(Number.isFinite(fromHash) ? fromHash - 1 : 0);
  wake();

  // Best-effort: a user gesture (clicking "Present" on Detail) triggered
  // this navigation, but a gesture doesn't reliably carry across a full
  // page load in every browser — if the browser blocks this, the page is
  // still a full-bleed, chrome-free slideshow (this MVP's "Showcase
  // Experience" requirement) and "f" below remains a manual fallback.
  document.documentElement.requestFullscreen?.().catch(() => {});

  /* Leaving fullscreen IS leaving the presentation. The browser swallows the
   * Escape that exits fullscreen, so without this the first press appeared to
   * do nothing to the presentation and a second was needed to actually get
   * out. `wasFullscreen` guards the case where fullscreen was never entered
   * (a browser that refused it), so this cannot fire on load. */
  let wasFullscreen = false;
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) { wasFullscreen = true; return; }
    if (wasFullscreen) exitToDetail();
  });
})();

function showMessage(text) {
  deckEl.hidden = true;
  messageEl.style.display = "flex";
  messageEl.textContent = text;
}

function go(i) {
  index = Math.max(0, Math.min(slides.length - 1, i));
  stages.forEach((el, k) => el.classList.toggle("is-active", k === index));
  counterEl.innerHTML =
    `${String(index + 1).padStart(2, "0")}<span class="total"> / ${String(slides.length).padStart(2, "0")}</span>`;
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === slides.length - 1;
  history.replaceState(null, "", `?id=${encodeURIComponent(presentationId)}#${index + 1}`);
  paintNotes();
}

/* ---- Speaker notes ----------------------------------------------------------
 * Hidden by default: this view is what the room sees. Toggled with N, which is
 * the convention every other presenter tool uses. */
const notesEl = document.getElementById("pv-notes");
const notesBody = document.getElementById("pv-notes-body");
let notesVisible = false;

function paintNotes() {
  const text = String(slides[index]?.notes || "").trim();
  notesBody.textContent = text || "No notes for this slide.";
  notesEl.hidden = !notesVisible;
}

function toggleNotes() {
  notesVisible = !notesVisible;
  paintNotes();
}

const next = () => go(index + 1);
const prev = () => go(index - 1);

function fit() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const x = (window.innerWidth - 1920 * s) / 2;
  const y = (window.innerHeight - 1080 * s) / 2;
  viewport.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
}

function exitToDetail() {
  location.href = `index.html?id=${encodeURIComponent(presentationId)}`;
}

let idleTimer;
function wake() {
  deckEl.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => deckEl.classList.add("idle"), 2600);
}

function wire() {
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  document.querySelector(".edge.left").addEventListener("click", prev);
  document.querySelector(".edge.right").addEventListener("click", next);
  navHome.addEventListener("click", (e) => { e.preventDefault(); exitToDetail(); });

  window.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight": case "ArrowDown": case "PageDown": case " ":
        e.preventDefault(); next(); break;
      case "ArrowLeft": case "ArrowUp": case "PageUp":
        e.preventDefault(); prev(); break;
      case "Home": go(0); break;
      case "End": go(slides.length - 1); break;
      /* Escape is handled by the fullscreenchange listener below, not here.
       * The browser consumes the first Escape to leave fullscreen and never
       * delivers the keydown, so this branch only ever fired on the SECOND
       * press — the presentation appeared stuck with no hint why. */
      case "Escape":
        if (!document.fullscreenElement) exitToDetail();
        break;
      case "n": case "N": toggleNotes(); break;
      case "f": case "F":
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
        break;
    }
  });

  // Auto-hide controls when idle — same 2.6s convention as deck.html.
  ["mousemove", "keydown", "click", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, wake, { passive: true })
  );

  let touchX = null;
  window.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  window.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    touchX = null;
  }, { passive: true });

  window.addEventListener("resize", fit);
}
