// Template: creative/split-11 — a two-column photo grid under the brand header; left column
// is one image over a caption text block, right column is a 2×2 block of images.
// Source frame 3:747.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/split-11", slide: 218, figmaNode: "3:747",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A two-column photo grid, an image over a caption beside a 2×2 block of images.",
  media: ["photo", "text"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 5, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "creative/split-11 — 2-column photo grid, caption cell + 2×2 image block.",
  schema: { meta: "{ studio, name, page }", text: "{ title, body }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const t = s.text || true;
    const tree = { dir: "row", items: [
      { dir: "column", items: [{ i: 0 }, { t }] },
      { dir: "column", items: [
        { dir: "row", items: [{ i: 1 }, { i: 2 }] },
        { dir: "row", items: [{ i: 3 }, { i: 4 }] },
      ] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
