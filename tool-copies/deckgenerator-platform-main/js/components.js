// =============================================================================
// Shared, reusable building blocks used across slide templates.
// =============================================================================
import { NAGARRO_LOGO } from "./logo.js";

/** HTML-escape a string for safe interpolation. */
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/** The Nagarro logo block (top-left chrome). */
export const Logo = () => `<div class="logo">${NAGARRO_LOGO}</div>`;

/** Default footer content — overridable per slide or per deck. */
export const DEFAULT_FOOTER = {
  col1: "Presentation Name",
  col2: "Prepared for [Client]",
  col3: "",
  copyright: "© 2026",
};

/** The three-column footer block (bottom chrome). */
export const Footer = (footer = {}, deckDefaults = {}) => {
  const f = { ...DEFAULT_FOOTER, ...deckDefaults, ...footer };
  return `
    <div class="footer">
      <div class="col">${esc(f.col1)}</div>
      <div class="col">${esc(f.col2)}</div>
      <div class="col split"><span>${esc(f.col3)}</span><span>${esc(f.copyright)}</span></div>
    </div>`;
};

/**
 * Shared content-slide header: a mint eyebrow, a heading, and a supporting line.
 * Positioned below the logo (top: 130px). Used by content templates for a
 * consistent eyebrow → heading → subhead pattern.
 *   { eyebrow, heading, subhead }
 */
export const SectionHeader = ({ eyebrow, heading, subhead } = {}) => `
  <div class="t-hdr reveal">
    ${eyebrow ? `<span class="t-hdr__eyebrow">${esc(eyebrow)}</span>` : ""}
    ${heading ? `<h2 class="t-hdr__heading">${esc(heading)}</h2>` : ""}
    ${subhead ? `<p class="t-hdr__subhead">${esc(subhead)}</p>` : ""}
  </div>`;

/**
 * Chrome = logo + footer, shared by every full-frame template.
 * Pass `chrome: false` on a slide to omit it (e.g. a full-bleed cover).
 */
export const Chrome = (slide = {}, deckDefaults = {}) => {
  if (slide.chrome === false) return "";
  return Logo() + Footer(slide.footer, deckDefaults?.footer);
};
