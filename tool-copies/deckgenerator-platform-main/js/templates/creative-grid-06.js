// Template: creative/grid-06 — a full-bleed three-column photo grid; the middle column
// swaps its centre pair for one wide image. Source Figma frame 2:294.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

const pair = (a, b) => ({ dir: "row", items: [{ i: a }, { i: b }] });

export default {
  name: "creative/grid-06", slide: 188, figmaNode: "2:294",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed three-column photo grid with a wide feature cell in the middle column.",
  media: ["photo"], capacity: { items: 17, min: 17, max: 17 },
  slots: { images: 17, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-06 — full-bleed 3-column photo grid, middle wide cell.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { dir: "column", items: [pair(0, 1), pair(2, 3), pair(4, 5)] },
      { dir: "column", items: [pair(6, 7), { i: 8 }, pair(9, 10)] },
      { dir: "column", items: [pair(11, 12), pair(13, 14), pair(15, 16)] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
