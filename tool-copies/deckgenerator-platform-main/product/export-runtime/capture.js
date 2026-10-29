// =============================================================================
// Export Runtime — capture surface script (Milestone M10, ADR-0008/ADR-0009).
//
// Loaded by capture.html. This file has two parts:
//
//   1. Mounting (below) — Product-owned, NOT a port. Exposes
//      window.__mountSlide(slide, meta) which calls buildStage() directly,
//      the same sanctioned reuse seam js/render-gateway.js already uses for
//      the Viewer. There is no getDeck()/registry lookup anywhere in this
//      file — a runtime Presentation is handed in directly by the
//      orchestrator (index.mjs), never resolved from js/decks/index.js.
//
//   2. Walker (from the "Walker" banner to the end of the file) — a
//      verbatim, line-for-line port of js/export.js's own walker, per
//      ADR-0009's sanctioned exception. Nothing in this section is
//      rewritten, reorganized, or "improved" relative to the original; it
//      is copied so it can be verified equivalent (ADR-0008 §4, checked by
//      WP7) and kept in sync by inspection, not reinterpreted from memory.
//      Only two references were necessarily changed: `getTemplate` is
//      imported from the same immutable, read-only Templates registry the
//      original uses (reading it is sanctioned everywhere in this system,
//      unlike the deck registry) via an absolute path instead of a
//      relative one, since this file lives one directory deeper than
//      js/export.js did.
// =============================================================================
import { buildStage } from "/js/render.js";
import { getTemplate } from "/js/templates/index.js";

const root = document.getElementById("export-root");

/* ---- Mounting (Product-owned, not a port) --------------------------------- */
window.__mountSlide = async function (slide, meta) {
  try {
    root.innerHTML = "";
    const stage = buildStage(slide, meta);
    root.appendChild(stage);
    // Settle: fonts loaded + two animation frames so layout/paint is final —
    // identical settle sequence to js/export.js's own window.__renderSlide.
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
};

// =============================================================================
// Walker — verbatim port of js/export.js (lines 64-459 of the original)
// =============================================================================

/* Per-weight font family names — verified from the Equip OTF name tables.
   Bold (700) is keyed as a subfamily of the base family → uses the bold flag. */
const FONT_MAP = {
  "Equip": {
    100: ["Equip Thin", false], 200: ["Equip ExtraLight", false],
    300: ["Equip Light", false], 400: ["Equip", false],
    500: ["Equip Medium", false], 600: ["Equip Medium", false],
    700: ["Equip", true], 800: ["Equip ExtraBold", false],
    900: ["Equip Black", false],
  },
  "Equip Extended": {
    100: ["Equip Extended Thin", false], 200: ["Equip Extended ExtraLight", false],
    300: ["Equip Extended Light", false], 400: ["Equip Extended", false],
    500: ["Equip Extended Medium", false], 600: ["Equip Extended Medium", false],
    700: ["Equip Extended", true], 800: ["Equip Extended ExtraBold", false],
    900: ["Equip Extended Black", false],
  },
};

function fontFor(cs) {
  const fam = cs.fontFamily || "";
  const base = /extended/i.test(fam) ? "Equip Extended" : "Equip";
  let w = parseInt(cs.fontWeight, 10);
  if (!Number.isFinite(w)) w = cs.fontWeight === "bold" ? 700 : 400;
  w = Math.min(900, Math.max(100, Math.round(w / 100) * 100));
  const [fontFace, bold] = FONT_MAP[base][w] || FONT_MAP[base][400];
  return { fontFace, bold };
}

function rgbToHex(c) {
  // returns { hex:"RRGGBB", a:0..1 } or null for fully transparent / none
  if (!c || c === "transparent" || c === "none") return null;
  const m = c.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const p = m[1].split(",").map((s) => parseFloat(s.trim()));
  const a = p.length > 3 ? p[3] : 1;
  if (a === 0) return null;
  const hex = p.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
  return { hex: hex.toUpperCase(), a };
}

function applyTransform(text, cs) {
  switch (cs.textTransform) {
    case "uppercase": return text.toUpperCase();
    case "lowercase": return text.toLowerCase();
    case "capitalize": return text.replace(/\b\w/g, (m) => m.toUpperCase());
    default: return text;
  }
}

const px = (v) => parseFloat(v) || 0;
const isVisible = (cs) => cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) !== 0;

function hasBgImage(cs) { return cs.backgroundImage && cs.backgroundImage !== "none"; }

function hasDirectText(el) {
  for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
  return false;
}
// A ::before/::after that actually paints (a triangle arrowhead, a dot, a bar…).
function hasVisiblePseudo(el) {
  for (const pe of ["::before", "::after"]) {
    const p = getComputedStyle(el, pe);
    if (!p || p.content === "none" || p.content === "normal" || p.content === "") continue;
    const paints = rgbToHex(p.backgroundColor) || hasBgImage(p) ||
      px(p.borderTopWidth) || px(p.borderRightWidth) || px(p.borderBottomWidth) || px(p.borderLeftWidth) ||
      px(p.width) > 0 || px(p.height) > 0;
    if (paints) return true;
  }
  return false;
}
// Vertical anchor for text inside a flex/grid box (e.g. a centered label chip).
function valignOf(cs) {
  if (!/flex|grid/.test(cs.display)) return "top";
  const col = /column/.test(cs.flexDirection || "");
  const v = col ? (cs.justifyContent || "") : (cs.alignItems || "");
  if (/center/.test(v)) return "middle";
  if (/(flex-)?end/.test(v)) return "bottom";
  return "top";
}
// Horizontal align — flex/grid centering (justify/align) overrides text-align
// when the box itself centers its single text child.
function alignOf(cs) {
  const map = { start: "left", left: "left", end: "right", right: "right", center: "center", justify: "justify" };
  if (/flex|grid/.test(cs.display)) {
    const col = /column/.test(cs.flexDirection || "");
    const h = col ? (cs.alignItems || "") : (cs.justifyContent || "");
    if (/center/.test(h)) return "center";
    if (/(flex-)?end/.test(h)) return "right";
  }
  return map[cs.textAlign] || "left";
}
function hasTransform(cs) {
  return (cs.transform && cs.transform !== "none") || (cs.filter && cs.filter !== "none") ||
         (cs.rotate && cs.rotate !== "none" && cs.rotate !== "0deg");
}
function hasShadow(cs) { return cs.boxShadow && cs.boxShadow !== "none"; }
// A masked element (a colored box revealed through a logo PNG/SVG mask) — the
// visible result is the mask shape, NOT the box, so it must be rasterized.
function hasMask(cs) {
  return (cs.maskImage && cs.maskImage !== "none") ||
         (cs.webkitMaskImage && cs.webkitMaskImage !== "none");
}

function borderInfo(cs) {
  const sides = ["Top", "Right", "Bottom", "Left"].map((s) => ({
    w: px(cs[`border${s}Width`]),
    style: cs[`border${s}Style`],
    color: cs[`border${s}Color`],
  }));
  const visible = sides.filter((s) => s.w > 0 && s.style !== "none");
  if (!visible.length) return { any: false, uniform: true, sides };
  const first = visible[0];
  const uniform = visible.length === 4 &&
    sides.every((s) => s.w === first.w && s.style === first.style && s.color === first.color);
  return { any: true, uniform, sides, first };
}

function radiusInfo(cs, w, h) {
  const keys = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"];
  const raw = keys.map((k) => cs[k] || "0px");
  // Resolve each corner's horizontal radius to px (handles "50%").
  const r = raw.map((v) => {
    const first = String(v).split(" ")[0];
    return first.includes("%") ? (parseFloat(first) / 100) * (w || 0) : px(first);
  });
  const uniform = r.every((v) => Math.abs(v - r[0]) < 0.5);
  // A true ellipse/circle: every corner is a percentage ≥ 50% (border-radius:50%).
  const ellipse = raw.every((v) => String(v).includes("%") && parseFloat(v) >= 50);
  return { uniform, value: r[0], ellipse };
}

function isBox(cs) {
  return !!rgbToHex(cs.backgroundColor) || borderInfo(cs).any || hasBgImage(cs) || hasShadow(cs);
}
function isGraphicWhole(el, cs) {
  const tag = el.tagName;
  return tag === "IMG" || tag === "SVG" || tag === "svg" || tag === "CANVAS" || hasTransform(cs);
}
// An element that CLIPS overflowing graphic content (e.g. slide-91's 3D logo: an
// oversized <img> with negative offsets inside an overflow:hidden box, or a photo
// cropped by object-fit/overflow). Capture the clip box whole so the rasterized
// result is exactly what the browser paints — never the unclipped child.
function isClippedGraphic(el, cs) {
  const clipped = /hidden|clip/.test(cs.overflow) || /hidden|clip/.test(cs.overflowX) || /hidden|clip/.test(cs.overflowY);
  if (!clipped) return false;
  return !!el.querySelector("img, svg, canvas, picture, video");
}
// A box we must rasterize (bg only) because a native shape can't reproduce it.
function isPlate(cs, w, h) {
  if (hasBgImage(cs) || hasShadow(cs)) return true;
  const b = borderInfo(cs);
  if (b.any && !b.uniform) return true;
  const rad = radiusInfo(cs, w, h);
  if (!rad.uniform && !rad.ellipse) return true;
  return false;
}

let XID = 0;
function tag(el) { const id = String(++XID); el.setAttribute("data-xid", id); return id; }

// Collect the ordered inline text pieces of an element (text nodes + inline,
// non-box element children, recursively). Returns { pieces:[{node,cs}], consumed }
// or null when the element is NOT a pure inline-text flow (block/box/graphic child,
// or a flex/grid container with element children whose positions matter).
function inlinePieces(el) {
  const elCs = getComputedStyle(el);
  if (/flex|grid/.test(elCs.display) && el.childElementCount >= 1) return null;

  const pieces = [];
  const consumed = new Set();
  let sawText = false;

  function gather(node, cs) {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        if (child.nodeValue && child.nodeValue.trim()) sawText = true;
        if (child.nodeValue && child.nodeValue.length) pieces.push({ node: child, cs });
      } else if (child.nodeType === 1) {
        const ccs = getComputedStyle(child);
        if (!isVisible(ccs)) { consumed.add(child); continue; }
        const inline = /inline/.test(ccs.display);
        const boxOrGraphic = isBox(ccs) || isGraphicWhole(child, ccs) ||
          child.tagName === "IMG" || child.tagName === "SVG";
        if (inline && !boxOrGraphic) { consumed.add(child); if (gather(child, ccs) === false) return false; }
        else return false; // block / box / graphic child breaks pure-text flow
      }
    }
    return true;
  }
  if (gather(el, elCs) === false || !sawText) return null;
  return { pieces, consumed };
}

// Split a text node into the browser's actual visual lines: [{text, top}].
// Lines are grouped by a tolerance (half the line-box height) so sub-pixel
// baseline jitter — worst with large display sizes + negative letter-spacing —
// never creates a false break mid-word. `curTop` stays the line's first-char top.
function lineSplit(textNode) {
  const text = textNode.nodeValue;
  const range = document.createRange();
  const out = [];
  let cur = "", curTop = null, thr = 8;
  for (let i = 0; i < text.length; i++) {
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);
    const rects = range.getClientRects();
    if (!rects.length) { cur += text[i]; continue; }
    const top = rects[0].top;
    if (rects[0].height) thr = Math.max(4, rects[0].height * 0.5);
    if (curTop === null) curTop = top;
    if (top - curTop > thr && cur.trim()) { out.push({ text: cur, top: curTop }); cur = ""; curTop = top; }
    cur += text[i];
  }
  if (cur.trim() || (cur && out.length === 0)) out.push({ text: cur, top: curTop ?? 0 });
  return out;
}

// Build pptx text runs (with exact breakLine wrapping) from inline pieces.
function buildRuns(parsed, fontSizePx) {
  const single = parsed.pieces.filter((p) => p.node.nodeValue.trim()).length === 1;
  const thr = Math.max(4, (fontSizePx || 16) * 0.5);
  const runs = [];
  let lastTop = null;

  parsed.pieces.forEach((piece) => {
    const segs = lineSplit(piece.node);
    segs.forEach((seg, k) => {
      // Within the same text node, trim wrapped lines; across mixed pieces on one
      // line, preserve inter-run spacing.
      let text = seg.text.replace(/\s+/g, " ");
      if (single) text = text.trim();
      text = applyTransform(text, piece.cs);
      if (!text.length) return;
      const newLine = (lastTop !== null && seg.top - lastTop > thr);
      if ((newLine || (k > 0)) && runs.length) runs[runs.length - 1].breakLine = true;
      runs.push({ ...runStyle(piece.cs), text, breakLine: false });
      lastTop = seg.top;
    });
  });
  return runs.filter((r) => r.text && r.text.length);
}

function runStyle(cs) {
  const f = fontFor(cs);
  const col = rgbToHex(cs.color) || { hex: "000000" };
  const ls = cs.letterSpacing;
  const charSpacingPt = ls && ls !== "normal" ? px(ls) * 0.5 : 0;
  return {
    fontFace: f.fontFace,
    bold: f.bold,
    italic: cs.fontStyle === "italic" || cs.fontStyle === "oblique",
    sizePt: px(cs.fontSize) * 0.5,
    color: col.hex,
    charSpacingPt,
  };
}

function contentRect(el, cs, rootRect) {
  const r = el.getBoundingClientRect();
  const pt = px(cs.paddingTop), pr = px(cs.paddingRight),
        pb = px(cs.paddingBottom), pl = px(cs.paddingLeft);
  const bt = px(cs.borderTopWidth), br = px(cs.borderRightWidth),
        bb = px(cs.borderBottomWidth), bl = px(cs.borderLeftWidth);
  return {
    x: r.left - rootRect.left + pl + bl,
    y: r.top - rootRect.top + pt + bt,
    w: r.width - pl - pr - bl - br,
    h: r.height - pt - pb - bt - bb,
  };
}
function boxRect(el, rootRect) {
  const r = el.getBoundingClientRect();
  return { x: r.left - rootRect.left, y: r.top - rootRect.top, w: r.width, h: r.height };
}

function emitText(el, cs, rootRect, ops) {
  const parsed = inlinePieces(el);
  if (!parsed) return false;
  const runs = buildRuns(parsed, px(cs.fontSize));
  if (!runs.length) return false;

  const align = alignOf(cs);
  const fs = px(cs.fontSize);
  const lineHeightPx = px(cs.lineHeight) || fs * 1.2; // "normal" → ~1.2
  const isLi = el.tagName === "LI" || cs.display === "list-item";

  ops.push({
    kind: "text",
    rect: contentRect(el, cs, rootRect),
    align,
    valign: valignOf(cs),
    lineHeightPx,
    bullet: isLi || undefined,
    runs,
  });
  return parsed.consumed;
}

function emitSelfBackground(el, cs, rootRect, ops) {
  // Returns "stop" if the whole element was captured as a graphic (skip children).
  if (isGraphicWhole(el, cs) || isClippedGraphic(el, cs) || hasMask(cs)) {
    ops.push({ kind: "image", xid: tag(el), rect: boxRect(el, rootRect), plate: false });
    return "stop";
  }
  // Element with a painting ::before/::after (e.g. a CSS arrowhead) and no own
  // text → rasterize the whole element with a bleed so a pseudo that pokes
  // outside the box (arrowhead at bottom:-1px) isn't clipped away.
  if (hasVisiblePseudo(el) && !hasDirectText(el)) {
    const r = boxRect(el, rootRect), bleed = 16;
    const clip = { x: r.x - bleed, y: r.y - bleed, w: r.w + 2 * bleed, h: r.h + 2 * bleed };
    ops.push({ kind: "image", xid: tag(el), clip, rect: clip, plate: false });
    return "stop";
  }
  if (isBox(cs)) {
    const rect = boxRect(el, rootRect);
    if (isPlate(cs, rect.w, rect.h)) {
      ops.push({ kind: "image", xid: tag(el), rect, plate: true });
    } else {
      const fill = rgbToHex(cs.backgroundColor);
      const b = borderInfo(cs);
      const rad = radiusInfo(cs, rect.w, rect.h);
      const op = { kind: "shape", rect, radiusPx: rad.value || 0, oval: rad.ellipse };
      // Fold the element's own opacity into the fill alpha (e.g. translucent
      // device-screen icons that use opacity rather than an rgba() colour).
      const elemOpacity = parseFloat(cs.opacity);
      const o2 = Number.isFinite(elemOpacity) ? elemOpacity : 1;
      if (fill) { op.fill = fill.hex; op.fillAlpha = fill.a * o2; }
      if (b.any && b.uniform) {
        const lc = rgbToHex(b.first.color);
        if (lc) op.line = { color: lc.hex, widthPt: b.first.w * 0.5 };
      }
      ops.push(op);
    }
  }
  return null;
}

function childrenSorted(el) {
  const kids = Array.from(el.children).map((c, i) => ({ c, i, z: zIndex(c) }));
  kids.sort((a, b) => (a.z - b.z) || (a.i - b.i));
  return kids.map((k) => k.c);
}
function zIndex(el) {
  const z = getComputedStyle(el).zIndex;
  return z === "auto" ? 0 : (parseInt(z, 10) || 0);
}

function walk(el, rootRect, ops) {
  const cs = getComputedStyle(el);
  if (!isVisible(cs)) return;
  const r = el.getBoundingClientRect();
  if (r.width < 0.5 || r.height < 0.5) {
    // zero-size container may still hold positioned children — recurse only.
    for (const c of childrenSorted(el)) walk(c, rootRect, ops);
    return;
  }

  const stop = emitSelfBackground(el, cs, rootRect, ops);
  if (stop === "stop") return;

  const consumed = emitText(el, cs, rootRect, ops); // Set or false

  for (const c of childrenSorted(el)) {
    if (consumed && consumed.has(c)) continue;
    const ccs = getComputedStyle(c);
    if (!isVisible(ccs)) continue;
    walk(c, rootRect, ops);
  }
}

window.__extractSlide = function () {
  XID = 0;
  const stage = root.querySelector(".stage");
  if (!stage) return { error: "no stage mounted" };
  const rootRect = root.getBoundingClientRect();

  // A template may opt to export as a single flat image (diagram-heavy slides
  // with rotated vector connectors, e.g. 75–79) — pixel-exact, not editable.
  const tpl = getTemplate(stage.dataset.template);
  if (tpl && tpl.exportAsImage) return { imageOnly: true, width: rootRect.width, height: rootRect.height };

  const scs = getComputedStyle(stage);

  // Slide background → solid color, or a full-bleed image if the stage paints one.
  const bg = { color: (rgbToHex(scs.backgroundColor) || { hex: "FFFFFF" }).hex };
  if (hasBgImage(scs)) bg.image = true;

  const ops = [];
  for (const c of childrenSorted(stage)) walk(c, rootRect, ops);
  return { bg, ops, width: rootRect.width, height: rootRect.height };
};
