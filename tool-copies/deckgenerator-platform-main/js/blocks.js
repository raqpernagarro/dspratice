// =============================================================================
// Shared content blocks for the v2 "core" templates — the repeated pieces used
// across content / cards / gallery families (photo tiles, image cards, grids,
// split text panels). Keeps template modules thin. CSS lives in primitives.css
// under the .v2f-* namespace.
// =============================================================================
import { esc } from "./components.js";
import { topBar } from "./frame.js";

/** Real brand photos (from assets/photography) for template examples. */
export const SAMPLE = [
  "assets/photography/20200717-084726_Nagarro_295.jpg",
  "assets/photography/20200717-085451_Nagarro_4227.jpg",
  "assets/photography/20200717-085631_Nagarro_327.jpg",
  "assets/photography/20200717-090532_Nagarro_4256.jpg",
  "assets/photography/20200717-090948_Nagarro_402.jpg",
  "assets/photography/20200717-091142_Nagarro_415.jpg",
  "assets/photography/20200717-091246_Nagarro_424.jpg",
  "assets/photography/20200717-091614_Nagarro_444.jpg",
  "assets/photography/20200717-091737_Nagarro_464.jpg",
  "assets/photography/20200717-092339_Nagarro_499.jpg",
  "assets/photography/20200717-093647_Nagarro_551.jpg",
  "assets/photography/20200717-094324_Nagarro_610.jpg",
  "assets/photography/20200717-100402_Nagarro_684.jpg",
  "assets/photography/20200717-100418_Nagarro_700.jpg",
  "assets/photography/20200717-100942_Nagarro_742.jpg",
  "assets/photography/20200717-101120_Nagarro_764.jpg",
  "assets/photography/20200717-101621_Nagarro_802_edit.jpg",
  "assets/photography/20200717-103815_Nagarro_958.jpg",
];

/** A plain rounded photo tile (grey placeholder when empty). */
export const tile = (src) => `<div class="v2f-tile">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

/** A card: photo on top, then title / subtitle / body beneath. */
export const imgCard = (c = {}) => `
  <article class="v2f-gcard">
    <div class="v2f-imgbox">${c.image ? `<img src="${esc(c.image)}" alt="">` : ""}</div>
    ${(c.title || c.subtitle || c.body) ? `<div class="v2f-ctext">
      <div class="v2f-ctitle">
        ${c.title != null ? `<p class="v2f-ct">${esc(c.title)}</p>` : ""}
        ${c.subtitle ? `<p class="v2f-cs">${esc(c.subtitle)}</p>` : ""}
      </div>
      ${c.body ? `<p class="v2f-cb">${esc(c.body)}</p>` : ""}
    </div>` : ""}
  </article>`;

/** A text-only card (no photo): title / subtitle / body. */
export const textCard = (c = {}) => `
  <article class="v2f-tcard">
    <div class="v2f-ctitle">
      ${c.title != null ? `<p class="v2f-ct">${esc(c.title)}</p>` : ""}
      ${c.subtitle ? `<p class="v2f-cs">${esc(c.subtitle)}</p>` : ""}
    </div>
    ${c.body ? `<p class="v2f-cb">${esc(c.body)}</p>` : ""}
  </article>`;

/** Grid of plain photo tiles in `cols` columns. */
export const photoGrid = (images = [], cols = 3, pad = true) =>
  `<div class="v2f-grid${pad ? " pt" : ""}" style="--cols:${cols}">${images.map(tile).join("")}</div>`;

/** Grid of image cards (photo + text) in `cols` columns. */
export const cardGrid = (cards = [], cols = 3, pad = true) =>
  `<div class="v2f-grid${pad ? " pt" : ""}" style="--cols:${cols}">${cards.map(imgCard).join("")}</div>`;

/** Grid of text-only cards in `cols` columns. */
export const textCardGrid = (cards = [], cols = 3, pad = true) =>
  `<div class="v2f-grid${pad ? " pt" : ""}" style="--cols:${cols}">${cards.map(textCard).join("")}</div>`;

/**
 * The left text panel of a "split" slide: the top bar (logo+meta) at the top,
 * and a small heading (subtitle + title) + body paragraph at the bottom.
 */
export const splitTextPanel = ({ meta, subtitle, title, body } = {}) => `
  <div class="v2f-split-text">
    ${topBar(meta)}
    <div class="v2f-split-copy">
      <div>
        ${subtitle ? `<p class="v2f-h6">${esc(subtitle)}</p>` : ""}
        ${title ? `<p class="v2f-h4">${esc(title)}</p>` : ""}
      </div>
      ${body ? `<p class="v2f-para">${esc(body)}</p>` : ""}
    </div>
  </div>`;

/** A photo card with a label + number badge overlaid on the image. */
export const overlayCard = (c = {}, i = 0) => `
  <div class="v2f-ocard">
    ${c.image ? `<img src="${esc(c.image)}" alt="">` : ""}
    ${c.label != null ? `<span class="lbl">${esc(c.label)}</span>` : ""}
    <span class="badge">${esc(c.number ?? String(i + 1))}</span>
  </div>`;

/** A tinted text card: category label, title, body. */
export const tintCard = (c = {}) => `
  <div class="v2f-tintcard">
    ${c.category != null ? `<p class="cat">${esc(c.category)}</p>` : ""}
    ${c.title != null ? `<p class="ttl">${esc(c.title)}</p>` : ""}
    ${c.body ? `<p class="bdy">${esc(c.body)}</p>` : ""}
  </div>`;

/** Grid of overlay cards / tinted cards in `cols` columns. */
export const overlayGrid = (cards = [], cols = 3, pad = true) =>
  `<div class="v2f-grid${pad ? " pt" : ""}" style="--cols:${cols}">${cards.map(overlayCard).join("")}</div>`;
export const tintGrid = (cards = [], cols = 2, pad = false) =>
  `<div class="v2f-grid${pad ? " pt" : ""}" style="--cols:${cols}">${cards.map(tintCard).join("")}</div>`;

/**
 * A staggered multi-column photo wall (Figma grid-10/12/16): `cols` vertical
 * stacks of fixed-aspect tiles, each column translated by a different Y offset
 * so the seams don't line up, clipped by the container. `aspect` is the tile
 * ratio (e.g. "442 / 588"); `offsets` is a per-column translateY in px.
 */
export const staggerWall = (images = [], { cols = 2, aspect = "442 / 588", offsets = [] } = {}) => {
  const per = Math.ceil((images.length || 1) / cols);
  const columns = Array.from({ length: cols }, (_, i) => images.slice(i * per, i * per + per));
  const html = columns
    .map((imgs, i) => `<div class="v2f-pf-stagcol" style="transform:translateY(${offsets[i] ?? 0}px)">${imgs.map(tile).join("")}</div>`)
    .join("");
  return `<div class="v2f-pf-stagger" style="--sc:${cols};--sa:${aspect}">${html}</div>`;
};

/** A vertical stack of photo rows (each row = `perRow` tiles) for split photo panels. */
export const photoPanel = (images = [], perRow = 2) => {
  const rows = [];
  for (let i = 0; i < images.length; i += perRow) {
    rows.push(`<div class="v2f-prow">${images.slice(i, i + perRow).map(tile).join("")}</div>`);
  }
  return `<div class="v2f-split-photos">${rows.join("")}</div>`;
};

/**
 * Core gallery wall (core/gallery-wall-card, Figma 109:5234, and
 * core/gallery-wall-focus, Figma 109:5215): four full-height columns of three 442×488
 * photos, each column shifted up by its own amount so the seams never line up,
 * bleeding off the top and bottom of the slide. No chrome.
 *   card  — { title, body }: the second tile of column 2 becomes a dark text card
 *   focus — true: every tile but that one is faded to 25%, so it stands out
 * Fewer than 12 images repeat in order, so the wall is always full.
 */
const WALL_OFFSETS = [-84, -256, -136, -256];
export const coreWall = (images = [], { card, focus = false } = {}) => {
  const pool = images.length ? images : [null];
  let n = 0;
  const cols = WALL_OFFSETS.map((top, c) => {
    const tiles = [0, 1, 2].map((r) => {
      const hero = c === 1 && r === 1;
      if (hero && card) {
        return `<div class="v2f-cwall-tile v2f-cwall-card">
          ${card.title ? `<p class="ttl">${esc(card.title)}</p>` : ""}
          ${card.body ? `<p class="bdy">${esc(card.body)}</p>` : ""}
        </div>`;
      }
      const src = pool[n++ % pool.length];
      return `<div class="v2f-cwall-tile${focus && !hero ? " dim" : ""}">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;
    }).join("");
    return `<div class="v2f-cwall-col" style="left:${40 + c * 466}px;top:${40 + top}px">${tiles}</div>`;
  }).join("");
  return `<div class="v2f-cwall reveal">${cols}</div>`;
};

/**
 * Text column of the core split galleries: top bar, then subtitle + title and
 * the copy pinned to the bottom (Figma PageHeader, gap 40), and optional
 * dark badges under it. `width` is the Figma column width.
 */
export const coreSplitText = ({ meta, logoOnly = false, subtitle, title, body, small = false, badges = [] } = {}, width = 640) => {
  const paras = Array.isArray(body) ? body : String(body ?? "").split(/\n\s*\n/);
  return `
  <div class="v2f-csplit-text" style="width:${width}px">
    ${topBar(meta, { logoOnly })}
    <div class="v2f-csplit-head">
      <div>
        ${subtitle ? `<p class="v2f-h5m">${esc(subtitle)}</p>` : ""}
        ${title ? `<p class="v2f-h4">${esc(title)}</p>` : ""}
      </div>
      <div class="v2f-csplit-copy${small ? " sm" : ""}">${paras.filter((p) => p && p.trim()).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    </div>
    ${badges.length ? `<div class="v2f-csplit-badges">${badges.map((b) => `<span>${esc(b)}</span>`).join("")}</div>` : ""}
  </div>`;
};

/**
 * Vertical photo + text card (Figma TextBlockWithImage/Core, vertical): a
 * photo that fills the card's height and a title / subtitle / body block,
 * photo first (gap 32) or text first (gap 40).
 */
export const vCard = (c = {}, { textFirst = false } = {}) => {
  const txt = `
    <div class="tx">
      <div>${c.title ? `<p class="t">${esc(c.title)}</p>` : ""}${c.subtitle ? `<p class="s">${esc(c.subtitle)}</p>` : ""}</div>
      ${c.body ? `<p class="b">${esc(c.body)}</p>` : ""}
    </div>`;
  const ph = `<div class="ph">${c.image ? `<img src="${esc(c.image)}" alt="">` : ""}</div>`;
  return `<div class="v2f-vcard${textFirst ? " tf" : ""}">${textFirst ? txt + ph : ph + txt}</div>`;
};

/**
 * Quote text with highlighted phrases: **phrase** is drawn in the full text
 * colour, the rest muted (Figma TextQuote). Escapes everything else.
 */
export const quoteText = (q = "") =>
  esc(String(q)).replace(/\*\*(.+?)\*\*/g, "<em>$1</em>");

/** Figma TextQuote: the quote at 60/68 in quote marks, an attribution under it. */
export const textQuote = (s = {}, { width } = {}) => `
  <div class="v2f-tq"${width ? ` style="width:${width}px"` : ""}>
    <p class="q">“${quoteText(s.quote ?? "")}”</p>
    ${s.attribution ? `<p class="by">– ${esc(s.attribution)}</p>` : ""}
  </div>`;

/** Name / title / company lines at the bottom of a quote slide. */
export const quoteWho = (s = {}) => {
  const lines = [s.name, s.title, s.company].filter(Boolean);
  return lines.length ? `<div class="v2f-tq-who">${lines.map((l) => `<p>${esc(l)}</p>`).join("")}</div>` : "";
};
