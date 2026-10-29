// Template: creative/grid-14 — a full-bleed three-column photo grid; the outer columns
// run pair / wide single / pair in equal thirds, the middle column is one full-height
// feature image. Source Figma frame 2:609.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b) => ({ dir: "row", items: [{ i: a }, { i: b }] });
const stack = (a, b, c, d, e) => ({ dir: "column", items: [pair(a, b), { i: c }, pair(d, e)] });

export default {
  name: "creative/grid-14", slide: 196, figmaNode: "2:609",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed three-column photo grid with a full-height feature in the middle column.",
  media: ["photo"], capacity: { items: 11, min: 11, max: 11 },
  slots: { images: 11, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-14 — full-bleed 3-column grid, centre full-height feature.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      stack(0, 1, 2, 3, 4),
      { dir: "column", items: [{ i: 5 }] },
      stack(6, 7, 8, 9, 10),
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
