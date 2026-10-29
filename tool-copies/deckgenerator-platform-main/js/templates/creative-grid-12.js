// Template: creative/grid-12 — a full-bleed three-column photo grid with an alternating
// rhythm: outer columns lead with a wide pair over a tall image, the middle column
// inverts it (tall image over a pair). Source Figma frame 2:546.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b) => ({ f: 317, dir: "row", items: [{ i: a }, { i: b }] });

export default {
  name: "creative/grid-12", slide: 194, figmaNode: "2:546",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed three-column photo grid with an alternating pair/feature rhythm.",
  media: ["photo"], capacity: { items: 9, min: 9, max: 9 },
  slots: { images: 9, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-12 — full-bleed 3-column grid, alternating pair over feature.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [pair(0, 1), { f: 591, i: 2 }] },
      { dir: "column", items: [{ f: 591, i: 3 }, pair(4, 5)] },
      { dir: "column", items: [pair(6, 7), { f: 591, i: 8 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
