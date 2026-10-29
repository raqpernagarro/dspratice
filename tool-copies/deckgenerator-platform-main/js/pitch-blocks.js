// =============================================================================
// Pitch blocks — the pieces the pitch/* templates share, from the Master Slides
// Figma section 110:41059. The family uses the same chrome as case study
// (Header, the "Presentation Name · Prepared for [Client] · © 2026" footer,
// PageHeader), so those blocks are re-exported; CSS is `.v2f-pt-*` at the end
// of css/primitives.css.
// =============================================================================
import { esc } from "./components.js";
import { metricCard } from "./metric-blocks.js";
import { plScene } from "./planning-blocks.js";
import { csHead } from "./case-study-blocks.js";
export { CS_FOOTER as PT_FOOTER, csFooter as ptFooter, csCol as ptCol,
  csImg as ptImg, csClient as ptClient } from "./case-study-blocks.js";

/** Pitch PageHeader: eyebrow, title, subtitle with the 12px gap the pitch frames use. */
export const ptHead = (c, o = {}) => csHead(c, { gap12: true, ...o });

/** Brand photography placeholder for example content. */
export const ptPhoto = (i = 0) => plScene(i);

/** `**phrase**` → <b>phrase</b> after escaping; used for the two-tone metrics. */
export const ptTwoTone = (text = "") => esc(String(text));

/**
 * Table-of-contents row (Figma TableOfContentItem): a 100/108 number at 30%
 * opacity and a 48/56 label. `box` draws the list on the tinted panel.
 */
export const ptTocItem = (it = {}, i = 0) => `
  <div class="v2f-pt-toc">
    <span class="n">${esc(it.number ?? String(i + 1).padStart(2, "0"))}</span>
    <span class="l">${esc(it.label ?? "")}</span>
  </div>`;

/** Tone → class for the tinted metric / phase cards (fg at 25 / 50 / 75 / 100%). */
const TONES = ["t25", "t75", "t50", "t60", "t75", "t25"];
export const ptTone = (i = 0, tone) => tone || TONES[i % TONES.length];

/**
 * Metric card (Figma MetricCard, Layout=Statement): the highlighted value and the
 * rest of the sentence on a tinted card. A thin wrapper over the shared
 * metricCard() so pitch follows the component; `size` is kept for old callers
 * but the component sets 60px for every statement card.
 */
export const ptMetricCard = (m = {}, i = 0) => metricCard({ value: m.value, text: m.text }, { layout: "statement", tone: ptTone(i, m.tone) });

/** A phone (Figma MockupPhone 412×844): a screen image under the device frame. */
export const ptPhone = (src) => `
  <div class="v2f-pt-phone">
    <div class="scr">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>
    <img class="frm" src="assets/pitch/mockup-phone.png" alt="">
  </div>`;

/** A hand holding a phone (Figma MockupHand 840×1000); the screen image sits in the hand's phone. */
export const ptHand = (src) => `
  <div class="v2f-pt-hand">
    <img class="bg" src="assets/pitch/mockup-hand.png" alt="">
    <div class="scr">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>
  </div>`;

/** Title + body block (Figma TextBlock 24/32); `dim` fades it to 25%. */
export const ptFeature = (f = {}, dim = false) => `
  <div class="v2f-pt-feat${dim ? " dim" : ""}">
    <p class="t">${esc(f.title ?? "")}</p>
    ${f.body ? `<p class="b">${esc(f.body)}</p>` : ""}
  </div>`;

import { plAvatar } from "./planning-blocks.js";
/** Portrait placeholder for example team content. */
export const ptAvatar = (i = 0) => plAvatar(i);

/** One team member (Figma Team): a photo that fills the column, then name and role. */
export const ptPerson = (p = {}) => `
  <div class="v2f-pt-person">
    <div class="ph">${p.image ? `<img src="${esc(p.image)}" alt="">` : ""}</div>
    <div class="nm"><p class="n">${esc(p.name ?? "")}</p><p class="r">${esc(p.role ?? "")}</p></div>
  </div>`;
