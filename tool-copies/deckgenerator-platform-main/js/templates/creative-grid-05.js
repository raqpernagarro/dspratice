// Template: creative/grid-05 — a full-bleed 6×3 photo grid of eighteen equal cells.
// Source Figma frame 2:141.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const row = (o) => ({ dir: "row", items: [0, 1, 2, 3, 4, 5].map((k) => ({ i: o + k })) });

export default {
  name: "creative/grid-05", slide: 187, figmaNode: "2:141",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed 6×3 grid of eighteen equal photos.",
  media: ["photo"], capacity: { items: 18, min: 18, max: 18 },
  slots: { images: 18, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-05 — full-bleed 6×3 equal photo grid.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "column", items: [row(0), row(6), row(12)] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
