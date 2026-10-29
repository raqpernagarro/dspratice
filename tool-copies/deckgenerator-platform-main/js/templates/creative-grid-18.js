// Template: creative/grid-18 — a full-bleed three-column grid; every column pairs a short
// single with a tall feature that carries a phone mockup. Columns 1 and 3 run short-over-
// tall; column 2 is mirrored (tall-over-short, phone peeking from the top). Frame 3:313.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-18", slide: 200, figmaNode: "3:313",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed photo grid where each column's tall feature carries a phone mockup.",
  media: ["photo", "mockup"], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-18 — full-bleed 3-column grid, a phone-mockup feature per column.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ f: 317, i: 0 }, { f: 591, i: 1, phone: 40 }] },
      { dir: "column", items: [{ f: 591, i: 2, phone: -293 }, { f: 317, i: 3 }] },
      { dir: "column", items: [{ f: 317, i: 4 }, { f: 591, i: 5, phone: 40 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
