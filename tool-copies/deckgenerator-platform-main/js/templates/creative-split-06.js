// Template: creative/split-06 — a two-column product split (mirror of split-03): a brand
// header over a padded product card on the left, a full-height feature photo on the right.
// Source frame 3:488.
import { footerBar } from "../frame.js";
import { productSplit } from "../creative-blocks.js";

export default {
  name: "creative/split-06", slide: 208, figmaNode: "3:488",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A product split: a header + padded product card beside a full feature photo.",
  media: ["photo"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/split-06 — product split, product card left + full feature photo right.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    return productSplit(s, { i: 1 }, 0, { footerBar }, "left");
  },
};
