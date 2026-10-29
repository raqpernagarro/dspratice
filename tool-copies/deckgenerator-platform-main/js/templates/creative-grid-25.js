// Template: creative/grid-25 — a full-bleed four-column staggered photo wall; each column
// of three tall images is offset by a different amount so the wall bleeds off the top and
// bottom edges. Edge-to-edge horizontally. Source frame 7:1723.
import { crWall } from "../creative-blocks.js";

const W = 462, H = 1782, IH = 578;
const col = (x, y, a, b, c) => ({ x, y, w: W, h: H, imgs: [
  { y: 0, h: IH, i: a }, { y: 602, h: IH, i: b }, { y: 1204, h: IH, i: c } ] });

export default {
  name: "creative/grid-25", slide: 211, figmaNode: "7:1723",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed four-column staggered photo wall, edge-to-edge, bleeding top and bottom.",
  media: ["photo"], capacity: { items: 12, min: 12, max: 12 },
  slots: { images: 12, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-25 — full-bleed staggered 4-column photo wall, edge-to-edge.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render() {
    return crWall([
      col(0, -554, 0, 1, 2),
      col(486, -324, 3, 4, 5),
      col(972, -144, 6, 7, 8),
      col(1458, -324, 9, 10, 11),
    ]);
  },
};
