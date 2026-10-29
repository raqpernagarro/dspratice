// Template: creative/grid-23 — a full-bleed staggered photo wall: five columns of portrait
// images taller than the frame, alternating columns offset up/down so the wall bleeds off
// the top and bottom edges. Source frame 3:501.
import { crWall } from "../creative-blocks.js";

const W = 348.8, H = 1000, IH = 620;
// odd columns (3 images) sit high; even columns (2 images) sit lower
const three = (x, a, b, c) => ({ x, y: 40, w: W, h: H, imgs: [
  { y: -454, h: IH, i: a }, { y: 190, h: IH, i: b }, { y: 834, h: IH, i: c } ] });
const two = (x, a, b) => ({ x, y: 40, w: W, h: H, imgs: [
  { y: -132, h: IH, i: a }, { y: 512, h: IH, i: b } ] });

export default {
  name: "creative/grid-23", slide: 209, figmaNode: "3:501",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A full-bleed staggered five-column photo wall that bleeds off the top and bottom.",
  media: ["photo"], capacity: { items: 13, min: 13, max: 13 },
  slots: { images: 13, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-23 — full-bleed staggered 5-column photo wall.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render() {
    return crWall([
      three(40, 0, 1, 2),
      two(412.8, 3, 4),
      three(785.6, 5, 6, 7),
      two(1158.4, 8, 9),
      three(1531.2, 10, 11, 12),
    ]);
  },
};
