// Template: creative/grid-09 — a full-bleed three-column photo grid; the middle column
// is a tall feature image over a wide pair. Source Figma frame 2:436.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b, f) => ({ f, dir: "row", items: [{ i: a }, { i: b }] });

export default {
  name: "creative/grid-09", slide: 191, figmaNode: "2:436",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed three-column photo grid with a tall feature image in the middle column.",
  media: ["photo"], capacity: { items: 11, min: 11, max: 11 },
  slots: { images: 11, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-09 — full-bleed 3-column grid, middle tall feature.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ i: 0 }, pair(1, 2), { i: 3 }] },
      { dir: "column", items: [{ f: 591, i: 4 }, pair(5, 6, 317)] },
      { dir: "column", items: [{ i: 7 }, pair(8, 9), { i: 10 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
