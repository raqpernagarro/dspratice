// Template: portfolio/data-04 — five project columns, each a heading, a list of
// services, and a photo below. Source Figma frame 109:10285.
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { SAMPLE } from "../blocks.js";

const projCard = (c = {}) => `
  <div class="v2f-pf-projcard">
    ${c.heading != null ? `<p class="h">${esc(c.heading)}</p>` : ""}
    <div class="lines">${(c.lines || []).map((l) => `<p>${esc(l)}</p>`).join("")}</div>
    <div class="v2f-imgbox">${c.image ? `<img src="${esc(c.image)}" alt="">` : ""}</div>
  </div>`;

export default {
  name: "portfolio/data-04",
  slide: 80,
  figmaNode: "109:10285",
  family: "portfolio", role: "data", shape: "row", count: 5, theme: "light", chrome: false,
  use: "Five project columns, each a heading, a list of services, and a photo below.",
  media: ["photo"],
  capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 5, titles: 5, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/data-04 — 5 columns of project heading + service list + photo.",
  schema: {
    projects: "array of up to 5 { heading, lines[], image }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    projects: [1, 2, 3, 4, 5].map((n, i) => ({
      heading: `Project ${n}`,
      lines: ["Logotype", "Strategy", "Packaging", "Product design", "Web design", "Photography"],
      image: SAMPLE[i],
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "175" },
  },
  render(s) {
    const grid = `<div class="v2f-grid pt" style="--cols:5">${(s.projects || []).slice(0, 5).map(projCard).join("")}</div>`;
    return frame(grid, { meta: s.meta, footer: s.footer });
  },
};
