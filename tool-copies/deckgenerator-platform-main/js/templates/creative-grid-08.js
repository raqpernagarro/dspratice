// Template: creative/grid-08 — a full-bleed three-column photo grid alternating wide
// feature cells and paired cells in a checkerboard. Source Figma frame 2:392.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b) => ({ dir: "row", items: [{ i: a }, { i: b }] });

export default {
  name: "creative/grid-08", slide: 190, figmaNode: "2:392",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed three-column photo grid alternating wide feature cells and paired cells.",
  media: ["photo"], capacity: { items: 13, min: 13, max: 13 },
  slots: { images: 13, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-08 — full-bleed 3-column grid, checkerboard wide cells.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ i: 0 }, pair(1, 2), { i: 3 }] },
      { dir: "column", items: [pair(4, 5), { i: 6 }, pair(7, 8)] },
      { dir: "column", items: [{ i: 9 }, pair(10, 11), { i: 12 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
