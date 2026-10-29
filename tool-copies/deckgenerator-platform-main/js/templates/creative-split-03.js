// Template: creative/split-03 — a two-column product split: a full-height feature photo on
// the left, and on the right a brand header over a padded product card. Source frame 3:436.
import { footerBar } from "../frame.js";
import { productSplit } from "../creative-blocks.js";

export default {
  name: "creative/split-03", slide: 205, figmaNode: "3:436",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A product split: a full feature photo beside a header + padded product card.",
  media: ["photo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/split-03 — product split, feature photo left + product card right.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    return productSplit(s, { i: 0 }, 1, { footerBar }, "right");
  },
};
