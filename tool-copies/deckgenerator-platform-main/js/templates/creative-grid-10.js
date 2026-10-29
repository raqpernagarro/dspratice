// Template: creative/grid-10 — a full-bleed three-column asymmetric photo collage: the
// outer columns each pair a short and a tall image (mirrored), the middle column stacks
// a pair, a wide cell, and a pair. Source Figma frame 2:476.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b, f) => ({ f, dir: "row", items: [{ i: a }, { i: b }] });

export default {
  name: "creative/grid-10", slide: 192, figmaNode: "2:476",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed three-column asymmetric photo collage with mirrored short/tall outer columns.",
  media: ["photo"], capacity: { items: 9, min: 9, max: 9 },
  slots: { images: 9, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-10 — full-bleed 3-column asymmetric collage.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ f: 317, i: 0 }, { f: 591, i: 1 }] },
      { dir: "column", items: [pair(2, 3, 283.5), { f: 317, i: 4 }, pair(5, 6, 283.5)] },
      { dir: "column", items: [{ f: 591, i: 7 }, { f: 317, i: 8 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
