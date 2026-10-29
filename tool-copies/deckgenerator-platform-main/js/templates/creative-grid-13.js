// Template: creative/grid-13 — a full-bleed three-column photo grid; each column stacks
// a short image and a tall image, with the middle column mirrored (tall over short).
// Source Figma frame 2:580.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-13", slide: 195, figmaNode: "2:580",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed three-column photo grid of short-over-tall stacks, middle mirrored.",
  media: ["photo"], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-13 — full-bleed 3-column grid, short/tall stacks.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ f: 317, i: 0 }, { f: 591, i: 1 }] },
      { dir: "column", items: [{ f: 591, i: 2 }, { f: 317, i: 3 }] },
      { dir: "column", items: [{ f: 317, i: 4 }, { f: 591, i: 5 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
