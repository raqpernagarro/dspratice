// Template: creative/split-10 — a two-column photo grid under the brand header; left column
// is one image over a caption text block, right column is one image over a paired row.
// Source frame 3:731.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/split-10", slide: 217, figmaNode: "3:731",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A two-column photo grid, an image over a caption beside an image over a paired row.",
  media: ["photo", "text"], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 4, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "creative/split-10 — 2-column photo grid, caption cell + image over pair.",
  schema: { meta: "{ studio, name, page }", text: "{ title, body }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const t = s.text || true;
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ i: 0 }, { t }] },
      { dir: "column", items: [{ i: 1 }, { dir: "row", items: [{ i: 2 }, { i: 3 }] }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
