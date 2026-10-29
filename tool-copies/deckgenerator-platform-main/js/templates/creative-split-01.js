// Template: creative/split-01 — a full-bleed two-column split: a narrow left column of two
// stacked images beside one large feature image filling the rest. Source frame 2:646.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/split-01", slide: 202, figmaNode: "2:646",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A full-bleed split of a narrow two-image column beside one large feature image.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/split-01 — full-bleed split, narrow stacked column + large feature.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { f: 442, dir: "column", items: [{ i: 0 }, { i: 1 }] },
      { f: 1374, i: 2 },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
