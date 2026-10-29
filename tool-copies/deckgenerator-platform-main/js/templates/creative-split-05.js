// Template: creative/split-05 — a two-column product split (mirror of split-04): a brand
// header over a padded product card on the left, two stacked feature photos on the right.
// Source frame 3:475.
import { footerBar } from "../frame.js";
import { productSplit } from "../creative-blocks.js";

export default {
  name: "creative/split-05", slide: 207, figmaNode: "3:475",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A product split: a header + padded product card beside two stacked photos.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/split-05 — product split, product card left + two stacked photos right.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    return productSplit(s, { dir: "column", items: [{ i: 1 }, { i: 2 }] }, 0, { footerBar }, "left");
  },
};
