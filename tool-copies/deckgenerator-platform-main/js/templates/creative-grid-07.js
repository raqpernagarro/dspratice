// Template: creative/grid-07 — a full-bleed three-column photo grid with a wide feature
// cell stepping down the diagonal (top / middle / bottom). Source Figma frame 2:344.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b) => ({ dir: "row", items: [{ i: a }, { i: b }] });

export default {
  name: "creative/grid-07", slide: 189, figmaNode: "2:344",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed three-column photo grid with a wide feature cell stepping down the diagonal.",
  media: ["photo"], capacity: { items: 15, min: 15, max: 15 },
  slots: { images: 15, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-07 — full-bleed 3-column grid, diagonal wide cells.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ i: 0 }, pair(1, 2), pair(3, 4)] },
      { dir: "column", items: [pair(5, 6), { i: 7 }, pair(8, 9)] },
      { dir: "column", items: [pair(10, 11), pair(12, 13), { i: 14 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
