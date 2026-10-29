// Template: creative/grid-34 — two stacked annotated photos (2 pins each) beside a numbered
// legend of four items. Source frame 8:694.
import { pageHeader, footerBar } from "../frame.js";
import { crAnnotated, crPinImg, crPinCol } from "../creative-blocks.js";
import { ANNO_HEAD, annoItems } from "./creative-grid-32.js";

export default {
  name: "creative/grid-34", slide: 229, figmaNode: "8:694",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "Two stacked annotated photos with numbered pins beside a four-item legend.",
  media: ["photo", "text"], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 1, body: 4, stats: 0, icons: 0 },
  description: "creative/grid-34 — two annotated photos + four-item numbered legend.",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title, subtitle }", items: "[{ n, body }]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const left = crPinCol([
      crPinImg(0, [{ x: 20.2, y: 56.6, n: 1 }, { x: 88.2, y: 50.4, n: 2 }]),
      crPinImg(1, [{ x: 28.2, y: 32.2, n: 3 }, { x: 73.1, y: 69.2, n: 4 }]),
    ]);
    return crAnnotated(s, {
      leftW: 1000, rightW: 816, left,
      head: { ...ANNO_HEAD, ...(s.header || {}) }, items: s.items || annoItems(4),
    }, { pageHeader, footerBar });
  },
};
