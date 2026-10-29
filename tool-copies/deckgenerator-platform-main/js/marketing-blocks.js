// =============================================================================
// Marketing blocks — the pieces the marketing/* templates share, from the Master
// Slides Figma section 110:41058. The family uses the same chrome as case study
// and pitch (Header, the "Presentation Name · Prepared for [Client] · © 2026"
// footer, PageHeader), so those blocks are re-exported; CSS is `.v2f-mk-*` at the
// end of css/primitives.css.
// =============================================================================
import { esc } from "./components.js";
import { metricCard } from "./metric-blocks.js";
import { icon } from "./icons.js";
import { plScene } from "./planning-blocks.js";
import { csHead } from "./case-study-blocks.js";
export { CS_FOOTER as MK_FOOTER, csFooter as mkFooter, csCol as mkCol,
  csImg as mkImg } from "./case-study-blocks.js";

/** Marketing PageHeader: eyebrow, title, subtitle with no gap between them, as in Figma. */
export const mkHead = (c, o = {}) => csHead(c, o).replace("class=\"v2f-cs-head", `class="v2f-cs-head${o.gap12 ? "" : " v2f-mk-g0"}`);

/** Brand photography placeholder for example content. */
export const mkPhoto = (i = 0) => plScene(i);

/** Filler for example copy. */
export const MK_LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
export const MK_SHORT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

/** The placeholder glyph the Figma frames use (Nagarro-Icons "person-checkmark", 80px). */
const PERSON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none"><path d="M14.5834 59.5356L24.1408 43.4668C24.1408 43.4668 34.865 28.4895 37.3016 19.7593C38.1959 16.5551 38.3965 12.6185 35.8822 10.4214C33.368 8.22434 29.0832 9.08703 26.955 11.6564C24.8269 14.2258 24.5629 17.9194 25.4031 21.1377C26.2434 24.356 28.0385 27.2329 29.7276 30.1033C36.3298 41.3269 43.2869 57.2907 43.2869 57.2907L66.4016 30.0452M34.7231 53.2844V65.0245H55.3653V44.3195H44.871" stroke="currentColor" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Brand icon on the round 5% tint the marketing cards use (80px in Figma). Any name from js/icons.js works. */
export const mkIcon = (name = "person-checkmark", size = 80) => {
  const svg = name === "person-checkmark" ? PERSON_CHECK : icon(name);
  return `<span class="v2f-mk-ic" style="width:${size}px;height:${size}px;">${svg}</span>`;
};

/** Card on the 5% tint (Figma Card): padding 40, radius 15. */
export const mkCard = (inner, { cls = "", style = "" } = {}) =>
  `<div class="v2f-mk-card ${cls}"${style ? ` style="${style}"` : ""}>${inner}</div>`;

/** Table-of-contents tile (Figma TableOfContentItem, card form). */
export const mkTocTile = (it = {}) => `
  <div class="v2f-mk-tocitem">
    <span class="l">${esc(it.label ?? "")}</span>
    <span class="p">${esc(it.pages ?? "")}</span>
  </div>`;

/** Table-of-contents row (Figma TableOfContentItem, list form). */
export const mkTocRow = (it = {}) => `
  <div class="v2f-mk-tocrow">
    <span class="l">${esc(it.label ?? "")}</span>
    <span class="p">${esc(it.pages ?? "")}</span>
  </div>`;

/**
 * Column PageHeader (Figma PageHeader in a split column): eyebrow, 60px title,
 * and a paragraph. `bottom` pins the paragraph to the foot of the column;
 * `maxWidth` narrows it to the width Figma wraps it at.
 */
export const mkPageHead = ({ caption, title, subtitle, body } = {}, { bottom = false, maxWidth, center = false } = {}) => `
  <div class="v2f-mk-ph${bottom ? " bottom" : ""}${center ? " center" : ""}">
    <div class="hd">
      ${caption ? `<p class="v2f-cs-cap">${esc(caption)}</p>` : ""}
      ${title ? `<p class="v2f-cs-h2">${esc(title)}</p>` : ""}
      ${subtitle ? `<p class="v2f-cs-h2 v2f-cs-muted" style="margin-top:-12px;">${esc(subtitle)}</p>` : ""}
    </div>
    ${body ? `<p class="par"${maxWidth ? ` style="max-width:${maxWidth}px;"` : ""}>${esc(body)}</p>` : ""}
  </div>`;

/** Small PageHeader (Figma 1254:42815): 36/44 title over a 28/36 light subtitle. */
export const mkSmallHead = ({ title, subtitle } = {}, { mid = false, lg = false, md = false } = {}) => `
  <div class="v2f-mk-sh${mid ? " mid" : ""}${lg ? " lg" : ""}${md ? " md" : ""} reveal">
    ${title ? `<p class="t">${esc(title)}</p>` : ""}
    ${subtitle ? `<p class="s">${esc(subtitle)}</p>` : ""}
  </div>`;

/** Title + body pair (Figma TextBlock, 24/32 over 20/28 at 60%). */
export const mkTextBlock = (t = {}) => `
  <div class="v2f-mk-tb">
    <p class="t">${esc(t.title ?? "")}</p>
    ${t.body ? `<p class="b">${esc(t.body)}</p>` : ""}
  </div>`;

/** Metric card (Figma MetricCard): label over a 60/68 value on the 5% tint. */
export const mkMetric = (m = {}, o = {}) => metricCard({ label: m.label, value: m.value }, { layout: "single", ...o });

/** Pill chip (Figma Badge): `tone` "dark" (fg100) or "grey" (fg50). */
export const mkChip = (t, tone = "dark") => `<span class="v2f-mk-chip ${tone}">${esc(t ?? "")}</span>`;

/** Chip groups: every category sits on its own line(s), its chips wrapping beside each other. */
export const mkChipGroups = (groups = [], tone = "dark") => `
  <div class="v2f-mk-cgroups">${groups.map((g) => `
    <div class="v2f-mk-cgroup${(g.tone || tone) === "grey" ? " stack" : ""}">${g.label ? `<p class="gl">${esc(g.label)}</p>` : ""}<div class="chips">${(g.chips || []).map((c) => mkChip(c, g.tone || tone)).join("")}</div></div>`).join("")}
  </div>`;

/**
 * Instagram-style post in a phone (Figma ScreenTitle / InstagramPost). Built at the
 * 404×832 size Figma uses for the phone and scaled with `scale` (0.8614 gives the
 * 348×716 version). `image` fills the post; the avatar uses the same image.
 */
const IG = (n) => `assets/marketing/ig/${n}.svg`;
export const mkPhonePost = (image, { scale = 1, user = "username" } = {}) => `
  <div class="v2f-mk-igbox" style="width:${Math.round(404 * scale)}px;height:${Math.round(832 * scale)}px;">
  <div class="v2f-mk-ig" style="transform:scale(${scale});">
    <div class="scr">
      <div class="post">
        <div class="bar"><img src="${IG("back")}" alt=""></div>
        <div class="usr"><span class="av"><span>${image ? `<img src="${esc(image)}" alt="">` : ""}</span></span><b>${esc(user)}</b><img src="${IG("options")}" alt=""></div>
        <div class="pic">${image ? `<img src="${esc(image)}" alt="">` : ""}</div>
        <div class="act"><span><img src="${IG("like")}" alt=""><img src="${IG("comment")}" alt=""><img src="${IG("share")}" alt=""></span>
          <i class="dots"><u class="a"></u><u></u><u></u><u></u><u></u></i><img src="${IG("save")}" alt=""></div>
      </div>
      <div class="tabbar"><div class="tabs"><img src="${IG("home")}" alt=""><img src="${IG("search")}" alt=""><img src="${IG("add")}" alt=""><img src="${IG("reels")}" alt=""><span class="me">${image ? `<img src="${esc(image)}" alt="">` : ""}</span></div><i class="hb"></i></div>
    </div>
    <img class="frm" src="assets/marketing/ig/mockup.png" alt="">
  </div></div>`;

/** Tick and cross icons (Figma Icons, 30px; scaled with `size`). */
export const mkTick = (size = 28) => `<svg viewBox="0 0 30 30" width="${size}" height="${size}" aria-hidden="true"><circle cx="15" cy="15" r="15" fill="#4FA13B"/><path d="M8.5 15.5l4.3 4.3 8.7-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const mkCross = (size = 28) => `<svg viewBox="0 0 30 30" width="${size}" height="${size}" aria-hidden="true"><circle cx="15" cy="15" r="15" fill="#D8352A"/><path d="M10 10l10 10M20 10L10 20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;

/** Instagram post as a card without the phone (Figma InstagramPost, 442×673). */
export const mkPostCard = (image, { user = "username" } = {}) => `
  <div class="v2f-mk-pc">
    <div class="usr"><span class="av"><span>${image ? `<img src="${esc(image)}" alt="">` : ""}</span></span><b>${esc(user)}</b><img src="assets/marketing/ig/options.svg" alt=""></div>
    <div class="pic">${image ? `<img src="${esc(image)}" alt="">` : ""}</div>
    <div class="act"><span><img src="assets/marketing/ig/like.svg" alt=""><img src="assets/marketing/ig/comment.svg" alt=""><img src="assets/marketing/ig/share.svg" alt=""></span>
      <i class="dots"><u class="a"></u><u></u><u></u><u></u><u></u></i><img src="assets/marketing/ig/save.svg" alt=""></div>
  </div>`;

/** Timeline of numbered steps (Figma Timeline2/Marketing): a bullet on a line, "01 Title", and a sentence. */
export const mkStepLine = (steps = []) => `
  <div class="v2f-mk-steps">${steps.map((x, i) => `
    <div class="sp"><div class="ln"><i></i></div><div class="tx"><p class="ti"><span>${String(i + 1).padStart(2, "0")}</span><span>${esc(x.title ?? "")}</span></p><p class="b">${esc(x.text ?? "")}</p></div></div>`).join("")}</div>`;
