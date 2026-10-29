// Template: portfolio/split-07 — a full-bleed pairing: one large photo on the
// left, a wide photo over two photos on the right. No chrome. Source Figma frame
// 109:10656.
import { esc } from "../components.js";
import { SAMPLE, tile } from "../blocks.js";

export default {
  name: "portfolio/split-07",
  slide: 106,
  figmaNode: "109:10656",
  family: "portfolio", role: "gallery", shape: "collage", theme: "light", chrome: false,
  use: "A full-bleed pairing: one large photo on the left, a wide photo over two photos on the right.",
  media: ["photo"],
  capacity: { items: 4, min: 3, max: 4 },
  slots: { images: 4, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/split-07 — full-bleed big photo + [wide, 2] collage.",
  schema: { images: "array of 4 photo paths (first is the large left photo)" },
  example: { images: [SAMPLE[5], SAMPLE[10], SAMPLE[13], SAMPLE[1]] },
  render(s) {
    const im = (s.images && s.images.length ? s.images : SAMPLE).slice(0, 4);
    return `
      <div class="v2f-pf-bleed reveal">
        <div class="col"><div class="row">${im[0] ? `<div class="v2f-tile"><img src="${esc(im[0])}" alt=""></div>` : ""}</div></div>
        <div class="col">
          <div class="row">${tile(im[1])}</div>
          <div class="row">${tile(im[2])}${tile(im[3])}</div>
        </div>
      </div>`;
  },
};
