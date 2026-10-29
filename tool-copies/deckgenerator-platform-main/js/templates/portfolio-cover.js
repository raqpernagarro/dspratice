// Template: portfolio/cover — the portfolio opening cover: top bar, a 4-column
// info row (Role / Specialised in / Contact / About), then a big display title
// (e.g. "Portfolio" + a year) pinned bottom-left. Source Figma frame 109:10025.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

/** A labelled info column: bold heading + muted lines. */
const infoCol = (c = {}) => `
  <div class="v2f-pf-infocol">
    ${c.heading != null ? `<p class="h">${esc(c.heading)}</p>` : ""}
    <div class="lines">${(c.lines || []).map((l) => `<p>${esc(l)}</p>`).join("")}</div>
  </div>`;

export default {
  name: "portfolio/cover",
  slide: 65,
  figmaNode: "109:10025",
  family: "portfolio", role: "cover", shape: "single", theme: "light", chrome: false,
  use: "Portfolio opening cover: a top info row (role / specialised in / contact / about) with a large display title pinned bottom-left.",
  media: [],
  capacity: { items: 4, min: 1, max: 4 },
  slots: { images: 0, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "portfolio/cover — info row + big bottom-left display title.",
  schema: {
    title: "string — big display title", subtitle: "string — e.g. a year",
    info: "array of up to 4 { heading, lines[] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Portfolio", subtitle: "2026",
    info: [
      { heading: "Role", lines: [] },
      { heading: "Specialised in", lines: ["Photoshop", "Figma", "After Effects"] },
      { heading: "Contact", lines: ["+ 123 456 7890", "www.themasterslides.com"] },
      { heading: "About", lines: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "160" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-pf-cover">
        ${topBar(s.meta)}
        <div class="v2f-pf-inforow reveal">${(s.info || []).slice(0, 4).map(infoCol).join("")}</div>
        <div class="v2f-pf-cover-head reveal">
          ${s.title ? `<p class="v2f-pf-cover-title">${esc(s.title)}</p>` : ""}
          ${s.subtitle ? `<p class="v2f-pf-cover-sub">${esc(s.subtitle)}</p>` : ""}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
