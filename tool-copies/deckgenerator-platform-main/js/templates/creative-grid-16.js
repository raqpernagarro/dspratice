// Template: creative/grid-16 — the grid-14 skeleton with phone mockups floated over every
// wide cell: the two outer wide singles (one peeking from the top, one from the bottom) and
// the full-height centre feature. Source Figma frame 3:219.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b) => ({ dir: "row", items: [{ i: a }, { i: b }] });

export default {
  name: "creative/grid-16", slide: 198, figmaNode: "3:219",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed photo grid with phone mockups floated over all three wide cells.",
  media: ["photo", "mockup"], capacity: { items: 11, min: 11, max: 11 },
  slots: { images: 11, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-16 — full-bleed 3-column grid, phone mockups on every wide cell.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [pair(0, 1), { i: 2, phone: 40 }, pair(3, 4)] },
      { dir: "column", items: [{ i: 5, phone: 44 }] },
      { dir: "column", items: [pair(6, 7), { i: 8, phone: -588 }, pair(9, 10)] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
