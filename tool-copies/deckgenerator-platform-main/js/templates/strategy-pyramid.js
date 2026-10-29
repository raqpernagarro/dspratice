// Template: strategy/grid-11 — "Strategy Pyramid": a tiered pyramid diagram beside
// a right text column. Light theme. Source Figma frame 109:9033 (Strategy).
import { footerBar } from "../frame.js";
import { stPyramid, stTextCol } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-11",
  slide: 153,
  figmaNode: "109:9033",
  family: "strategy",
  role: "diagram",
  shape: "pyramid-split",
  theme: "light",
  chrome: false,
  use: "A hierarchy / strategy pyramid: a stack of tiers from foundation to apex, explained by a title + body paragraph on the right.",
  media: [],
  capacity: { items: 6, min: 3, max: 7 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-11 — a left tiered pyramid + a right text column.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    tiers: "array of tier labels (top → bottom)",
    body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Strategy Pyramid", subtitle: "Subtitle",
    tiers: ["Title", "Title", "Title", "Title", "Title", "Title"],
    body: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "157" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-st-split reveal">
        ${stPyramid(s.tiers || [])}
        ${stTextCol({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body, side: "right" })}
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
