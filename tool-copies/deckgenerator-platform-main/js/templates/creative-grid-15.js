// Template: creative/grid-15 — the grid-14 skeleton (pair / wide / pair outer columns,
// full-height feature in the middle) with an iPhone-style device mockup floated over the
// centre feature so the photo reads as an app screen. Source Figma frame 3:180.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b) => ({ dir: "row", items: [{ i: a }, { i: b }] });
const stack = (a, b, c, d, e) => ({ dir: "column", items: [pair(a, b), { i: c }, pair(d, e)] });

export default {
  name: "creative/grid-15", slide: 197, figmaNode: "3:180",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed photo grid with a phone mockup floated over the centre feature image.",
  media: ["photo", "mockup"], capacity: { items: 11, min: 11, max: 11 },
  slots: { images: 11, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-15 — full-bleed 3-column grid, centre feature under a phone mockup.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      stack(0, 1, 2, 3, 4),
      { dir: "column", items: [{ i: 5, phone: 40 }] },
      stack(6, 7, 8, 9, 10),
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
