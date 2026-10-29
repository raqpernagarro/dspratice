// Template: creative/grid-35 — an annotated photo layout: a wide top image over a pair of
// images, five pins total, beside a five-item numbered legend. Source frame 8:752.
import { pageHeader, footerBar } from "../frame.js";
import { crAnnotated, crPinImg, crPinCol, crPinRow } from "../creative-blocks.js";
import { ANNO_HEAD, annoItems } from "./creative-grid-32.js";

export default {
  name: "creative/grid-35", slide: 230, figmaNode: "8:752",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A wide annotated photo over a pair of photos beside a five-item legend.",
  media: ["photo", "text"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 1, body: 5, stats: 0, icons: 0 },
  description: "creative/grid-35 — annotated wide photo + pair (5 pins) + five-item legend.",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title, subtitle }", items: "[{ n, body }]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const left = crPinCol([
      crPinImg(0, [{ x: 14.2, y: 36.6, n: 1 }, { x: 78.6, y: 62.6, n: 2 }]),
      crPinRow([
        crPinImg(1, [{ x: 37.5, y: 50.2, n: 3 }, { x: 78.9, y: 20.7, n: 4 }]),
        crPinImg(2, [{ x: 75.8, y: 20.7, n: 5 }]),
      ]),
    ]);
    return crAnnotated(s, {
      leftW: 1000, rightW: 816, left,
      head: { ...ANNO_HEAD, ...(s.header || {}) }, items: s.items || annoItems(5),
    }, { pageHeader, footerBar });
  },
};
