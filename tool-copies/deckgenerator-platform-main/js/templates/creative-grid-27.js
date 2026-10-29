// Template: creative/grid-27 — a clean, even four-column by two-row photo grid (eight equal
// portrait cells), inset with a 40px margin, no bleed. Source frame 2:768.
import { crWall } from "../creative-blocks.js";

const W = 442, H = 1000, IH = 488;
const col = (x, a, b) => ({ x, y: 40, w: W, h: H, imgs: [
  { y: 0, h: IH, i: a }, { y: 512, h: IH, i: b } ] });

export default {
  name: "creative/grid-27", slide: 213, figmaNode: "2:768",
  family: "creative", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A clean even four-column by two-row photo grid of eight equal portrait cells.",
  media: ["photo"], capacity: { items: 8, min: 8, max: 8 },
  slots: { images: 8, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "creative/grid-27 — even 4-column × 2-row photo grid, eight equal cells.",
  schema: { meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }" },
  example: { meta: { studio: "Product Studio", name: "Presentation Name", page: "01" } },
  render() {
    return crWall([
      col(40, 0, 1),
      col(506, 2, 3),
      col(972, 4, 5),
      col(1438, 6, 7),
    ]);
  },
};
