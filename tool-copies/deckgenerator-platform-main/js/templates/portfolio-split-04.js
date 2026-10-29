// Template: portfolio/split-04 — two stacked sections (e.g. "Brief" and
// "Insight"), each a heading on the left and a body paragraph on the right.
// Source Figma frame 109:10423.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/split-04",
  slide: 92,
  figmaNode: "109:10423",
  family: "portfolio", role: "brief", shape: "rows", theme: "light", chrome: false,
  use: "Two stacked sections, each a heading on the left and a body paragraph on the right.",
  media: [],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 0, titles: 2, subtitles: 0, body: 2, stats: 0, icons: 0 },
  description: "portfolio/split-04 — two heading | body sections.",
  schema: {
    sections: "array of 2 { title, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    sections: [
      { title: "Brief", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
      { title: "Insight", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "187" },
  },
  render(s) {
    const secs = (s.sections || []).slice(0, 2)
      .map((sec) => `<div class="v2f-pf-sec"><p class="h">${esc(sec.title ?? "")}</p><p class="b">${esc(sec.body ?? "")}</p></div>`).join("");
    return frame(`<div class="v2f-pf-sections reveal">${secs}</div>`, { meta: s.meta, footer: s.footer });
  },
};
