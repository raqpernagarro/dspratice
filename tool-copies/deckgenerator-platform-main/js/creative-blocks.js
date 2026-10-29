// Shared blocks for the Creative "mood board" layouts: a left text column (eyebrow /
// heading / subtitle + body, bottom-aligned) and a recursive photo tree that mirrors
// the Figma masonry (rows and columns of image cells, arbitrarily nested). Photos
// default to the Nagarro photography set.
import { esc } from "./components.js";
import { plScene } from "./planning-blocks.js";
import { NAGARRO_LOGO } from "./logo.js";

export const MOOD_BODY = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
];

/** Left text column — eyebrow, heading, subtitle, then body; bottom-aligned. */
export const moodLeft = (s = {}) => `
  <div class="v2f-cr-mb-left">
    <div class="v2f-cr-mb-text">
      <div class="v2f-cr-mb-head">
        ${s.caption !== "" ? `<p class="v2f-cr-mb-eyebrow">${esc(s.caption ?? "Art Direction")}</p>` : ""}
        <p class="v2f-cr-mb-title">${esc(s.title ?? "Photography")}</p>
        ${s.subtitle !== "" ? `<p class="v2f-cr-mb-sub">${esc(s.subtitle ?? "Mood")}</p>` : ""}
      </div>
      <div class="v2f-cr-mb-body">${(s.body ?? MOOD_BODY).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    </div>
  </div>`;

/**
 * A bold iPhone-style device outline (412×844) with a transparent screen so the photo
 * behind shows through, floated over a cell and clipped by it. `y` = the vertical offset
 * (Figma px) of the phone's top within the cell; negative values let it peek from an edge.
 */
export const crPhone = (y = 40) => `
  <svg class="v2f-cr-phone" style="top:${y}px" viewBox="0 0 412 844" width="412" height="844"
       fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="5" y="5" width="402" height="834" rx="62" ry="62" stroke="#010716" stroke-width="10"/>
    <rect x="150" y="26" width="112" height="30" rx="15" fill="#010716"/>
    <circle cx="250" cy="41" r="5.5" fill="#161b2b"/>
  </svg>`;

/**
 * Recursive photo tree. A node is either a container (`{ dir, items, f? }`, dir =
 * "row" | "column") or a leaf photo (`{ f?, i?, src?, phone? }`). `f` is the node's flex
 * weight among its siblings (defaults to 1); leaf photos use the Figma pixel size so
 * proportions match. `phone` (number = top-offset px, or `true` for the default 40) floats
 * a device mockup over the cell. `photo(i)` resolves a photo src from an index.
 */
export const crTree = (node, photo = plScene) => {
  const f = `flex:${node.f ?? 1} 1 0;`;
  if (node.items) {
    return `<div class="v2f-cr-box" style="${f}flex-direction:${node.dir || "row"};">` +
      node.items.map((n) => crTree(n, photo)).join("") + `</div>`;
  }
  if (node.t) {
    const t = node.t === true ? {} : node.t;
    return `<div class="v2f-cr-textcell" style="${f}"><div class="v2f-cr-tc">
      <p class="v2f-cr-tc-title">${esc(t.title ?? "Lorem ipsum")}</p>
      <p class="v2f-cr-tc-body">${esc(t.body ?? MOOD_BODY[0])}</p>
    </div></div>`;
  }
  const overlay = node.phone != null && node.phone !== false
    ? crPhone(node.phone === true ? 40 : node.phone) : "";
  return `<div class="v2f-cr-cell" style="${f}"><img src="${esc(node.src || photo(node.i ?? 0))}" alt="">${overlay}</div>`;
};

/**
 * A row of four "feature" cards (title + body over an image), used for the imagery/
 * principles slides. `active` highlights one card (0-based) and mutes the rest into a
 * progressive-focus sequence; pass -1 to show all cards equally.
 */
export const crFeatureCards = (cards, active = -1, photo = plScene) => `
  <div class="v2f-cr-fcards reveal">
    ${cards.map((c, k) => `<div class="v2f-cr-fcard${active >= 0 && k !== active ? " is-muted" : ""}">
      <div class="v2f-cr-fcard-head">
        <p class="v2f-cr-fcard-title">${esc(c.title ?? "Principle " + (k + 1))}</p>
        <p class="v2f-cr-fcard-body">${esc(c.body ?? "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.")}</p>
      </div>
      <div class="v2f-cr-fcard-img"><img src="${esc(c.src || photo(c.i ?? k))}" alt=""></div>
    </div>`).join("")}
  </div>`;

/** The mood-board shell: left text column + the photo tree on the right. */
export const moodBoard = (s, tree, { topBar, footerBar }) => `
  <div class="v2f-root">
    ${topBar(s.meta)}
    <div class="v2f-cr-mb reveal">
      ${moodLeft(s)}
      <div class="v2f-cr-mb-grid">${crTree(tree)}</div>
    </div>
    ${footerBar(s.footer)}
  </div>`;

/** Full-bleed shell: just the photo tree filling the whole content area. */
export const fullBoard = (s, tree, { topBar, footerBar }) => `
  <div class="v2f-root">
    ${topBar(s.meta)}
    <div class="v2f-cr-full reveal">${crTree(tree)}</div>
    ${footerBar(s.footer)}
  </div>`;

/**
 * A column-width brand header (Nagarro logo + studio/name/page over a hairline) above a
 * padded product card — a centered image floating on a light rounded panel. Used as one
 * half of the product-split layouts. `ci` = the card image's photo index.
 */
export const crCardCol = (s = {}, ci = 0, photo = plScene) => {
  const m = s.meta || {};
  return `
  <div class="v2f-cr-cardcol">
    <div class="v2f-cr-cardhead">
      <span class="v2f-logo">${NAGARRO_LOGO}</span>
      <div class="v2f-meta">
        <span>${esc(m.studio ?? "Product Studio")}</span>
        <i></i><span>${esc(m.name ?? "Presentation Name")}</span>
        ${m.page != null && m.page !== "" ? `<i></i><span>${esc(m.page)}</span>` : ""}
      </div>
    </div>
    <div class="v2f-cr-card"><img src="${esc(photo(ci))}" alt=""></div>
  </div>`;
};

/** Product-split shell: a photo column (from a crTree) beside a crCardCol, no top bar. */
export const productSplit = (s, photoTree, cardIndex, { footerBar }, cardSide = "right") => {
  const card = crCardCol(s, cardIndex);
  const photo = crTree(photoTree);
  return `
  <div class="v2f-root">
    <div class="v2f-cr-ps reveal">${cardSide === "left" ? card + photo : photo + card}</div>
    ${footerBar(s.footer)}
  </div>`;
};

/** A pair of large photo panels, each with a big centered white label. `active` (0/1)
 *  highlights one panel and mutes the other; -1 shows both equally. */
export const crLabeledPair = (labels, active = -1, photo = plScene) => `
  <div class="v2f-cr-lpair reveal">
    ${[0, 1].map((k) => `<div class="v2f-cr-lpanel${active >= 0 && k !== active ? " is-muted" : ""}">
      <img src="${esc(photo(k))}" alt=""><span class="v2f-cr-llabel">${esc(labels[k] ?? "")}</span>
    </div>`).join("")}
  </div>`;

/** One photo with numbered annotation pins. `pins` = [{ x, y, n }] with x/y in PERCENT. */
export const crPinImg = (i, pins = [], photo = plScene) => `
  <div class="v2f-cr-pimg">
    <img src="${esc(photo(i))}" alt="">
    ${pins.map((p) => `<span class="v2f-cr-pin" style="left:${p.x}%;top:${p.y}%;">${esc(p.n)}</span>`).join("")}
  </div>`;
export const crPinCol = (kids) => `<div class="v2f-cr-pcol">${kids.join("")}</div>`;
export const crPinRow = (kids) => `<div class="v2f-cr-prow">${kids.join("")}</div>`;

/** A numbered legend list — dark badge + body per item. `items` = [{ n, body }]. */
export const crNumList = (items) => `
  <ol class="v2f-cr-numlist">
    ${items.map((it, k) => `<li class="v2f-cr-nli">
      <span class="v2f-cr-nb">${esc(it.n ?? k + 1)}</span>
      <p class="v2f-cr-nbody">${esc(it.body ?? "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.")}</p>
    </li>`).join("")}
  </ol>`;

/**
 * Annotated-photo shell: a pinned image column (any HTML from crPinImg/crPinCol/crPinRow)
 * beside a text column with its own brand header, a page header, and a numbered legend.
 * `leftW`/`rightW` are the Figma column widths used as flex weights. No top bar (the image
 * bleeds to the top like the product splits).
 */
export const crAnnotated = (s, { leftW, rightW, left, head, items }, { pageHeader, footerBar }) => {
  const m = s.meta || {};
  return `
  <div class="v2f-root">
    <div class="v2f-cr-anno reveal">
      <div class="v2f-cr-anno-img" style="flex:${leftW} 1 0;">${left}</div>
      <div class="v2f-cr-anno-txt" style="flex:${rightW} 1 0;">
        <div class="v2f-cr-cardhead">
          <span class="v2f-logo">${NAGARRO_LOGO}</span>
          <div class="v2f-meta">
            <span>${esc(m.studio ?? "Product Studio")}</span>
            <i></i><span>${esc(m.name ?? "Presentation Name")}</span>
            ${m.page != null && m.page !== "" ? `<i></i><span>${esc(m.page)}</span>` : ""}
          </div>
        </div>
        <div class="v2f-cr-anno-copy">
          ${pageHeader(head)}
          ${crNumList(items)}
        </div>
      </div>
    </div>
    ${footerBar(s.footer)}
  </div>`;
};

/**
 * Full-bleed staggered "photo wall": absolutely-positioned columns whose portrait images
 * are taller than the frame and vertically offset per column, so the wall bleeds off the
 * top and bottom edges. `cols` = [{ x, y, w, h, imgs:[{ y, h, i }] }] straight from Figma
 * coords (no chrome). The root clips everything to the 1920×1080 stage.
 */
export const crWall = (cols, photo = plScene) => `
  <div class="v2f-cr-wallroot reveal">
    ${cols.map((c) => `<div class="v2f-cr-wcol" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;">` +
      c.imgs.map((g) => `<div class="v2f-cr-wimg" style="top:${g.y}px;height:${g.h}px;"><img src="${esc(photo(g.i))}" alt=""></div>`).join("") +
      `</div>`).join("")}
  </div>`;
