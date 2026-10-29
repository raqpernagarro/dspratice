// Template: creative/grid-26 — a full-bleed four-column staggered photo wall like grid-25,
// with a 40px side margin (bleeds only off the top and bottom). Source frame 7:1660.
import { crWall } from "../creative-blocks.js";

const W = 442, H = 1704, IH = 552;
const col = (x, y, a, b, c) => ({ x, y, w: W, h: H, imgs: [
  { y: 0, h: IH, i: a }, { y: 576, h: IH, i: b }, { y: 1152, h: IH, i: c } ] });

export default {
  name: "creative/grid-26", slide: 212, figmaNode: "7:1660",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed four-column staggered photo wall bleeding off the top and bottom.",
  media: ["photo"], capacity: { items: 12, min: 12, max: 12 },
  slots: { images: 12, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-26 — full-bleed staggered 4-column photo wall, side margins.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render() {
    return crWall([
      col(40, -506, 0, 1, 2),
      col(506, -286, 3, 4, 5),
      col(972, -116, 6, 7, 8),
      col(1438, -286, 9, 10, 11),
    ]);
  },
};
