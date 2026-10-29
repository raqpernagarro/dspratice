// Template: creative/grid-32 — an annotated photo (numbered pins) beside a text column with
// a brand header, page header, and a numbered legend. Single feature image, 3 pins. 7:2197.
import { pageHeader, footerBar } from "../frame.js";
import { crAnnotated, crPinImg } from "../creative-blocks.js";

export const ANNO_HEAD = { caption: "Art Direction", title: "Imagery", subtitle: "Guidelines" };
export const annoItems = (n) => Array.from({ length: n }, (_, k) => ({ n: k + 1 }));

export default {
  name: "creative/grid-32", slide: 227, figmaNode: "7:2197",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "An annotated feature photo with numbered pins beside a numbered legend.",
  media: ["photo", "text"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 3, stats: 0, icons: 0 },
  description: "creative/grid-32 — annotated photo (3 pins) + numbered legend.",
  schema: { meta: "{ studio, name, page }", header: "{ caption, title, subtitle }", items: "[{ n, body }]", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render(s) {
    const left = crPinImg(0, [
      { x: 20.9, y: 27.9, n: 1 }, { x: 78.6, y: 47.6, n: 2 }, { x: 33.7, y: 70.2, n: 3 },
    ]);
    return crAnnotated(s, {
      leftW: 908, rightW: 908, left,
      head: { ...ANNO_HEAD, ...(s.header || {}) }, items: s.items || annoItems(3),
    }, { pageHeader, footerBar });
  },
};
