// Template: portfolio/split-06 — a full-bleed photo collage: two columns, each a
// pair of photos and a wide photo. No chrome. Source Figma frame 109:10531.
import { SAMPLE, tile } from "../blocks.js";

export default {
  name: "portfolio/split-06",
  slide: 99,
  figmaNode: "109:10531",
  family: "portfolio", role: "gallery", shape: "collage", theme: "light", chrome: false,
  use: "A full-bleed photo collage of six photos in two columns.",
  media: ["photo"],
  capacity: { items: 6, min: 4, max: 6 },
  slots: { images: 6, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/split-06 — full-bleed 6-photo collage.",
  schema: { images: "array of 6 photo paths" },
  example: { images: [SAMPLE[0], SAMPLE[4], SAMPLE[8], SAMPLE[11], SAMPLE[2], SAMPLE[15]] },
  render(s) {
    const im = (s.images && s.images.length ? s.images : SAMPLE).slice(0, 6);
    return `
      <div class="v2f-pf-bleed reveal">
        <div class="col">
          <div class="row">${tile(im[0])}${tile(im[1])}</div>
          <div class="row">${tile(im[2])}</div>
        </div>
        <div class="col">
          <div class="row">${tile(im[3])}</div>
          <div class="row">${tile(im[4])}${tile(im[5])}</div>
        </div>
      </div>`;
  },
};
