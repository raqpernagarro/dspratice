// Template: portfolio/split-03 — a full-frame photo collage, no text: a left
// column (one wide photo above two squares) beside one full-height photo on the
// right. Source Figma frame 109:10391.
import { tile, SAMPLE } from "../blocks.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/split-03",
  slide: 88,
  figmaNode: "109:10391",
  family: "portfolio", role: "gallery", shape: "grid", count: 4, theme: "light", chrome: false,
  use: "A full-frame 2×2 collage of project photos.",
  media: ["photo"],
  capacity: { items: 4, min: 2, max: 4 },
  slots: { images: 4, titles: 0, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "portfolio/split-03 — collage: wide + two squares left, one tall photo right.",
  schema: {
    images: "array of up to 4 photo paths",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    images: [SAMPLE[2], SAMPLE[5], SAMPLE[9], SAMPLE[13]],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "183" },
  },
  render(s) {
    const img = (s.images || []).slice(0, 4);
    const middle = `
      <div class="v2f-pf-collage3 reveal">
        <div class="col">
          <div class="row">${tile(img[0])}</div>
          <div class="row">${tile(img[1])}${tile(img[2])}</div>
        </div>
        <div class="col"><div class="row">${tile(img[3])}</div></div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
