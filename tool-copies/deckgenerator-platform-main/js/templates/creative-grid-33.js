// Template: creative/grid-33 — an annotated feature photo (3 pins) beside a numbered legend;
// wider image column than grid-32. Source frame 8:652.
import { pageHeader, footerBar } from "../frame.js";
import { crAnnotated, crPinImg } from "../creative-blocks.js";
import { ANNO_HEAD, annoItems } from "./creative-grid-32.js";

export default {
  name: "creative/grid-33", slide: 228, figmaNode: "8:652",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "An annotated feature photo with numbered pins beside a numbered legend.",
  media: ["photo", "text"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 3, stats: 0, icons: 0 },
  description: "creative/grid-33 — annotated photo (3 pins) + numbered legend, wide image.",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title, subtitle }", items: "[{ n, body }]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const left = crPinImg(0, [
      { x: 28.1, y: 19.8, n: 1 }, { x: 84.3, y: 48.1, n: 2 }, { x: 33.0, y: 77.0, n: 3 },
    ]);
    return crAnnotated(s, {
      leftW: 1000, rightW: 816, left,
      head: { ...ANNO_HEAD, ...(s.header || {}) }, items: s.items || annoItems(3),
    }, { pageHeader, footerBar });
  },
};
