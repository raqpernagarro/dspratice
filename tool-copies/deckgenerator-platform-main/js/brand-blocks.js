// =============================================================================
// Brand-guidelines blocks — the pieces the brand-guidelines/* templates share,
// from the Master Slides Figma section 110:41055. The family uses the case-study
// chrome (Header, the "Presentation Name · Prepared for [Client] · © 2026"
// footer). Most frames are a 442px column (logo-only header, title, paragraph)
// beside a 1374px tinted panel. CSS is `.v2f-br-*` at the end of
// css/primitives.css.
// =============================================================================
import { esc } from "./components.js";
import { topBar } from "./frame.js";
import { brandLogoArt, isBrandLogo } from "./brand-logo.js";
export { CS_FOOTER as BR_FOOTER, csFooter as brFooter, csPhoto as brPhoto } from "./case-study-blocks.js";

export const BR_LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
export const BR_SHORT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

/** Example logo artwork from the Figma frames (square PNGs, shown with object-fit: cover). */
const L = (n) => `assets/brand/${n}.png`;
export const BR_LOGOS = {
  plain: L("tms-plain"), dark: L("tms-dark"), light: L("tms-light"), grey: L("tms-grey"),
  nameDark: L("name-dark"), nameLight: L("name-light"), nameGrey: L("name-grey"),
};

const img = (src) => (src ? `<img src="${esc(src)}" alt="">` : "");

/** Image or logo box (Figma {{logo}} / {{hero-image}} / Image): radius 15, cover-fit, tinted when empty. */
export const brImg = (src, { cls = "", style = "" } = {}) =>
  `<div class="v2f-br-img ${cls}"${style ? ` style="${style}"` : ""}>${img(src)}</div>`;

/**
 * Logo on a tile (Figma Brand-logo): the artwork centred and contained in a
 * box the size of the Figma "Logo Nagarro" instance (`box` = [width %, height %]
 * of the tile). `logo` is an image URL or a built-in keyword (nagarro:horizontal
 * | vertical | neutral | mark, see js/brand-logo.js). `tile` sets the ground:
 * dark (#010716, white wordmark), light (white), tint (fg/5) or grey (fg/10).
 * A plain URL with no tile keeps the older behaviour: the artwork fills the box.
 */
export const brLogo = (logo, { tile, cls = "", box } = {}) => {
  if (!tile && !isBrandLogo(logo)) return brImg(logo, { cls });
  const size = box ? ` style="--lw:${box[0]}%;--lh:${box[1]}%;"` : "";
  return `<div class="v2f-br-img v2f-br-logo${tile ? ` t-${esc(tile)}` : ""} ${cls}"${size}>${brandLogoArt(logo, { cls: "art" })}</div>`;
};

/**
 * The 442px left column (Figma Col: logo-only Header + PageHeader): a 36/44
 * title and a 20/28 paragraph at 60% pinned to the foot. `low` drops the title
 * down to sit just above the paragraph (most frames); otherwise it stays at the
 * top. `caption` adds the small eyebrow and `subtitle` a muted second line.
 */
export const brCol = (meta, { caption, title, subtitle, body } = {}, { low = true, width = 442 } = {}) => `
  <div class="v2f-br-col" style="flex:0 0 ${width}px;">
    ${topBar(meta, { logoOnly: true })}
    <div class="v2f-br-ph${low ? " low" : ""}">
      <div class="hd">${caption ? `<p class="c">${esc(caption)}</p>` : ""}${title ? `<p class="t">${esc(title)}</p>` : ""}${subtitle ? `<p class="t m">${esc(subtitle)}</p>` : ""}</div>
      ${body ? `<p class="par">${esc(body)}</p>` : ""}
    </div>
  </div>`;

/** Tinted panel (Figma Col on fg/5, radius 15). */
export const brPanel = (inner, { cls = "", style = "" } = {}) =>
  `<div class="v2f-br-panel ${cls}"${style ? ` style="${style}"` : ""}>${inner}</div>`;

/** The common two-column body: left column + right content, 24px apart, above the footer. */
export const brSplit = (left, right) => `<div class="v2f-cs-cols reveal" style="gap:24px;">${left}${right}</div>`;

/** Label + description (Figma TextBlock, 20/28 over 20/28 at 50%, 32 apart). */
export const brTextBlock = (t = {}) => `
  <div class="v2f-br-tb"><p>${esc(t.title ?? "")}</p>${t.text ? `<p class="m">${esc(t.text)}</p>` : ""}</div>`;

/** Table-of-contents row (Figma TableOfContentItem): 36/44 title in 800px, optional 16/24 note, 24/32 page range. */
export const brTocRow = (it = {}) => `
  <div class="v2f-br-toc"><p class="t">${esc(it.label ?? "")}</p><p class="d">${esc(it.note ?? "")}</p><p class="p">${esc(it.pages ?? "")}</p></div>`;

/** Chapter heading (Figma TableOfContentItem Type4): 48/56 title with the chapter number muted at the right. */
export const brChapter = (title, num) => `
  <div class="v2f-br-chap"><p>${esc(title ?? "")}</p>${num ? `<p class="n">${esc(num)}</p>` : ""}</div>`;

/**
 * Section heading over full-width content (Figma PageHeader): 20/28 caption
 * over a title (36/44, or 48/56 with `big`), an optional muted subtitle and a
 * 20/28 paragraph. `gap12` puts 12px between caption and title, as the
 * colour pages do.
 */
export const brHead = ({ caption, title, subtitle, body } = {}, { big = false, gap12 = false, maxWidth = 640 } = {}) => `
  <div class="v2f-br-head${big ? " big" : ""}${gap12 ? " g12" : ""}">
    <div class="hd">${caption ? `<p class="c">${esc(caption)}</p>` : ""}<div>${title ? `<p class="t">${esc(title)}</p>` : ""}${subtitle ? `<p class="t m">${esc(subtitle)}</p>` : ""}</div></div>
    ${body ? `<p class="par" style="max-width:${maxWidth}px;">${esc(body)}</p>` : ""}
  </div>`;

/** Text colour for a swatch: whichever of white or near-black (#010716)
 *  has the higher WCAG contrast on it. A brightness cut-off used to put
 *  white on mid-tones like sky blue (#76AEEA) at about 2:1. */
export const brInk = (hex = "") => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return "light";
  const n = parseInt(m[1], 16);
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  const onWhite = 1.05 / (L + 0.05), onInk = (L + 0.05) / (0.0024 + 0.05);
  return onInk > onWhite ? "dark" : "light";
};

/**
 * Colour swatch (Figma ColorPalette): the colour fills the tile and its name,
 * RGB and HEX sit at the bottom left. `color` is any CSS colour (defaults to
 * the hex); `ink` forces "dark" or "light" text.
 */
export const brSwatch = (c = {}, { cls = "", style = "" } = {}) => {
  const ink = c.ink || brInk(c.hex);
  return `<div class="v2f-br-sw ${ink} ${cls}" style="background:${esc(c.color || c.hex || "#ccc")};${style}">
    <p>${esc(c.name ?? "")}</p>${c.rgb ? `<p class="m">${esc(c.rgb)}</p>` : ""}${c.hex ? `<p class="m">${esc(c.hex)}</p>` : ""}</div>`;
};

/** Round swatch with its HEX under it (Figma ColorPalette, circle form). */
export const brDot = (c = {}) => `
  <div class="v2f-br-dot"><i style="background:${esc(c.color || c.hex || "#ccc")};"${brInk(c.hex) === "dark" ? ' class="v2f-br-hair"' : ""}></i><p>${esc(c.hex ?? "")}</p></div>`;

/** Colour pairing (Figma ColorPairing): "AA" in the text colour on a round background. */
export const brPair = (p = {}) => `
  <div class="v2f-br-pair${p.edge ? " v2f-br-hair" : ""}" style="background:${esc(p.bg || "#010716")};color:${esc(p.fg || "#fff")};"><span>${esc(p.text ?? "AA")}</span></div>`;

const CROSS = "assets/brand/cross.svg";

/**
 * "Things to avoid" tile (Figma Avoid): a red cross and a 20/28 caption over an
 * example image. `framed` draws the white tile with a hairline border and a
 * diagonal strike the logo examples use.
 */
export const brAvoid = (a = {}, { framed = false } = {}) => `
  <div class="v2f-br-avoid">
    <div class="cap"><img src="${CROSS}" alt=""><p>${esc(a.label ?? "")}</p></div>
    <div class="box${framed ? " framed" : ""}">${a.image ? `<img class="im" src="${esc(a.image)}" alt="">` : ""}${framed ? '<img class="ln" src="assets/brand/line-a.svg" alt="">' : ""}</div>
  </div>`;

/** Phone mockup (Figma MockupPhone): the image on the screen under the device frame; sized by height. */
export const brPhone = (image, { h = 568, shadow = false } = {}) => `
  <div class="v2f-br-phone${shadow ? " sh" : ""}" style="height:${h}px;"><div class="scr">${img(image)}</div><img class="frm" src="assets/brand/mockup-phone.png" alt=""></div>`;

/** Tablet mockup (Figma MockupTab): sized by width. */
export const brTab = (image, { w = 840 } = {}) => `
  <div class="v2f-br-tab" style="width:${w}px;"><div class="scr" style="border-radius:${Math.round(w * 0.06)}px;">${img(image)}</div><img class="frm" src="assets/brand/mockup-tab.png" alt=""></div>`;

/** Watch mockup (Figma MockupWatch, 340×544). */
export const brWatch = (image) => `
  <div class="v2f-br-watch"><div class="scr">${img(image)}</div><img class="frm" src="assets/brand/mockup-watch.png" alt=""></div>`;

/** Logo placement guide (Figma LogoPositioning): logos in the corners, or centred on the vertical axis. */
export const brPlace = (logo, mode = "corners") => {
  const L = (cls) => `<span class="lg ${cls}">${brandLogoArt(logo || "nagarro:horizontal")}</span>`;
  const lines = mode === "center"
    ? '<i class="h t"></i><i class="h m"></i><i class="h b"></i><i class="v l1"></i><i class="v l3"></i><i class="v c"></i><i class="v r3"></i><i class="v r1"></i>'
    : '<i class="h t"></i><i class="h b"></i><i class="v l1"></i><i class="v l2"></i><i class="v l3"></i><i class="v c"></i><i class="v r3"></i><i class="v r2"></i><i class="v r1"></i>';
  const logos = mode === "center" ? L("big mid") + L("sm tc") + L("sm bc") : L("big tl") + L("big br") + L("sm bl") + L("sm tr");
  return `<div class="v2f-br-place">${lines}${logos}</div>`;
};

/** The example palettes from the Figma colour pages. */
export const BR_PRIMARY = [
  { name: "White", rgb: "R255 G255 B255", hex: "#FFFFFF" },
  { name: "Grey", rgb: "R142 G144 B148", hex: "#8E9094" },
  { name: "Black", rgb: "R26 G26 B28", hex: "#1A1A1C", color: "#010716" },
];
export const BR_SECONDARY = [
  { name: "Green", rgb: "R100 G159 B73", hex: "#649F49" },
  { name: "Blue", rgb: "R118 G174 B234", hex: "#76AEEA" },
  { name: "Red", rgb: "R201 G75 B56", hex: "#C94B38" },
  { name: "Yellow", rgb: "R216 G185 B88", hex: "#D8B958" },
  { name: "Pink", rgb: "R219 G121 B150", hex: "#DB7996" },
  { name: "Orange", rgb: "R206 G140 B70", hex: "#CE8C46" },
];

/**
 * Photo tree: `{ d: "row" | "col", items, f? }` containers and `{ f? }` leaf
 * images, `f` being the flex weight (Figma px). Leaves take images from `imgs`
 * in reading order. Gaps are 24px, every image radius 15.
 */
export const brTree = (node, imgs = [], k = { n: 0 }) => {
  const f = `flex:${node.f ?? 1} 1 0;`;
  if (node.items) return `<div class="v2f-br-tree ${node.d === "col" ? "col" : "row"}" style="${f}">${node.items.map((c) => brTree(c, imgs, k)).join("")}</div>`;
  return brImg(imgs[k.n++], { cls: "leaf", style: f });
};

/** Text with `*emphasis*`: emphasised runs in the full text colour, the rest muted. */
export const brRich = (t = "") => esc(t).replace(/\*([^*]+)\*/g, '<b>$1</b>');

/** Round tick / cross icon (Figma Icons, 28px). */
export const brMark = (ok = true) => `<img class="v2f-br-mark" src="assets/brand/${ok ? "tick" : "cross"}.svg" alt="">`;
