// Template: creative/grid-19 — the most mockup-dense layout: a full-bleed three-column
// grid where every cell is a wide image carrying a phone mockup. Short cells let the phone
// peek from an edge; tall cells show the notch from the top. Source frame 3:371.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-19", slide: 201, figmaNode: "3:371",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed photo grid where every cell carries a phone mockup.",
  media: ["photo", "mockup"], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-19 — full-bleed 3-column grid, a phone mockup on every cell.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ f: 317, i: 0, phone: -566 }, { f: 591, i: 1, phone: 40 }] },
      { dir: "column", items: [{ f: 591, i: 2, phone: -293 }, { f: 317, i: 3, phone: 40 }] },
      { dir: "column", items: [{ f: 317, i: 4, phone: -566 }, { f: 591, i: 5, phone: 40 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
