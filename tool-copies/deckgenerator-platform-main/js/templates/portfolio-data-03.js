// Template: portfolio/data-03 — four project columns, each a heading, a list of
// services, and a photo below. Source Figma frame 109:10273.
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
  name: "portfolio/data-03",
  slide: 79,
  figmaNode: "109:10273",
  family: "portfolio", role: "data", shape: "row", count: 4, theme: "light", chrome: false,
  use: "Four project columns, each a heading, a list of services, and a photo below.",
  media: ["photo"],
  capacity: { items: 4, min: 2, max: 4 },
  slots: { images: 4, titles: 4, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/data-03 — 4 columns of project heading + service list + photo.",
  schema: {
    projects: "array of up to 4 { heading, lines[], image }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    projects: [1, 2, 3, 4].map((n, i) => ({
      heading: `Project ${n}`,
      lines: ["Logotype", "Strategy", "Packaging", "Product design", "Web design", "Photography"],
      image: SAMPLE[i],
    })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "174" },
  },
  render(s) {
    const grid = `<div class="v2f-grid pt" style="--cols:4">${(s.projects || []).slice(0, 4).map(projCard).join("")}</div>`;
    return frame(grid, { meta: s.meta, footer: s.footer });
  },
};
