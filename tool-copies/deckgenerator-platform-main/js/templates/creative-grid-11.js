// Template: creative/grid-11 — a full-bleed three-column photo grid; the outer columns
// lead with a tall feature (mirrored), the middle column runs pair / wide / pair.
// Source Figma frame 2:516.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b) => ({ dir: "row", items: [{ i: a }, { i: b }] });

export default {
  name: "creative/grid-11", slide: 193, figmaNode: "2:516",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed three-column photo grid with mirrored tall feature images in the outer columns.",
  media: ["photo"], capacity: { items: 9, min: 9, max: 9 },
  slots: { images: 9, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-11 — full-bleed 3-column grid, mirrored tall features.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ f: 591, i: 0 }, { f: 317, i: 1 }] },
      { dir: "column", items: [pair(2, 3), { i: 4 }, pair(5, 6)] },
      { dir: "column", items: [{ f: 317, i: 7 }, { f: 591, i: 8 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
