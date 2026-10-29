// Template: portfolio/grid-02 — cover variant: cover info + display title on the
// left half, a full-height photo on the right half. Source Figma frame 109:10041.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const infoCol = (c = {}) => `
  <div class="v2f-pf-infocol">
    ${c.heading != null ? `<p class="h">${esc(c.heading)}</p>` : ""}
    <div class="lines">${(c.lines || []).map((l) => `<p>${esc(l)}</p>`).join("")}</div>
  </div>`;

export default {
  name: "portfolio/grid-02",
  slide: 66,
  figmaNode: "109:10041",
  family: "portfolio", role: "cover", shape: "split", theme: "light", chrome: false,
  use: "Portfolio cover variant: cover info + display title on the left, a full-height photo on the right.",
  media: ["photo"],
  capacity: { items: 3, min: 1, max: 3 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 0, stats: 0, icons: 0 },
  description: "portfolio/grid-02 — cover content left, photo right.",
  schema: {
    title: "string — big display title", subtitle: "string — e.g. a year",
    image: "string — photo path", info: "array of up to 3 { heading, lines[] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Portfolio", subtitle: "2026",
    image: "assets/photography/20200717-100942_Nagarro_742.jpg",
    info: [
      { heading: "Role", lines: [] },
      { heading: "Specialised in", lines: ["Photoshop", "Figma", "After Effects"] },
      { heading: "Contact", lines: ["+ 123 456 7890", "www.themasterslides.com"] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "161" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-pf-cover">
        ${topBar(s.meta)}
        <div class="v2f-pf-coverphoto reveal">
          <div class="left">
            <div class="v2f-pf-inforow">${(s.info || []).slice(0, 3).map(infoCol).join("")}</div>
            <div class="v2f-pf-cover-head">
              ${s.title ? `<p class="v2f-pf-cover-title">${esc(s.title)}</p>` : ""}
              ${s.subtitle ? `<p class="v2f-pf-cover-sub">${esc(s.subtitle)}</p>` : ""}
            </div>
          </div>
          <div class="photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
