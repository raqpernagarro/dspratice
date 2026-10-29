// =============================================================================
// Case Study blocks — the pieces every case-study/* template shares, from the
// Master Slides Figma section 110:41060. CSS lives in css/primitives.css under
// the .v2f-cs-* namespace.
//
// The family differs from the core frame in three ways, all visible on every
// frame: the footer reads "Presentation Name · Prepared for [Client] · © 2026",
// most slides carry a "Client / Project" block at the bottom-left, and the
// covers and splits put the top bar inside the text column rather than across
// the slide.
// =============================================================================
import { esc } from "./components.js";
import { topBar, footerBar } from "./frame.js";
import { plScene } from "./planning-blocks.js";

/** Footer defaults for the family; col3 is deliberately empty in Figma. */
export const CS_FOOTER = { col1: "Presentation Name", col2: "Prepared for [Client]", col3: "", copyright: "© 2026" };
export const csFooter = (f = {}) => footerBar({ ...CS_FOOTER, ...f });

/** The "Client / Project" pair pinned to the bottom of a column or slide. */
export const csClient = (c = {}) => `
  <div class="v2f-cs-client">
    <p>${esc(c.client ?? "Client")}</p>
    <p>${esc(c.project ?? "Project")}</p>
  </div>`;

/** A rounded image panel. `style` sets a fixed size where Figma uses one. */
export const csImg = (src, { cls = "", style = "" } = {}) =>
  `<div class="v2f-imgbox v2f-cs-img ${cls}"${style ? ` style="${style}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

/** Brand photography placeholder for example content. */
export const csPhoto = (i = 0) => plScene(i);

/** A column that carries its own top bar (covers, splits). */
export const csCol = (meta, inner, { width, logoOnly = false } = {}) => `
  <div class="v2f-cs-col"${width ? ` style="flex:0 0 ${width}px;"` : ""}>
    ${topBar(meta, { logoOnly })}
    ${inner}
  </div>`;

/** Caption + title (+ optional subtitle) heading, sized per slide. */
export const csHead = ({ caption, title, subtitle } = {}, { size = "h2", sub = "h5", gap12 = false, maxWidth } = {}) => `
  <div class="v2f-cs-head${gap12 ? " v2f-cs-head--gap12" : ""}"${maxWidth ? ` style="max-width:${maxWidth}px;"` : ""}>
    ${caption ? `<p class="v2f-cs-cap">${esc(caption)}</p>` : ""}
    ${title ? `<p class="v2f-cs-${size}">${esc(title)}</p>` : ""}
    ${subtitle ? `<p class="v2f-cs-${sub} v2f-cs-muted">${esc(subtitle)}</p>` : ""}
  </div>`;

/**
 * Area chart on a dark card (Figma grid-09 / grid-10): a series label, a filled
 * area under the line, a dot and value at each point, period labels along the
 * bottom. Values scale from zero to the largest point. The card stays dark on
 * either slide theme, as in Figma.
 */
export const csAreaChart = ({ label, points = [] } = {}) => {
  const pts = points.filter((p) => p && Number.isFinite(Number(p.value)));
  const max = Math.max(1, ...pts.map((p) => Number(p.value)));
  const xy = pts.map((p, i) => ({
    x: pts.length > 1 ? (i / (pts.length - 1)) * 100 : 50,
    y: 100 - (Number(p.value) / max) * 100,
    p,
  }));
  const path = xy.length
    ? `M0 100 ${xy.map(({ x, y }) => `L${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")} L100 100 Z`
    : "";
  return `
  <div class="v2f-cs-chart">
    ${label ? `<p class="lbl">${esc(label)}</p>` : ""}
    <div class="plot">
      <div class="area">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>
        ${xy.map(({ x, y, p }) => `<div class="pt" style="left:${x}%;top:${y}%"><span>${esc(p.display ?? p.value)}</span><i></i></div>`).join("")}
      </div>
      <div class="axis">${pts.map((p) => `<span>${esc(p.label ?? "")}</span>`).join("")}</div>
    </div>
  </div>`;
};
