// Template: strategy/data-02 — "Strategy map": a bold head over a 2×2 quadrant
// panel with a centre pill. Light theme. Source Figma frame 109:8794 (Strategy).
import { frame } from "../frame.js";
import { stBoldHead, stQuadrant } from "../strategy-blocks.js";

export default {
  name: "strategy/data-02",
  slide: 141,
  figmaNode: "109:8794",
  family: "strategy",
  role: "diagram",
  shape: "quadrant",
  theme: "light",
  chrome: false,
  use: "A strategy map / positioning canvas: four labelled quadrants of guiding questions meeting at a central proposition pill.",
  media: [],
  capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "strategy/data-02 — bold head + a 2×2 quadrant map with a central pill.",
  schema: {
    caption: "string — eyebrow", title: "string — bold title",
    center: "string — centre pill text",
    quadrants: "array of 4 { label, text } in TL, TR, BL, BR order",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Strategy map", title: "Subtitle",
    center: "Strategic Proposition",
    quadrants: [
      { label: "Consumer", text: "What is the key consumer need we want to address?" },
      { label: "Culture", text: "What are the key trends and behaviours in culture?" },
      { label: "Category", text: "What are the key tendencies in the category?" },
      { label: "Company", text: "What is our key differentiator as a brand?" },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "145" },
  },
  render(s) {
    const middle =
      stBoldHead({ caption: s.caption, title: s.title }) +
      stQuadrant({ center: s.center, quadrants: s.quadrants || [] });
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
