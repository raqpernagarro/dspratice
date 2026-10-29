// Template: creative/split-08 — a two-column photo grid under the brand header; left column
// is a pair of images over a caption text block, right column is two stacked images.
// Source frame 3:699.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/split-08", slide: 215, figmaNode: "3:699",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A two-column photo grid, a paired row over a caption cell beside two stacked images.",
  media: ["photo", "text"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "creative/split-08 — 2-column photo grid, paired row + caption cell.",
  schema: { meta: "{ studio, name, page }", text: "{ title, body }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const t = s.text || true;
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ dir: "row", items: [{ i: 0 }, { i: 1 }] }, { t }] },
      { dir: "column", items: [{ i: 2 }, { i: 3 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
