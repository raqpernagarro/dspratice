// Template: strategy/grid-10 — "Methodology": a left text column beside four dark
// nodes arranged on a dashed ring. Light theme.
// Source Figma frame 109:9022 (Strategy).
import { footerBar } from "../frame.js";
import { stTextCol, stMethodology } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-10",
  slide: 152,
  figmaNode: "109:9022",
  family: "strategy",
  role: "diagram",
  shape: "cycle-split",
  theme: "light",
  chrome: false,
  use: "A cyclical methodology: named stages placed on a dashed ring to show a repeating process, explained by a left text column.",
  media: [],
  capacity: { items: 4, min: 3, max: 6 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-10 — left text column + a dashed ring of stage nodes.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    nodes: "array of stage labels (clockwise from top)",
    body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Methodology", subtitle: "Subtitle",
    nodes: ["Learn", "Envision", "Plan", "Create"],
    body: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "156" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-st-split reveal">
        ${stTextCol({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body, side: "left" })}
        ${stMethodology(s.nodes || [])}
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
