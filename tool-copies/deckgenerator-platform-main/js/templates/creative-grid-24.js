// Template: creative/grid-24 — a full-bleed staggered photo wall like grid-23 but edge-to-
// edge horizontally (five slightly wider columns, taller images). Source frame 3:577.
import { crWall } from "../creative-blocks.js";

const W = 364.8, H = 1000, IH = 648;
const three = (x, a, b, c) => ({ x, y: 40, w: W, h: H, imgs: [
  { y: -496, h: IH, i: a }, { y: 176, h: IH, i: b }, { y: 848, h: IH, i: c } ] });
const two = (x, a, b) => ({ x, y: 40, w: W, h: H, imgs: [
  { y: -160, h: IH, i: a }, { y: 512, h: IH, i: b } ] });

export default {
  name: "creative/grid-24", slide: 210, figmaNode: "3:577",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed staggered five-column photo wall, edge-to-edge horizontally.",
  media: ["photo"], capacity: { items: 13, min: 13, max: 13 },
  slots: { images: 13, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-24 — full-bleed staggered 5-column photo wall, edge-to-edge.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render() {
    return crWall([
      three(0, 0, 1, 2),
      two(388.8, 3, 4),
      three(777.6, 5, 6, 7),
      two(1166.4, 8, 9),
      three(1555.2, 10, 11, 12),
    ]);
  },
};
