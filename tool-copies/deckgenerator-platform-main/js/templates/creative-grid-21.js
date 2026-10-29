// Template: creative/grid-21 — a full-bleed three-column grid: a large centre feature image
// flanked by two narrow columns of three stacked images each. Source frame 2:703.
// (slide 203.1 keeps Figma canvas order: it sits between grid-20 and split-02.)
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-21", slide: 203.1, figmaNode: "2:703",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed grid with a centre feature flanked by two three-image columns.",
  media: ["photo"], capacity: { items: 7, min: 7, max: 7 },
  slots: { images: 7, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-21 — full-bleed centre feature + two three-image columns.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { f: 442, dir: "column", items: [{ i: 0 }, { i: 1 }, { i: 2 }] },
      { f: 908, i: 3 },
      { f: 442, dir: "column", items: [{ i: 4 }, { i: 5 }, { i: 6 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
