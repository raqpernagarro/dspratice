// Template: strategy/grid-06 — "Attributes": a left text column beside a panel of
// bipolar attribute sliders. Light theme. Source Figma frame 109:8972 (Strategy).
import { footerBar } from "../frame.js";
import { stTextCol, stSliders } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-06",
  slide: 148,
  figmaNode: "109:8972",
  family: "strategy",
  role: "diagram",
  shape: "sliders-split",
  theme: "light",
  chrome: false,
  use: "A brand-attribute / positioning scale: a stack of bipolar sliders (e.g. youthful ↔ mature) each marked with where the brand sits, explained by a left text column.",
  media: [],
  capacity: { items: 8, min: 3, max: 10 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-06 — left text column + a panel of bipolar attribute sliders.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    body: "array of paragraph strings",
    rows: "array of { left, right, value:0..1 }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Attributes", subtitle: "Subtitle",
    body: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."],
    rows: [
      { left: "Youthful", right: "Mature", value: 0.28 },
      { left: "Simple", right: "Complex", value: 0.48 },
      { left: "Traditional", right: "Modern", value: 0.66 },
      { left: "Playful", right: "Serious", value: 0.36 },
      { left: "Casual", right: "Elegant", value: 0.55 },
      { left: "Innovative", right: "Classic", value: 0.78 },
      { left: "Industrial", right: "Natural", value: 0.36 },
      { left: "Accessible", right: "Exclusive", value: 0.5 },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "152" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-st-split reveal">
        ${stTextCol({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body, side: "left" })}
        ${stSliders(s.rows || [])}
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
