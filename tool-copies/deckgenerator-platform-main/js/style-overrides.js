// =============================================================================
// Per-element style overrides — the visual-editing layer.
//
// WHY THIS EXISTS. The 91+ templates are opaque render functions: they own
// their own typography and layout, and nothing in the slide model could say
// "this particular title is one step larger" or "nudge this label left".
// That limitation used to be pushed onto the user as "this element is fixed
// by the template". This module removes it WITHOUT touching a single
// template: it is a post-render pass that finds a field's rendered text and
// applies the user's overrides to it as inline style.
//
// WHERE IT RUNS. buildStage() calls it once, right after a template renders.
// That single call site is why the editor canvas, the rail thumbnails,
// Present mode, and the PPTX/PDF export capture all show identical styling —
// they already all go through buildStage(). A slide with no overrides is
// untouched, so every existing deck renders byte-identically to before.
//
// WHAT CAN BE OVERRIDDEN (the whole vocabulary — deliberately small, and
// brand-safe: sizes are relative to whatever the template chose, colors are
// brand tokens only, so an override can restyle a slide but cannot take it
// off-brand):
//
//   size   1.0 = the template's own size; 1.25 = 25% larger  (em, relative)
//   weight 300 | 400 | 500 | 700 | 900   (the Equip weights)
//   italic true
//   color  a brand token name — see COLOR_TOKENS
//   align  left | center | right   (applied to the text's own block, and
//          only when that block holds nothing but this text — see below)
//   dx/dy  free movement, in 1920×1080 stage pixels
//   w      box width in stage pixels — re-wraps the text inside a narrower
//          or wider box than the template gave it (typography untouched)
//
// TARGET KEYS. One string per editable leaf value, stable across renders:
//   "title"          a plain string field
//   "bullets[2]"     the third item of a string[] field
//   "rows[1].label"  the `label` of the second row of an object[] field
// =============================================================================

export const COLOR_TOKENS = {
  mint: "--mint-green",
  white: "--color-white",
  black: "--color-black",
  petrol: "--petrol-black",
  muted: "--navy-500-on-light",
  "muted-dark": "--navy-500-on-dark",
};

export const WEIGHTS = [300, 400, 500, 700, 900];
export const MIN_SIZE = 0.5;
export const MAX_SIZE = 3;
export const MIN_WIDTH = 40;
export const MAX_WIDTH = 1920;

/* ---- Target keys ---------------------------------------------------------- */

export function textKey(field) { return field; }
export function listKey(field, index) { return `${field}[${index}]`; }
export function rowKey(field, rowIndex, subKey) { return `${field}[${rowIndex}].${subKey}`; }

/**
 * Every styleable leaf value in a slide's content, in a stable order.
 * Derived from the CONTENT's own shape rather than the template schema, so
 * this module stays inside the engine layer with no product dependency.
 *
 * @returns {{key: string, value: string}[]}
 */
/** Engine-shape slides carry these alongside the real content fields; they
 *  are never rendered as text, so they must never compete for a text node. */
const NOT_CONTENT = new Set(["template", "theme", "chrome", "styleOverrides"]);

export function styleTargets(content) {
  const out = [];
  for (const [field, value] of Object.entries(content || {})) {
    if (NOT_CONTENT.has(field)) continue;
    if (typeof value === "string") {
      if (value.trim()) out.push({ key: textKey(field), value });
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "string") {
          if (item.trim()) out.push({ key: listKey(field, i), value: item });
        } else if (item && typeof item === "object") {
          for (const [subKey, sub] of Object.entries(item)) {
            if (typeof sub === "string" && sub.trim()) out.push({ key: rowKey(field, i, subKey), value: sub });
          }
        }
      });
    }
  }
  return out;
}

/* ---- Style → CSS ----------------------------------------------------------- */

/** Writes one override onto an element. Only keys actually present are
 *  written, so an override of `{size}` alone leaves weight/color inherited
 *  from the template exactly as before. */
export function applyStyleToElement(el, style) {
  if (!style || typeof style !== "object") return;

  if (typeof style.size === "number") el.style.fontSize = `${clamp(style.size, MIN_SIZE, MAX_SIZE)}em`;
  if (WEIGHTS.includes(style.weight)) el.style.fontWeight = String(style.weight);
  if (style.italic) el.style.fontStyle = "italic";
  if (style.color && COLOR_TOKENS[style.color]) el.style.color = `var(${COLOR_TOKENS[style.color]})`;

  const w = Number(style.w) || 0;
  if (w > 0) {
    // Same inline-block promotion as movement: an inline span has no box to
    // size, and becoming one is what makes the text re-wrap at the new width.
    const width = clamp(w, MIN_WIDTH, MAX_WIDTH);
    el.style.display = "inline-block";
    el.style.width = `${width}px`;
    // Resizing THIS box must not re-flow its siblings. In shrink-wrapped
    // parents (the lead-statement heading is a flex column that sizes to its
    // widest line) a wider child inflates the parent, and every sibling
    // re-wraps to the new parent width. An equal negative right margin
    // zeroes this box's contribution to the parent's intrinsic size, so the
    // parent keeps sizing to the UNTOUCHED children and the resized text
    // simply overflows its old bounds — which is what "I resized this box"
    // means, and nothing else moves.
    el.style.marginRight = `${-width}px`;
  }

  const dx = Number(style.dx) || 0;
  const dy = Number(style.dy) || 0;
  if (dx || dy) {
    // A non-replaced inline element cannot be transformed at all, so a moved
    // target becomes inline-block. Only moved ones — leaving every other
    // target's line-wrapping exactly as the template laid it out.
    el.style.display = "inline-block";
    // `translate`, NOT `transform`: css/deck.css's reveal entrance animates
    // the independent `translate` property, and templates use `transform`
    // for their own layout. Using the same property the animation uses keeps
    // this composable with both instead of fighting them.
    el.style.translate = `${dx}px ${dy}px`;
  }

  if (style.align) applyAlign(el, style.align);
}

/** Alignment needs a block to act on, and re-aligning a block that holds
 *  other content too would move things the user never selected. So it walks
 *  up only while the ancestor's text is still exactly this element's text,
 *  and gives up otherwise — which is what makes "can this be aligned?" a
 *  question the editor can answer honestly before offering the control. */
export function alignTarget(el) {
  const mine = el.textContent.trim();
  let node = el.parentElement;
  for (let depth = 0; depth < 4 && node; depth++) {
    if (node.classList?.contains("stage")) return null;
    if (node.textContent.trim() !== mine) return null;
    const display = getComputedStyle(node).display;
    if (display !== "inline") return node;
    node = node.parentElement;
  }
  return null;
}

function applyAlign(el, align) {
  const block = alignTarget(el);
  if (block) block.style.textAlign = align;
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

/* ---- The post-render pass -------------------------------------------------- */

/**
 * Applies `styleOverrides` to an already-rendered stage.
 *
 * Matching is by exact text, the same technique the editor's own decoration
 * pass uses (product/ui/lib/editable-canvas.js): walk text nodes in document
 * order and claim the first unclaimed target whose value matches. Templates
 * render every field value as plain escaped text, which is what makes this
 * work for the whole library with no per-template code.
 *
 * In the EDITOR the text is already wrapped in .ed-editable spans, so this
 * is a no-op there and the editor styles those spans directly by key —
 * see editor.js's applyStyleOverridesToCanvas().
 *
 * @param {HTMLElement} stageEl
 * @param {object} content        the slide's content (engine-shape fields)
 * @param {object} styleOverrides key -> style object
 */
export function applyStyleOverrides(stageEl, content, styleOverrides) {
  if (!styleOverrides || !Object.keys(styleOverrides).length) return 0;

  const wanted = styleTargets(content).filter((t) => styleOverrides[t.key]);
  if (!wanted.length) return 0;

  // Claiming walks ALL targets (not just the styled ones) so that a value
  // appearing twice on a slide still binds to the same occurrence the editor
  // bound it to — matching must see the same competition either way.
  const remaining = styleTargets(content);
  const walker = document.createTreeWalker(stageEl, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });

  const toWrap = [];
  let node;
  // eslint-disable-next-line no-cond-assign
  while ((node = walker.nextNode())) {
    const text = node.nodeValue.trim();
    const i = remaining.findIndex((t) => t.value.trim() === text);
    if (i === -1) continue;
    const [target] = remaining.splice(i, 1);
    if (styleOverrides[target.key]) toWrap.push({ node, target });
  }

  for (const { node, target } of toWrap) {
    const span = document.createElement("span");
    span.className = "styled-field";
    span.dataset.styleKey = target.key;
    span.textContent = node.nodeValue;
    node.parentNode.replaceChild(span, node);
    applyStyleToElement(span, styleOverrides[target.key]);
  }
  return toWrap.length;
}
