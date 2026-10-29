// Template: creative/split-07 — a two-column photo grid under the brand header, where the
// lower-left cell is a caption text block instead of an image. Left column: one image over
// a caption; right column: two stacked images. Source frame 3:669.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/split-07", slide: 214, figmaNode: "3:669",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A two-column photo grid with a caption text block in place of one cell.",
  media: ["photo", "text"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "creative/split-07 — 2-column photo grid with a caption cell.",
  schema: { meta: "{ studio, name, page }", text: "{ title, body }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const t = s.text || true;
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ i: 0 }, { t }] },
      { dir: "column", items: [{ i: 1 }, { i: 2 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
