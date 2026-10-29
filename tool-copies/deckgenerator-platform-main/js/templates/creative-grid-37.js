// Template: creative/grid-37 — the widest annotated feature photo (3 pins) beside a compact
// numbered legend. Final Creative slide. Source frame 8:887.
import { pageHeader, footerBar } from "../frame.js";
import { crAnnotated, crPinImg } from "../creative-blocks.js";
import { ANNO_HEAD, annoItems } from "./creative-grid-32.js";

export default {
  name: "creative/grid-37", slide: 232, figmaNode: "8:887",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "The widest annotated feature photo with numbered pins beside a numbered legend.",
  media: ["photo", "text"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 3, stats: 0, icons: 0 },
  description: "creative/grid-37 — annotated wide photo (3 pins) + compact numbered legend.",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title, subtitle }", items: "[{ n, body }]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const left = crPinImg(0, [
      { x: 67.2, y: 10.1, n: 1 }, { x: 87.0, y: 77.1, n: 2 }, { x: 13.3, y: 51.3, n: 3 },
    ]);
    return crAnnotated(s, {
      leftW: 1172, rightW: 644, left,
      head: { ...ANNO_HEAD, ...(s.header || {}) }, items: s.items || annoItems(3),
    }, { pageHeader, footerBar });
  },
};
