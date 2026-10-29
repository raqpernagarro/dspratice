// =============================================================================
// Shared v2 frame — the chrome + header blocks every "core" content slide uses,
// rebuilt from the new Master Slides Figma file (40px margins, top bar with logo
// + meta + hairline, PageHeader, 3-column footer). CSS lives in css/primitives.css
// under the .v2f-* namespace. HTML helpers here keep templates thin.
// =============================================================================
import { esc } from "./components.js";
import { NAGARRO_LOGO } from "./logo.js";

/** Top bar: Nagarro logo + "studio | name | page" meta over a hairline rule.
 *  Pass { logoOnly:true } to drop the meta and show just the logo. */
export const topBar = (m = {}, { logoOnly = false } = {}) => `
  <header class="v2f-top">
    <div class="v2f-topline">
      <span class="v2f-logo">${NAGARRO_LOGO}</span>
      ${logoOnly ? "" : `<div class="v2f-meta ${metaWidthClass(m)}">
        <span>${esc(m.studio ?? "Product Studio")}</span>
        <i></i><span>${esc(m.name ?? "Presentation Name")}</span>
        ${m.page != null && m.page !== "" ? `<i></i><span>${esc(m.page)}</span>` : ""}
      </div>`}
    </div>
  </header>`;

/**
 * The meta row's width class. A header placed in a narrow column (a 442px
 * side column, a half-slide panel) cannot hold "Product Studio | <deck
 * title> | 7", and an ellipsised title reads as a bug. The rule is the
 * brand's: when the meta does not fit, the header is the logo alone.
 *
 * The text is measured here by estimate (glyph widths by character class)
 * and rounded up to 10px. A container query
 * in css/primitives.css (.v2f-topline is the container) hides the whole meta
 * when the bar is narrower than logo + gap + that width. Pure CSS at render
 * time, so the editor, thumbnails, Present mode and the export all agree.
 */
const META_SEP = 49; // 24px gap, 1px rule, 24px gap
/* 16px Equip glyph widths by class, measured in Chromium; within 1% on deck
 * titles, plus a 4% margin so an estimate never comes up short. */
const textWidth = (t) => [...String(t)].reduce((n, c) =>
  n + (/[A-Z]/.test(c) ? 10.2 : /[0-9]/.test(c) ? 9.4 : /[a-z]/.test(c) ? 7.9 : c === " " ? 4.4 : 6), 0) * 1.04;
export function metaWidthClass(m = {}) {
  const parts = [m.studio ?? "Product Studio", m.name ?? "Presentation Name"];
  if (m.page != null && m.page !== "") parts.push(String(m.page));
  const est = parts.reduce((n, p) => n + textWidth(p), 0) + (parts.length - 1) * META_SEP;
  return `v2f-mw-${Math.min(1600, Math.ceil(est / 10) * 10)}`;
}

/** PageHeader: left heading block (caption/title/subtitle) + optional right intro.
 *  { halves:true } is the Core Figma PageHeader (e.g. 1184:33979): heading and
 *  intro as two equal halves, gap 24, top-aligned, subtitle 36/44. The default
 *  (680px heading, centred) is what the other families' frames were built to. */
export const pageHeader = ({ caption, title, subtitle, intro } = {}, { halves = false } = {}) => `
  <div class="v2f-pagehead${halves ? " v2f-pagehead--halves" : ""} reveal">
    <div class="v2f-heading">
      ${caption ? `<p class="v2f-caption">${esc(caption)}</p>` : ""}
      ${title ? `<p class="v2f-title">${esc(title)}</p>` : ""}
      ${subtitle ? `<p class="v2f-subtitle">${esc(subtitle)}</p>` : ""}
    </div>
    ${intro ? `<p class="v2f-intro">${esc(intro)}</p>` : ""}
  </div>`;

/** Three-column footer with top hairlines — the Figma "Footer" component:
 *  presentation name, "Prepared for [Client]", and the copyright at the right
 *  (col3 is the optional date beside it, empty by default as in Figma). */
export const footerBar = (f = {}) => `
  <footer class="v2f-footer">
    <div class="v2f-fcol">${esc(f.col1 ?? "Presentation Name")}</div>
    <div class="v2f-fcol">${esc(f.col2 ?? "Prepared for [Client]")}</div>
    <div class="v2f-fcol v2f-fcol--split">
      <span>${esc(f.col3 ?? "")}</span><span>${esc(f.copyright ?? "© 2026")}</span>
    </div>
  </footer>`;

/**
 * Full frame: top bar, the slide's middle content, and the footer, in the 40px
 * flex column that fills the 1920×1080 stage. `middle` is an HTML string.
 */
export const frame = (middle, { meta, footer } = {}) => `
  <div class="v2f-root">
    ${topBar(meta)}
    ${middle}
    ${footerBar(footer)}
  </div>`;
