// product/ui/editor-ai/panel-dom.js
// =============================================================================
// Scroll and focus preservation for the conversation thread.
//
// renderAiPanel() rebuilds the whole thread (`innerHTML = ""` then re-append)
// on EVERY interaction — accepting a row, toggling a diff, changing the canvas
// selection. Wiping the container collapses the scroller's scrollHeight, which
// makes the browser clamp scrollTop to 0; re-appending the content does not
// restore it. The measured effect: scroll to the middle of a conversation,
// click "Diff", and the panel jumps to the top with focus dropped to <body>.
//
// Rather than convert the panel to incremental DOM (a much larger change, and
// the wholesale rebuild is what keeps the render logic simple), this module
// brackets a render: remember where the user was looking and what they had
// focused, then put both back afterwards.
// =============================================================================

/** True while the thread should follow new content. Flipped only by a real
 *  user scroll, or explicitly via stickToBottom(). Starts true — a fresh
 *  conversation opens at its newest turn. */
let stick = true;
/** Guards the scroll listener against our own programmatic scrolling, which
 *  would otherwise be mistaken for the user scrolling away. */
let programmatic = false;
/** Turns appended while the user was reading further up. */
let unseen = 0;
let onStickChange = () => {};

export function isStuck() { return stick; }
export function unseenCount() { return unseen; }
export function stickToBottom() { stick = true; unseen = 0; }
export function noteUnseen() { if (!stick) unseen += 1; }

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 24px, not the 120px the first cut used: anything more and "near the
 *  bottom" starts including positions where the newest turn is only half
 *  visible, so the thread yanks itself down while the user is still reading. */
const STICK_SLOP = 24;

export function wireScroll(el, onChange) {
  if (!el) return;
  onStickChange = onChange || (() => {});
  el.addEventListener("scroll", () => {
    if (programmatic) return;
    const next = el.scrollHeight - el.scrollTop - el.clientHeight <= STICK_SLOP;
    if (next === stick) return;
    stick = next;
    if (stick) unseen = 0;
    onStickChange();
  }, { passive: true });
}

/** Eased scroll to the newest turn. Falls back to an instant jump under
 *  reduced motion or in a background tab (where rAF never fires, which would
 *  otherwise leave the thread stranded mid-scroll). */
export function scrollToBottom(el, dur = 180) {
  if (!el) return;
  const target = el.scrollHeight - el.clientHeight;
  const from = el.scrollTop;
  const dist = target - from;
  if (Math.abs(dist) < 2) return;
  if (reduced() || document.hidden) {
    programmatic = true; el.scrollTop = target; programmatic = false;
    return;
  }
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    programmatic = true;
    el.scrollTop = from + dist * eased;
    programmatic = false;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** The first turn still visible at the top of the scroller, plus how far its
 *  top sits above the fold. Restoring against a turn id (rather than a raw
 *  scrollTop) keeps the user's place even when the render changes the height
 *  of content above them — which accepting or discarding a row always does. */
function captureAnchor(el) {
  if (!el) return null;
  const top = el.getBoundingClientRect().top;
  for (const turn of el.querySelectorAll("[data-anchor]")) {
    const r = turn.getBoundingClientRect();
    if (r.bottom >= top) return { id: turn.dataset.anchor, delta: r.top - top };
  }
  return null;
}

function restoreAnchor(el, anchor) {
  if (!el || !anchor) return;
  const turn = el.querySelector(`[data-anchor="${CSS.escape(anchor.id)}"]`);
  if (!turn) { programmatic = true; el.scrollTop = el.scrollHeight; programmatic = false; return; }
  programmatic = true;
  el.scrollTop += turn.getBoundingClientRect().top - el.getBoundingClientRect().top - anchor.delta;
  programmatic = false;
}

/** Focus survives a rebuild by key, not by node: every control the panel
 *  builds carries a stable `data-fk`, so the equivalent control in the fresh
 *  DOM can be found again. Without this, accepting row 2 of 4 drops a keyboard
 *  user to <body> and they have to Tab back in from the top of the page. */
function captureFocusKey() {
  const el = document.activeElement;
  if (!el || !el.closest) return null;
  const explicit = el.closest("[data-fk]");
  if (explicit) return explicit.dataset.fk;
  // Most controls carry only a data-act ("accept", "edit", "discard",
  // "toggle"). Combined with the nearest scope (the proposal row's field),
  // that is a stable identity across a rebuild without tagging every button.
  const act = el.closest("[data-act]")?.dataset.act;
  const scope = el.closest("[data-fk-scope]")?.dataset.fkScope;
  return act && scope ? `${scope}|${act}` : null;
}

function restoreFocus(key, fallbackEl) {
  if (!key) return;
  let next = null;
  if (key.includes("|")) {
    const [scope, act] = key.split("|");
    next = document.querySelector(`[data-fk-scope="${CSS.escape(scope)}"] [data-act="${CSS.escape(act)}"]`);
  } else {
    next = document.querySelector(`[data-fk="${CSS.escape(key)}"]`);
  }
  // preventScroll is required: without it the browser scrolls the container to
  // reveal the focused node and undoes the anchor restore we just did.
  (next || fallbackEl)?.focus?.({ preventScroll: true });
}

/** Brackets a render with scroll + focus preservation.
 *  mode: "preserve" (default) keeps the user where they were;
 *        "bottom" follows the newest turn (sending, slide change);
 *        "none" leaves scrolling entirely alone. */
export function renderPreserving(scroller, render, { mode = "preserve", fallbackFocus = null } = {}) {
  const key = captureFocusKey();
  const anchor = mode === "preserve" ? captureAnchor(scroller) : null;
  render();
  if (mode === "bottom") {
    stick = true;
    unseen = 0;
    if (scroller) { programmatic = true; scroller.scrollTop = scroller.scrollHeight; programmatic = false; }
  } else if (mode === "preserve") {
    if (stick && scroller) { programmatic = true; scroller.scrollTop = scroller.scrollHeight; programmatic = false; }
    else restoreAnchor(scroller, anchor);
  }
  restoreFocus(key, fallbackFocus);
}
