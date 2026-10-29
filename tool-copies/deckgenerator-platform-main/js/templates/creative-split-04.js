// Template: creative/split-04 — a two-column product split: two stacked feature photos on
// the left, and on the right a brand header over a padded product card. Source frame 3:462.
import { footerBar } from "../frame.js";
import { productSplit } from "../creative-blocks.js";

export default {
  name: "creative/split-04", slide: 206, figmaNode: "3:462",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A product split: two stacked photos beside a header + padded product card.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/split-04 — product split, two stacked photos left + product card right.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    return productSplit(s, { dir: "column", items: [{ i: 0 }, { i: 1 }] }, 2, { footerBar }, "right");
  },
};
