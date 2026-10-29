// Template: creative/grid-20 — a full-bleed two-column split like split-01, but the narrow
// left column stacks three equal images beside the large feature. Source frame 2:687.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/grid-20", slide: 203, figmaNode: "2:687",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A full-bleed split of a narrow three-image column beside one large feature image.",
  media: ["photo"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-20 — full-bleed split, narrow three-image column + large feature.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { f: 442, dir: "column", items: [{ i: 0 }, { i: 1 }, { i: 2 }] },
      { f: 1374, i: 3 },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
