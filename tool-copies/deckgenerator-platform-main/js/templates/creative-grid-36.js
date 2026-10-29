// Template: creative/grid-36 — an annotated feature photo (3 pins), image column wider still,
// beside a numbered legend. Source frame 8:835.
import { pageHeader, footerBar } from "../frame.js";
import { crAnnotated, crPinImg } from "../creative-blocks.js";
import { ANNO_HEAD, annoItems } from "./creative-grid-32.js";

export default {
  name: "creative/grid-36", slide: 231, figmaNode: "8:835",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A wide annotated feature photo with numbered pins beside a numbered legend.",
  media: ["photo", "text"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 3, stats: 0, icons: 0 },
  description: "creative/grid-36 — annotated wide photo (3 pins) + numbered legend.",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title, subtitle }", items: "[{ n, body }]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const left = crPinImg(0, [
      { x: 25.9, y: 20.4, n: 1 }, { x: 82.5, y: 23.0, n: 2 }, { x: 54.6, y: 80.5, n: 3 },
    ]);
    return crAnnotated(s, {
      leftW: 1088, rightW: 728, left,
      head: { ...ANNO_HEAD, ...(s.header || {}) }, items: s.items || annoItems(3),
    }, { pageHeader, footerBar });
  },
};
