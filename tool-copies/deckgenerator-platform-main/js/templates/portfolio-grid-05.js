// Template: portfolio/grid-05 — a 3-column grid of labelled service tiles on the
// left beside a "What we do" heading + paragraph on the right. Source Figma frame
// 109:10181.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/grid-05",
  slide: 74,
  figmaNode: "109:10181",
  family: "portfolio", role: "services", shape: "grid", count: 9, theme: "light", chrome: false,
  use: "A grid of labelled service tiles beside a heading + paragraph.",
  media: [],
  capacity: { items: 9, min: 3, max: 9 },
  slots: { images: 0, titles: 1, subtitles: 9, body: 1, stats: 0, icons: 0 },
  description: "portfolio/grid-05 — 3×3 service tiles + heading panel.",
  schema: {
    services: "array of up to 9 strings",
    title: "string", body: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    services: ["Digital Marketing", "Content Production", "Social Media Curation",
      "Email Marketing", "Art Direction", "Wordmarks",
      "Creative Strategy", "Web Design", "AI Imagery"],
    title: "What we do",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "169" },
  },
  render(s) {
    const tiles = (s.services || []).slice(0, 9)
      .map((t) => `<div class="v2f-pf-servtile">${esc(t)}</div>`).join("");
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="v2f-pf-tilegrid">${tiles}</div>
        <div class="c" style="justify-content:center">
          <div class="v2f-pf-blk">${s.title ? `<p class="h">${esc(s.title)}</p>` : ""}${s.body ? `<p>${esc(s.body)}</p>` : ""}</div>
        </div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
