// Template: portfolio/split-05 — a full-bleed pairing: one large photo on the
// left, a 2×2 grid of photos on the right, no chrome. Source Figma frame
// 109:10521.
import { esc } from "../components.js";
import { SAMPLE, tile } from "../blocks.js";

export default {
  name: "portfolio/split-05",
  slide: 98,
  figmaNode: "109:10521",
  family: "portfolio", role: "gallery", shape: "split", theme: "light", chrome: false,
  use: "A full-bleed pairing: one large photo on the left, a 2×2 grid of photos on the right.",
  media: ["photo"],
  capacity: { items: 5, min: 3, max: 5 },
  slots: { images: 5, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/split-05 — full-bleed big photo + 2×2 grid.",
  schema: {
    images: "array of 5 photo paths (first is the large left photo)",
  },
  example: { images: [SAMPLE[3], SAMPLE[8], SAMPLE[12], SAMPLE[16], SAMPLE[0]] },
  render(s) {
    const imgs = (s.images && s.images.length ? s.images : SAMPLE).slice(0, 5);
    const big = imgs[0];
    const grid = imgs.slice(1, 5).map(tile).join("");
    return `
      <div class="v2f-pf-duo reveal">
        <div class="half">${big ? `<img src="${esc(big)}" alt="">` : ""}</div>
        <div class="grid2">${grid}</div>
      </div>`;
  },
};
