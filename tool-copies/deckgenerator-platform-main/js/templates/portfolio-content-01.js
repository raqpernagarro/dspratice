// Template: portfolio/content-01 — a full-bleed photo wall: a brick-offset grid
// of images running off every edge (no chrome). Source Figma frame 109:10503.
import { SAMPLE, tile } from "../blocks.js";

export default {
  name: "portfolio/content-01",
  slide: 97,
  figmaNode: "109:10503",
  family: "portfolio", role: "content", shape: "fullbleed", theme: "light", chrome: false,
  use: "A full-bleed photo wall — a brick-offset grid of images running off every edge, no chrome.",
  media: ["photo"],
  capacity: { items: 13, min: 8, max: 13 },
  slots: { images: 13, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/content-01 — full-bleed brick-offset photo wall.",
  schema: {
    images: "array of photo paths (laid out in rows of 4 / 5 / 4)",
  },
  example: { images: SAMPLE.slice(0, 13) },
  render(s) {
    const imgs = (s.images && s.images.length ? s.images : SAMPLE).slice(0, 13);
    const row = (arr) => `<div class="v2f-pf-wallrow">${arr.map(tile).join("")}</div>`;
    const rowOff = (arr) => `<div class="v2f-pf-wallrow off">${arr.map(tile).join("")}</div>`;
    return `
      <div class="v2f-pf-wall reveal">
        ${row(imgs.slice(0, 4))}
        ${rowOff(imgs.slice(4, 9))}
        ${row(imgs.slice(9, 13))}
      </div>`;
  },
};
