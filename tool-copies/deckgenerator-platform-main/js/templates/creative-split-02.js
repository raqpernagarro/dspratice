// Template: creative/split-02 — a full-bleed two-column split (mirror of split-01): one
// large feature image beside a narrow column of two stacked images. Source frame 2:755.
import { topBar, footerBar } from "../frame.js";
import { fullBoard } from "../creative-blocks.js";

export default {
  name: "creative/split-02", slide: 204, figmaNode: "2:755",
  family: "creative", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A full-bleed split of one large feature image beside a narrow two-image column.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/split-02 — full-bleed split, large feature + narrow stacked column.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const tree = { dir: "row", items: [
      { f: 1374, i: 0 },
      { f: 442, dir: "column", items: [{ i: 1 }, { i: 2 }] },
    ] };
    return fullBoard(s, tree, { topBar, footerBar });
  },
};
