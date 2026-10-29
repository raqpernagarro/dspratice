// Template: creative/grid-17 — a full-bleed three-column grid; the outer columns pair a
// short pair with a tall feature that carries a phone mockup (left peeks from the top,
// right from the bottom), the middle column is a full-height feature. Source frame 3:267.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b) => ({ f: 317, dir: "row", items: [{ i: a }, { i: b }] });

export default {
  name: "creative/grid-17", slide: 199, figmaNode: "3:267",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed photo grid with phone mockups over the two outer tall features.",
  media: ["photo", "mockup"], capacity: { items: 7, min: 7, max: 7 },
  slots: { images: 7, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-17 — full-bleed 3-column grid, outer tall features with phones.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [pair(0, 1), { f: 591, i: 2, phone: 40 }] },
      { dir: "column", items: [{ i: 3 }] },
      { dir: "column", items: [{ f: 591, i: 4, phone: -293 }, pair(5, 6)] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
