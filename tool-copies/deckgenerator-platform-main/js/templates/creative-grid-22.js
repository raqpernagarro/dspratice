// Template: creative/grid-22 — a full-bleed three-column grid: a large centre feature image
// flanked by two narrow columns of two stacked images each. Source frame 2:729.
// (slide 203.2 keeps Figma canvas order: it sits between grid-21 and split-02.)
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-22", slide: 203.2, figmaNode: "2:729",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed grid with a centre feature flanked by two two-image columns.",
  media: ["photo"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 5, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-22 — full-bleed centre feature + two two-image columns.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { f: 442, dir: "column", items: [{ i: 0 }, { i: 1 }] },
      { f: 908, i: 2 },
      { f: 442, dir: "column", items: [{ i: 3 }, { i: 4 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
