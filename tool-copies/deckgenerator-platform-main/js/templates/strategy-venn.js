// Template: strategy/grid-09 — "Onion Diagram" (Venn): three overlapping circles
// meeting at a central proposition, beside a right text column. Light theme.
// Source Figma frame 109:9009 (Strategy).
import { footerBar } from "../frame.js";
import { stVenn, stTextCol } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-09",
  slide: 151,
  figmaNode: "109:9009",
  family: "strategy",
  role: "diagram",
  shape: "venn-split",
  theme: "light",
  chrome: false,
  use: "A three-lens Venn: three factors (e.g. opportunity, experience, expectations) overlapping on a central proposition, explained by a right text column.",
  media: [],
  capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-09 — a 3-circle Venn with a central proposition + a right text column.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    circles: "array of 3 labels [top, bottom-right, bottom-left]", center: "string — centre label",
    body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Onion Diagram", subtitle: "Subtitle",
    circles: ["Opportunity", "Expectations", "Experience"],
    center: "Proposition",
    body: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "155" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-st-split reveal">
        ${stVenn({ labels: s.circles || [], center: s.center })}
        ${stTextCol({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body, side: "right" })}
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
