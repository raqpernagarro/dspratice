// Template: creative/split-12 — a two-column photo grid under the brand header; left column
// is a paired row over a caption text block, right column is a 2×2 block of images.
// Source frame 3:765.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/split-12", slide: 219, figmaNode: "3:765",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A two-column photo grid, a paired row over a caption beside a 2×2 block of images.",
  media: ["photo", "text"], capacity: { items: 6, min: 6, max: 6 },
  slots: { images: 6, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "creative/split-12 — 2-column photo grid, paired row + caption + 2×2 block.",
  schema: { meta: "{ studio, name, page }", text: "{ title, body }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const t = s.text || true;
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ dir: "row", items: [{ i: 0 }, { i: 1 }] }, { t }] },
      { dir: "column", items: [
        { dir: "row", items: [{ i: 2 }, { i: 3 }] },
        { dir: "row", items: [{ i: 4 }, { i: 5 }] },
      ] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
